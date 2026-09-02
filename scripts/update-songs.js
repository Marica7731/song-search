const fs = require('fs');
const path = require('path');
const { cleanSongTitle } = require('./title-cleaning');
const {
    assertCandidateCoversExisting,
    assertRunMadeProgress,
    assertSourceRefreshSafe,
    countStoredSongs,
    getReliableWinner
} = require('./update-songs-guard');
const { loadBiliCollectionCandidates, loadBiliPageList } = require('./bilibili-page-api');
const {
    DEFAULT_MIN_COLLECTION_BVIDS,
    DEFAULT_PROBE_COUNT,
    selectLowestViewCandidates
} = require('./bvid-probe-selection');

// ================= 关键兼容：适配全局安装的 Puppeteer =================
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (err) {
    try {
        const globalModules = path.resolve(process.execPath, '../..', 'lib/node_modules');
        puppeteer = require(path.join(globalModules, 'puppeteer'));
    } catch (globalErr) {
        console.error('❌ Puppeteer 未安装，请执行 npm install puppeteer 或 npm install -g puppeteer');
        process.exit(1);
    }
}

const DEFAULT_ARTIST_TEXT = '来源处未提供标准格式歌手';
const SPECIAL_BRACKET_ARTIST_SET = new Set(['[Alexandros]', '[ALEXANDROS]']);
const LEADING_SOURCE_REGEX = /^(?:\s*【[^】]+】)+\s*/;
const SOURCE_PROFILE_PATH = path.join(__dirname, 'source-profiles.json');
const ALLOW_SOURCE_SHRINK = process.env.ALLOW_SOURCE_SHRINK === '1';

function stringHash(value) {
    let hash = 0;
    String(value || '').split('').forEach(ch => {
        hash = ((hash << 5) - hash) + ch.charCodeAt(0);
        hash |= 0;
    });
    return Math.abs(hash);
}

function getDefaultAvatarText(alias) {
    const chars = Array.from(String(alias || '').trim());
    const picked = chars.find(ch => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9]/u.test(ch));
    return (picked || '源').toUpperCase();
}

function normalizeProfileUrl(value) {
    const text = String(value || '').trim();
    return /^https?:\/\//i.test(text) ? text : '';
}

function loadSourceProfileOverrides() {
    if (!fs.existsSync(SOURCE_PROFILE_PATH)) return {};
    try {
        const parsed = JSON.parse(fs.readFileSync(SOURCE_PROFILE_PATH, 'utf8'));
        const profiles = parsed?.profiles && typeof parsed.profiles === 'object'
            ? parsed.profiles
            : parsed;
        return profiles && typeof profiles === 'object' && !Array.isArray(profiles) ? profiles : {};
    } catch (err) {
        console.warn(`⚠️  来源头像配置读取失败：${err.message}`);
        return {};
    }
}

function pickProfileOverride(overrides, keys) {
    if (!overrides || typeof overrides !== 'object') return {};
    const candidates = keys
        .map(key => String(key || ''))
        .filter(Boolean);
    for (const key of candidates) {
        if (overrides[key]) return overrides[key];
    }
    const normalized = new Set(candidates.map(key => key.trim()).filter(Boolean));
    for (const [key, value] of Object.entries(overrides)) {
        if (normalized.has(String(key || '').trim())) return value;
    }
    return {};
}

function buildSourceProfile(config, overrides) {
    const alias = config.alias || config.resolvedFile || '来源';
    const raw = pickProfileOverride(overrides, [config.resolvedFile, alias]);
    const avatarText = String(raw.avatarText || '').trim() || getDefaultAvatarText(alias);
    const profile = {
        alias,
        avatarText,
        avatarUrl: normalizeProfileUrl(raw.avatarUrl),
        youtubeUrl: normalizeProfileUrl(raw.youtubeUrl || raw.youtubeChannelUrl),
        accentColor: String(raw.accentColor || '').trim() || `hsl(${stringHash(config.resolvedFile || alias) % 360} 55% 36%)`,
        statsAvgSortDeferred: raw.statsAvgSortDeferred === true
    };
    if (config.archived) {
        profile.archived = true;
        const reason = String(config.archiveReason || '').trim();
        if (reason) profile.archiveReason = reason;
    }
    return profile;
}

function readPositiveIntegerEnv(name, fallback) {
    const parsed = Number.parseInt(process.env[name] || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readRatioEnv(name, fallback) {
    const parsed = Number.parseFloat(process.env[name] || '');
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

async function withRetry(fn, maxRetries = 3, delay = 5000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            console.log(`⚠️  第 ${attempt} 次尝试失败，${delay / 1000}秒后重试... 错误：${err.message.slice(0, 100)}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

const DELAY_TIME = 1500;
const BILI_VIDEO_PREFIX = 'https://www.bilibili.com/video/';
const BV_REGEX = /BV[0-9a-zA-Z]+/;
const SAMPLE_SIZE = DEFAULT_PROBE_COUNT;
const MIN_COLLECTION_BVIDS = DEFAULT_MIN_COLLECTION_BVIDS;
const HISTORY_RUN_WINDOW = 5;
const MAX_SOURCE_DROP_RATIO = readRatioEnv('MAX_SOURCE_DROP_RATIO', 0.15);
const MIN_SOURCE_DROP_SONGS = readPositiveIntegerEnv('MIN_SOURCE_DROP_SONGS', 100);
const SOURCE_FILTER = String(process.env.UPDATE_SONGS_ONLY || '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
const PLAYLIST_SELECTORS = ['.video-pod__list .pod-item'];
const PART_TITLE_SELECTORS = [
    '.page-list .page-item.sub .title-txt',
    '.title .title-txt'
];
const COLLECTION_TITLE_SELECTORS = [
    '.head .title .title-txt',
    '.video-pod__header .header-top .left .title',
    '.title .title-txt'
];

// ==========================================
// 🔧 配置区
// ==========================================
const SINGER_CONFIGS = [
    { bvids: ["BV1JRwUzoEpM","BV1icwSzXEYv"], file: "asuyumekanae", alias: "明日夢かなえ" },
    { bvids: ["BV1owcoz3Ekw"], file: "chiyutori ", alias: "知悠" },
    { bvids: ["BV1R2wQzfEuY"], file: "momijimaru", alias: "紅葉丸", archived: true, archiveReason: "保留历史数据，不再刷新" },
    { bvids: ["BV1G4wxzmEV5"], file: "kukuri", alias: "戸鎖くくり" },
    { bvids: ["BV1G6fLB7Efr","BV1J5P7zrEB3"], file: "naraetan", alias: "なれたん Naraetan" },
    { bvids: ["BV1HRfuBCEXN"], file: "figaro", alias: "Figaro" },
    { bvids: ["BV1cofuBGEkX","BV1JgMK6uEDQ"], file: "ririsya", alias: "凛凛咲 ririsya" },
    { bvids: ["BV1ve411z7Nm"], file: "suu_usuwa", alias: "稀羽すう Suu_Usuwa" },
    { bvids: ["BV1mJZwB8EVa"], file: "ray", alias: "來-Ray-" },
    { bvids: ["BV1JSZHBrEVw"], file: "sakusan", alias: "酢酸 / SAKUSAN" },
    { bvids: ["BV1p1zBBCEZ3","BV1J3MK6BEfL"], file: "yoshika", alias: "よしか YOSHIKA" },
    { bvids: ["BV1aDzEBBE3S"], file: "yuri", alias: "優莉 yuri" },
    { bvids: ["BV1zzZPBsEum"], file: "otomoneruki", alias: "音門るき" },
    { bvids: ["BV1hw4m1i7qN"], file: "linon", alias: "天籠りのん" },
    { bvids: ["BV1MEP8z4E1J"], file: "stella", alias: "天ノ譜ステラ" },
    { bvids: ["BV11fQSB2ELX"], file: "hoshiho", alias: "HoshiHo" },
    { bvids: ["BV167c2znErj"], file: "shuna", alias: "朱名" },
    { bvids: ["BV1GXYFzXETo","BV1MPpUzsE1D","BV184W5zeE1Z"], file: "nayuta", alias: "nayuta" },
    { bvids: ["BV1UCkhBkEon"], file: "MunMosh", alias: "むんもっしゅ" },
    { bvids: ["BV1NNdeBVEGd"], file: "kotatsu", alias: "KOTATSU" },
    { bvids: ["BV1kLXbBJEiZ"], file: "sumica", alias: "澄花" },
    { bvids: ["BV1KHXxBUErU","BV1iHQXBzEgU"], file: "romany", alias: "ロマニ" },
    { bvids: ["BV1mNpUzXEiW"], file: "friends", alias: "联动" },
    { bvids: ["BV1rkCTYzEZN","BV1wt421j7gT","BV1KpCdYmE3T","BV1aC4ce2E5s","BV1JbX9BmE5m","BV1nJ5S6CETQ","BV1duSRBBEkb"], file: "relay", alias: "接力" },
    { bvids: ["BV1tKcZztEw5"], file: "hasumisahiro", alias: "羽澄さひろ" },
    { bvids: ["BV18xo1BHEkX"], file: "aimarun", alias: "あいまるん。" },
    { bvids: ["BV1wHQVBTEU5"], file: "nanashirikka", alias: "ななし律歌" },
    { bvids: ["BV1YtwtzREbp"], file: "gabinoheya", alias: "がびのお部屋" },
    { bvids: ["BV1KSRXBwE2v"], file: "stratia", alias: "すとらてぃあ-Stratia" },
    { bvids: ["BV1sU5S69E8r"], file: "karakurinne", alias: "からくりんね-KarakuRinne" },
    { bvids: ["BV1d85B6TEFa"], file: "kyoka", alias: "響架" },
    { bvids: ["BV1qDDbBBETv"], file: "noapolaris", alias: "ノア・ポラリス" },
    { bvids: ["BV12mQ3B6EpP"], file: "mikage", alias: "深影" },
    { bvids: ["BV179L66pE1f"], file: "yamadasharo", alias: "山田シャロ" },
    { bvids: ["BV1PLQVB3E9e"], file: "tulsi", alias: "魔王トゥルシー" },
    { bvids: ["BV1p7DtBGEfy"], file: "luminous", alias: "るみなす・すいーと" },
    { bvids: ["BV134wAzJEph"], file: "hinachibi", alias: "緋那ちび" },
    { bvids: ["BV1LgVc6aEuV"], file: "kanaruhanon", alias: "香鳴ハノン" },
    { bvids: ["BV1dE42137AT"], file: "azki", alias: "AZKi" },
    { bvids: ["BV1CbVk68ESd"], file: "toka10summer", alias: "透夏" },
    { bvids: ["BV1LnSSBdEeq"], file: "ibaramuan", alias: "茨むあん" },
    { bvids: ["BV1r75B6LEwd"], file: "323", alias: "323" },
    { bvids: ["BV1TqGY6gEEf"], file: "minaton", alias: "みなとん" },
    { bvids: ["BV11GZtBcEsp"], file: "culua", alias: "CULUA" },
    { bvids: ["BV1kM3L6GEBV"], file: "choma", alias: "チョま" },
    { bvids: ["BV1xucZzxEkZ","BV117P2zwEuq","BV1LJ4m1A7FC"], file: "others", alias: "非常驻妹妹" },
    { bvids: ["BV1S4TT6pEn4"], file: "neno", alias: "碧生ねの" },
    { bvids: ["BV1jyjK6sEns"], file: "suzuhanainori", alias: "鈴花いのり" },
    { bvids: ["BV1AFG66UEpL"], file: "chiyourachomi", alias: "千代浦蝶美" },
    { bvids: ["BV1nUMP6vE7N"], file: "tamamachipue", alias: "玉町ぷえ" },
    { bvids: ["BV1co7i6QEez"], file: "isshikiizu", alias: "一色イズ" },
    { bvids: ["BV1jaYQeUEgM"], file: "hanamaruhareru", alias: "花丸晴琉", rawDataLoader: "bili-view-api" },
    { bvids: ["BV1H9ekeiEaB"], file: "hanabasamikyo", alias: "花鋏キョウ", rawDataLoader: "bili-view-api" },
    { bvids: ["BV1Qa9JB6EAw"], alias: "陽月るるふ" },
    { bvids: ["BV1oeMx6WEve"], file: "ronaru", alias: "炉なる" },
    { bvids: ["BV1oHAVzxE2q"], file: "manomueru", alias: "魔ノむえる" },
    { bvids: ["BV1ybNo67EQ5"], file: "sensational", alias: "Sen†Sational" },
    { bvids: ["BV1dfjx61Eri"], file: "hanamaeharu", alias: "花前ハル" },
    { bvids: ["BV1C7ND6hExv"], file: "suiuishino", alias: "翠雨 しの" },
    { bvids: ["BV1yVVe6BE16"], file: "amamiruka", alias: "雨海ルカ" },
    { bvids: ["BV1an7E6pEUw"], file: "koyoiinari", alias: "狐宵いなり" },
    { bvids: ["BV1PE7J6CESH"], file: "otowarara", alias: "音羽ララ" },
    { bvids: ["BV1MAjT6GEF7"], file: "yuni", alias: "YuNi" },
    { bvids: ["BV1iXKY6qEKv"], file: "peruciaten", alias: "ぺるしあ・てん" }
];

function resolveConfig(config) {
    const alias = config.alias || config.file || config.bvids?.[0] || 'unknown';
    if (config.file) {
        return { ...config, alias, resolvedFile: config.file };
    }

    const aliasSlug = String(alias)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const fallbackSlug = String(config.bvids?.[0] || 'source').toLowerCase();

    return {
        ...config,
        alias,
        resolvedFile: aliasSlug || fallbackSlug
    };
}

const RESOLVED_SINGER_CONFIGS = SINGER_CONFIGS.map(resolveConfig);
const SOURCE_PROFILE_OVERRIDES = loadSourceProfileOverrides();

const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, '..', 'data');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');
const SAMPLING_STATE_PATH = path.join(REPORTS_DIR, 'github-bv-sampling-state.json');
const BILI_VIDEO_URL = (bvid) => `https://www.bilibili.com/video/${bvid}`;

function resolveBrowserExecutable() {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const platform = process.platform;
    const candidates = platform === 'win32'
        ? [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        ]
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/snap/bin/chromium'
        ];

    return candidates.find(filePath => fs.existsSync(filePath)) || null;
}

async function loadVideoPageWithBrowser(bvid) {
    const url = BILI_VIDEO_URL(bvid);
    let browser;
    try {
        const executablePath = resolveBrowserExecutable();
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled', '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36', '--disable-gpu', '--window-size=1920,1080'],
            ...(executablePath ? { executablePath } : {})
        });
        const page = await browser.newPage();
        await page.setExtraHTTPHeaders({ 'Referer': 'https://www.bilibili.com/', 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' });
        await page.evaluateOnNewDocument(() => { delete window.navigator.webdriver; });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, DELAY_TIME));

        const rawData = await page.evaluate((PS, PTS, CTS, inputBvid) => {
            const BV_REGEX = /BV[0-9a-zA-Z]+/;
            function qSF(c, s) { for (const sel of s) { const e = c.querySelector(sel); if (e) return e; } return null; }
            function qSAF(c, s) { for (const sel of s) { const e = c.querySelectorAll(sel); if (e.length > 0) return e; } return []; }

            let containers = [];
            for (const sel of PS) {
                containers = document.querySelectorAll(sel);
                if (containers.length > 0) break;
            }
            if (containers.length === 0) return null;

            return Array.from(containers).map((container, idx) => {
                const colTitleNode = qSF(container, CTS);
                const colTitle = colTitleNode?.textContent.trim() || `合集${idx + 1}`;
                let upName = "未知UP主";
                const upMatch = colTitle.match(/\[([^\]]+?\s*Ch\.[^\]]+)\]/);
                if (upMatch) upName = upMatch[1];
                else { const upEle = document.querySelector('.up-name'); if (upEle) upName = upEle.textContent.trim(); }

                let partNodes = qSAF(container, [PTS[0]]);
                let parts = Array.from(partNodes).map(node => node.textContent.trim());
                if (parts.length === 0) {
                    const sTN = qSF(container, [PTS[1]]);
                    if (sTN) parts.push(sTN.textContent.trim());
                    else if (colTitleNode) parts.push(colTitle);
                }

                let collectionBv = inputBvid;
                const dataKey = container.dataset.key;
                if (dataKey) {
                    const matchResult = dataKey.match(BV_REGEX);
                    if (matchResult && matchResult[0]) collectionBv = matchResult[0];
                }
                return { collectionBv, collectionTitle: colTitle, up: upName, parts };
            });
        }, PLAYLIST_SELECTORS, PART_TITLE_SELECTORS, COLLECTION_TITLE_SELECTORS, bvid);

        await browser.close();
        return rawData;
    } catch (err) {
        if (browser) await browser.close();
        throw new Error(`浏览器加载失败: ${err.message}`);
    }
}

function loadSamplingState() {
    if (!fs.existsSync(SAMPLING_STATE_PATH)) {
        return { version: 1, updatedAt: null, entries: {} };
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(SAMPLING_STATE_PATH, 'utf8'));
        return {
            version: 1,
            updatedAt: parsed.updatedAt || null,
            entries: parsed.entries && typeof parsed.entries === 'object' ? parsed.entries : {}
        };
    } catch (err) {
        console.warn(`⚠️  抽样状态读取失败，将重新生成：${err.message}`);
        return { version: 1, updatedAt: null, entries: {} };
    }
}

function saveSamplingState(state) {
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    state.version = 1;
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(SAMPLING_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function getEntryKey(config, entryBvid) {
    return `${config.resolvedFile}|${entryBvid}`;
}

function getEntryState(state, config, entryBvid) {
    const key = getEntryKey(config, entryBvid);
    if (!state.entries[key]) {
        state.entries[key] = {
            sourceFile: config.resolvedFile,
            alias: config.alias,
            entryBvid,
            candidates: [entryBvid],
            recentRuns: []
        };
    }
    return state.entries[key];
}

function parseRawDataToSongs(rawData, config) {
    const songs = [];
    const { resolvedFile } = config;

    (rawData || []).forEach(col => {
        (col.parts || []).forEach((p, i) => {
            let cleanTitle = cleanSongTitle(p);
            const rawArtistCandidate = String(p || '')
                .split(' - ')
                .slice(-1)[0]
                .replace(LEADING_SOURCE_REGEX, '')
                .trim();

            // Keep semantic bracketed title suffixes; remove only known upload artifacts.
            const artifactRegex = /(\s*\(\d+\)|_(sub|copy|backup|1080p|720p|\d+))$/i;
            cleanTitle = cleanSongTitle(cleanTitle);

            let artist = DEFAULT_ARTIST_TEXT;
            let songTitle = cleanTitle;

            if (cleanTitle.includes(' - ')) {
                const titleParts = cleanTitle.split(' - ');
                songTitle = cleanSongTitle(titleParts[0]);
                artist = titleParts[titleParts.length - 1].replace(artifactRegex, '').trim();
                if (!artist && SPECIAL_BRACKET_ARTIST_SET.has(rawArtistCandidate)) {
                    artist = rawArtistCandidate;
                }
                if (!artist) {
                    artist = DEFAULT_ARTIST_TEXT;
                }
            }

            let link = null;
            if (BV_REGEX.test(col.collectionBv)) {
                link = `${BILI_VIDEO_PREFIX}${col.collectionBv}?p=${i + 1}`;
            }

            songs.push({
                title: songTitle,
                artist: artist,
                collection: col.collectionTitle,
                up: col.up,
                link: link,
                source: `${resolvedFile}.js`
            });
        });
    });

    return songs;
}

function dedupeSongs(songs) {
    const seen = new Set();
    return songs.filter(song => {
        const key = [song.title, song.artist, song.collection, song.link].join('\u0001');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function loadRawDataWithRetry(config, bvid) {
    return withRetry(async () => {
        const data = config.rawDataLoader === 'bili-view-api'
            ? await loadBiliPageList(bvid)
            : await loadVideoPageWithBrowser(bvid);
        if (!data || data.length === 0) {
            throw new Error('未解析到有效列表数据');
        }
        return data;
    }, 3, 5000);
}

async function parseCandidateBvid(config, bvid, cachedRawData = null) {
    const rawData = cachedRawData || await loadRawDataWithRetry(config, bvid);
    const songs = parseRawDataToSongs(rawData, config);
    if (songs.length === 0) {
        throw new Error('未解析到有效歌曲数据');
    }
    return {
        bvid,
        rawData,
        songs
    };
}

async function processEntryBvid(config, entryBvid, samplingState) {
    const entryState = getEntryState(samplingState, config, entryBvid);
    console.log(`  🔎 入口 BV: ${entryBvid}，读取完整合集稿件元数据...`);

    const collectionCandidates = await withRetry(
        () => loadBiliCollectionCandidates(entryBvid),
        3,
        5000
    );
    const selection = selectLowestViewCandidates(collectionCandidates, {
        minimumCollectionSize: MIN_COLLECTION_BVIDS,
        probeCount: SAMPLE_SIZE
    });
    if (!selection.eligible) {
        throw new Error(
            `合集只有 ${selection.total} 个独立 BVID，少于 ${MIN_COLLECTION_BVIDS} 个；` +
            '本轮不启动候选探针并保留旧文件'
        );
    }

    const candidatePool = collectionCandidates.map(candidate => candidate.bvid);
    entryState.candidates = candidatePool;
    const selected = selection.selected;
    const attempted = new Set();
    const results = [];

    console.log(
        `  📉 合集 ${selection.total} 个独立 BVID，探针最低播放量 3 个：` +
        selected.map(candidate => `${candidate.bvid}(${candidate.viewCount})`).join(', ')
    );
    for (const candidate of selected) {
        const sampleBvid = candidate.bvid;
        attempted.add(sampleBvid);
        try {
            const result = await parseCandidateBvid(config, sampleBvid);
            results.push(result);
            console.log(`    ✅ ${sampleBvid} (${candidate.viewCount} 播放): ${result.songs.length} 首`);
        } catch (err) {
            console.warn(`    ⚠️  ${sampleBvid} 探针失败：${err.message}`);
        }
    }

    if (results.length === 0) {
        throw new Error(`入口 ${entryBvid} 的最低播放量 3 个探针均未解析到有效歌曲数据`);
    }

    const previousWinner = getReliableWinner(entryState, candidatePool);
    results.sort((a, b) => b.songs.length - a.songs.length);
    const winner = results[0];
    assertSourceRefreshSafe({
        alias: `${config.alias}/${entryBvid}`,
        configuredBvids: [entryBvid],
        failedBvids: [],
        previousCount: previousWinner?.songCount || 0,
        nextCount: winner.songs.length,
        maxDropRatio: MAX_SOURCE_DROP_RATIO,
        minDropSongs: MIN_SOURCE_DROP_SONGS
    });
    entryState.candidates = candidatePool;
    entryState.lastRunAt = new Date().toISOString();
    entryState.recentRuns = Array.isArray(entryState.recentRuns) ? entryState.recentRuns : [];
    const runRecord = {
        runAt: entryState.lastRunAt,
        sampled: Array.from(attempted),
        sampledViewCounts: Object.fromEntries(
            selected.map(candidate => [candidate.bvid, candidate.viewCount])
        ),
        selection: 'lowest-manuscript-views',
        winner: winner.bvid,
        winnerSongCount: winner.songs.length,
        candidateCount: entryState.candidates.length,
        accepted: false
    };
    entryState.recentRuns.push(runRecord);
    entryState.recentRuns = entryState.recentRuns.slice(-HISTORY_RUN_WINDOW);

    console.log(`  🏆 采用 ${winner.bvid}: ${winner.songs.length} 首`);
    return { songs: winner.songs, runRecord };
}

function shouldProcessConfig(config) {
    if (config.archived) {
        console.log(`   🗄️  跳过封存来源: ${config.alias}`);
        return false;
    }
    if (SOURCE_FILTER.length === 0) return true;
    const fields = [
        config.resolvedFile,
        config.alias,
        ...(config.bvids || [])
    ].map(value => String(value || '').toLowerCase());
    return SOURCE_FILTER.some(filter => fields.some(value => value.includes(filter)));
}

// ==========================================
// 🔧 核心逻辑：按稿件播放量选择入口BV探针，保留后缀清洗
// ==========================================
async function processSinger(config, samplingState) {
    const { bvids, alias, resolvedFile } = config;
    console.log(`\n[开始处理] ${alias} (共 ${bvids.length} 个入口BV)...`);

    let allSongs = [];
    const failedBvids = [];
    const successfulRunRecords = [];

    for (const bvid of bvids) {
        try {
            const entryResult = await processEntryBvid(config, bvid, samplingState);
            allSongs.push(...entryResult.songs);
            successfulRunRecords.push(entryResult.runRecord);
        } catch (err) {
            failedBvids.push(bvid);
            console.warn(`  ⚠️  入口BV:${bvid} 处理失败，本轮不覆盖该来源。错误：${err.message}`);
        }

        if (bvids.indexOf(bvid) < bvids.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    allSongs = dedupeSongs(allSongs);
    const outputPath = path.join(DATA_DIR, `${resolvedFile}.js`);
    const previousContent = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    const previousCount = countStoredSongs(previousContent);

    assertSourceRefreshSafe({
        alias,
        configuredBvids: bvids,
        failedBvids,
        previousCount,
        nextCount: allSongs.length,
        maxDropRatio: MAX_SOURCE_DROP_RATIO,
        minDropSongs: MIN_SOURCE_DROP_SONGS
    });
    assertCandidateCoversExisting({
        alias,
        existingContent: previousContent,
        nextSongs: allSongs,
        allowSourceShrink: ALLOW_SOURCE_SHRINK
    });

    successfulRunRecords.forEach(run => {
        run.accepted = true;
    });

    if (allSongs.length === 0) throw new Error(`未解析到任何有效歌曲数据（所有入口BV均失败或无数据）`);

    let outputContent = `// ${alias} - 歌单数据 (多合集汇总)\n`;
    outputContent += `// 来源: ${bvids.join(', ')}\n`;
    outputContent += `// 生成时间: ${new Date().toLocaleString()}\n\n`;
    outputContent += `window.SONG_DATA = window.SONG_DATA || [];\n\nwindow.SONG_DATA.push(\n`;

    allSongs.forEach((song, idx) => {
        outputContent += `    ${JSON.stringify(song, null, 2)}${idx < allSongs.length - 1 ? "," : ""}\n`;
    });

    outputContent += `);\n`;
    fs.writeFileSync(outputPath, outputContent, { encoding: 'utf8', mode: 0o644 });
    console.log(`  ✅ 成功: 汇总 ${allSongs.length} 首歌曲 -> ${resolvedFile}.js`);
    return true;
}

function generateIndexJson() {
    const indexPath = path.join(DATA_DIR, 'index.json');
    const indexData = {
        files: RESOLVED_SINGER_CONFIGS.map(config => `${config.resolvedFile}.js`),
        fileToAlias: RESOLVED_SINGER_CONFIGS.reduce((map, config) => {
            map[config.resolvedFile] = config.alias;
            return map;
        }, {}),
        sourceProfiles: RESOLVED_SINGER_CONFIGS.reduce((map, config) => {
            map[config.resolvedFile] = buildSourceProfile(config, SOURCE_PROFILE_OVERRIDES);
            return map;
        }, {})
    };
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
}

async function main() {
    console.log("========================================");
    console.log("   🚀 B站直播源解析工具 (最低稿件播放量探针模式)");
    console.log("========================================");
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const samplingState = loadSamplingState();
    const configsToProcess = RESOLVED_SINGER_CONFIGS.filter(shouldProcessConfig);
    if (SOURCE_FILTER.length > 0) {
        console.log(`   🔎 仅处理来源: ${SOURCE_FILTER.join(', ')}`);
    }
    console.log(
        `   📉 合集至少 ${MIN_COLLECTION_BVIDS} 个独立 BVID 才探针，` +
        `每个入口固定选择播放量最低的 ${SAMPLE_SIZE} 个`
    );

    let successCount = 0;
    for (const config of configsToProcess) {
        try {
            // 外层依然保留整体重试（作为兜底，防止例如文件写入失败等非BV解析错误）
            // 但主要的BV级重试已经在 processSinger 内部完成
            await withRetry(() => processSinger(config, samplingState), 1, 5000);
            successCount++;
        } catch (err) { console.error(`  ❌ 最终失败: ${config.alias}`, err.message); }
        saveSamplingState(samplingState);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    assertRunMadeProgress(successCount, configsToProcess.length);
    generateIndexJson();
    saveSamplingState(samplingState);
    console.log("\n========================================");
    console.log(`   🏁 任务结束: 更新 ${successCount}/${configsToProcess.length} 位歌手`);
    console.log("========================================");
    process.exit(0);
}

main().catch(err => { console.error("❌ 全局错误:", err.message); process.exit(1); });
