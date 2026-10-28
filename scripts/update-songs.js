const fs = require('fs');
const path = require('path');
const { cleanSongTitle } = require('./title-cleaning');
const {
    assertCandidateCoversExisting,
    assertRunMadeProgress,
    assertSourceRefreshSafe,
    countStoredSongs,
    countStoredSongsForBvids,
    getRequiredCandidateBvids,
    getMissingStoredIdentitiesByBvid,
    getSongIdentity,
    getStoredSongIdentitiesByBvid,
    getReliableWinner
} = require('./update-songs-guard');
const { loadBiliCollectionMetadata, loadBiliPageList } = require('./bilibili-page-api');
const { groupCollectionEntries } = require('./bvid-collection-groups');
const {
    DEFAULT_MIN_COLLECTION_BVIDS,
    DEFAULT_PROBE_COUNT,
    getProbeCountForCollection,
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
    { bvids: ["BV1JRwUzoEpM"], file: "asuyumekanae", alias: "明日夢かなえ" },
    { bvids: ["BV1owcoz3Ekw"], file: "chiyutori ", alias: "知悠" },
    { bvids: ["BV1R2wQzfEuY"], file: "momijimaru", alias: "紅葉丸", archived: true, archiveReason: "保留历史数据，不再刷新" },
    { bvids: ["BV1G4wxzmEV5"], file: "kukuri", alias: "戸鎖くくり" },
    { bvids: ["BV1G6fLB7Efr"], file: "naraetan", alias: "なれたん Naraetan" },
    { bvids: ["BV1HRfuBCEXN"], file: "figaro", alias: "Figaro" },
    { bvids: ["BV1cofuBGEkX"], file: "ririsya", alias: "凛凛咲 ririsya" },
    { bvids: ["BV1ve411z7Nm"], file: "suu_usuwa", alias: "稀羽すう Suu_Usuwa" },
    { bvids: ["BV1mJZwB8EVa"], file: "ray", alias: "來-Ray-" },
    { bvids: ["BV1JSZHBrEVw"], file: "sakusan", alias: "酢酸 / SAKUSAN" },
    { bvids: ["BV1p1zBBCEZ3"], file: "yoshika", alias: "よしか YOSHIKA" },
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
    { bvids: ["BV1KHXxBUErU"], file: "romany", alias: "ロマニ" },
    { bvids: ["BV1mNpUzXEiW"], file: "friends", alias: "联动" },
    { bvids: ["BV1rkCTYzEZN"], file: "relay", alias: "接力" },
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
    {
        bvids: ["BV1xucZzxEkZ","BV117P2zwEuq","BV1LJ4m1A7FC"],
        file: "others",
        alias: "非常驻妹妹"
    },
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
    { bvids: ["BV1iXKY6qEKv"], file: "peruciaten", alias: "ぺるしあ・てん" },
    {
        bvids: ["BV1aiaS6CEPE"],
        file: "shiyu",
        alias: "しゆ。",
        probeCount: 15
    },
    {
        bvids: ["BV1VPH26kESs"],
        file: "natsumeikune",
        alias: "なつかしちゃん",
        rawDataLoader: "bili-view-api"
    },
    {
        bvids: ["BV1znpW6xECf"],
        file: "yadokaridolly",
        alias: "ヤドカリのドリィ",
        rawDataLoader: "bili-view-api",
        probeCount: 15
    }
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

function getCollectionState(state, config, group) {
    if (!group.seasonId) return getEntryState(state, config, group.entryBvids[0]);

    const key = `${config.resolvedFile}|season:${group.seasonId}`;
    if (!state.entries[key]) {
        state.entries[key] = {
            sourceFile: config.resolvedFile,
            alias: config.alias,
            seasonId: group.seasonId,
            entryBvids: [...group.entryBvids],
            candidates: [],
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

function recordApiPageCounts(result, pageCounts) {
    for (const record of Array.isArray(result?.rawData) ? result.rawData : []) {
        const bvid = String(record?.collectionBv || '').trim();
        const pageCount = Array.isArray(record?.parts) ? record.parts.length : 0;
        if (bvid && pageCount > 0) pageCounts.set(bvid, pageCount);
    }
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

async function processCollectionGroup(
    config,
    group,
    samplingState,
    existingIdentitiesByBvid = new Map(),
    requiredResultCache = new Map(),
    currentPageCounts = new Map()
) {
    const entryBvids = Array.from(new Set(group.entryBvids));
    const entryBvid = entryBvids[0];
    const entryBvidSet = new Set(entryBvids);
    const entryState = getCollectionState(samplingState, config, group);
    const collectionCandidates = group.candidates;
    const minimumCollectionSize = Number.isInteger(config.minimumCollectionBvids)
        ? config.minimumCollectionBvids
        : MIN_COLLECTION_BVIDS;
    const requestedProbeCount = getProbeCountForCollection(
        collectionCandidates.length,
        Number.isInteger(config.probeCount) ? config.probeCount : undefined
    );
    const probeCount = Math.min(requestedProbeCount, collectionCandidates.length);
    const selection = selectLowestViewCandidates(collectionCandidates, {
        minimumCollectionSize,
        probeCount
    });
    if (!selection.eligible) {
        throw new Error(
            `合集只有 ${selection.total} 个独立 BVID，少于 ${minimumCollectionSize} 个；` +
            '本轮不启动候选探针并保留旧文件'
        );
    }

    const candidatePool = collectionCandidates.map(candidate => candidate.bvid);
    entryState.candidates = candidatePool;
    if (group.seasonId) entryState.entryBvids = [...entryBvids];
    const requiredBvids = Array.from(new Set([
        ...entryBvids,
        ...getRequiredCandidateBvids({
            entryBvid,
            candidatePool,
            existingBvids: Array.from(existingIdentitiesByBvid.keys())
        })
    ]));
    const selected = selection.selected;
    const attempted = new Set();
    const results = [];

    console.log(
        `  📉 ${group.seasonId ? `season ${group.seasonId}` : `入口 ${entryBvid}`} 合集 ` +
        `${selection.total} 个独立 BVID，探针最低播放量 ${selection.selected.length} 个：` +
        selected.map(candidate => `${candidate.bvid}(${candidate.viewCount})`).join(', ')
    );
    for (const candidate of selected) {
        const sampleBvid = candidate.bvid;
        attempted.add(sampleBvid);
        try {
            const result = await parseCandidateBvid(config, sampleBvid);
            results.push(result);
            requiredResultCache.set(sampleBvid, result);
            if (config.rawDataLoader === 'bili-view-api') recordApiPageCounts(result, currentPageCounts);
            console.log(`    ✅ ${sampleBvid} (${candidate.viewCount} 播放): ${result.songs.length} 首`);
        } catch (err) {
            console.warn(`    ⚠️  ${sampleBvid} 探针失败：${err.message}`);
        }
    }

    if (results.length === 0) {
        throw new Error(`合集入口 ${entryBvids.join(', ')} 的最低播放量 ${selection.selected.length} 个探针均未解析到有效歌曲数据`);
    }

    const previousWinner = getReliableWinner(entryState, candidatePool);
    results.sort((a, b) => b.songs.length - a.songs.length);
    const winner = results[0];
    assertSourceRefreshSafe({
        alias: `${config.alias}/${group.seasonId ? `season ${group.seasonId}` : entryBvid}`,
        configuredBvids: entryBvids,
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
        seasonId: group.seasonId,
        entryBvids,
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

    const mergedSongs = [...winner.songs];
    const mergedIdentities = new Set(mergedSongs.map(song => getSongIdentity(song?.link)).filter(Boolean));
    const activeCandidateBvids = new Set([...candidatePool, ...entryBvids]);
    const appendSongs = (songs, predicate = () => true) => {
        for (const song of Array.isArray(songs) ? songs : []) {
            const identity = getSongIdentity(song?.link);
            if (!identity || mergedIdentities.has(identity) || !predicate(song, identity)) continue;
            mergedIdentities.add(identity);
            mergedSongs.push(song);
        }
    };
    const missingAfterWinner = getMissingStoredIdentitiesByBvid(
        existingIdentitiesByBvid,
        mergedSongs,
        candidatePool,
        currentPageCounts
    );
    if (missingAfterWinner.size > 0) {
        const missingSampleIdentities = new Set(Array.from(missingAfterWinner.values()).flat());
        for (const result of results) {
            if (result === winner) continue;
            appendSongs(result.songs, (_song, identity) => missingSampleIdentities.has(identity));
        }
    }

    const entryIsPresent = targetBvid => mergedSongs.some(song => {
        const identity = getSongIdentity(song?.link);
        return identity?.startsWith(`${targetBvid}?p=`);
    });
    for (const configuredEntryBvid of entryBvids) {
        if (!entryIsPresent(configuredEntryBvid)) {
            for (const result of results) {
                if (result === winner) continue;
                appendSongs(result.songs, (_song, identity) => identity.startsWith(`${configuredEntryBvid}?p=`));
            }
        }
    }
    const bvidsToFetch = [];
    for (const configuredEntryBvid of entryBvids) {
        if (!entryIsPresent(configuredEntryBvid)) bvidsToFetch.push(configuredEntryBvid);
    }
    for (const bvid of requiredBvids) {
        if (entryBvidSet.has(bvid) || !getMissingStoredIdentitiesByBvid(
            existingIdentitiesByBvid,
            mergedSongs,
            candidatePool,
            currentPageCounts
        ).has(bvid)) continue;
        bvidsToFetch.push(bvid);
    }

    for (const bvid of bvidsToFetch) {
        const targetIsStillMissing = () => entryBvidSet.has(bvid)
            ? !entryIsPresent(bvid)
            : getMissingStoredIdentitiesByBvid(
                existingIdentitiesByBvid,
                mergedSongs,
                candidatePool,
                currentPageCounts
            ).has(bvid);
        if (!targetIsStillMissing()) continue;

        try {
            let directResult = requiredResultCache.get(bvid);
            if (directResult) {
                appendSongs(directResult.songs, song => {
                    const identity = getSongIdentity(song?.link);
                    const match = identity?.match(/^(BV[0-9A-Za-z]+)\?p=/);
                    return match && activeCandidateBvids.has(match[1]);
                });
            }
            if (targetIsStillMissing() && (!directResult || directResult.bvid !== bvid || !currentPageCounts.has(bvid))) {
                directResult = await parseCandidateBvid({ ...config, rawDataLoader: 'bili-view-api' }, bvid);
                recordApiPageCounts(directResult, currentPageCounts);
                requiredResultCache.set(bvid, directResult);
                appendSongs(directResult.songs, song => {
                    const identity = getSongIdentity(song?.link);
                    const match = identity?.match(/^(BV[0-9A-Za-z]+)\?p=/);
                    return match && activeCandidateBvids.has(match[1]);
                });
                console.log(`  🎯 自动补抓 BV ${bvid}: ${directResult.songs.length} 首候选数据`);
            }
        } catch (err) {
            throw new Error(`必需 BV ${bvid} 自动补抓失败：${err.message}`);
        }
    }

    const missingEntryBvids = entryBvids.filter(configuredEntryBvid => !entryIsPresent(configuredEntryBvid));
    if (missingEntryBvids.length > 0) {
        throw new Error(`入口 BV ${missingEntryBvids.join(', ')} 未出现在本轮候选结果中，且自动补抓后仍无有效分P`);
    }

    console.log(`  🏆 season ${group.seasonId || entryBvid} 采用 ${winner.bvid}: ${winner.songs.length} 首`);
    return {
        songs: dedupeSongs(mergedSongs),
        runRecord,
        candidateBvids: candidatePool,
        pageCounts: currentPageCounts
    };
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
// 🔧 核心逻辑：先按 UGC season 汇总分节入口，再按合集播放量选择探针
// ==========================================
async function processSinger(config, samplingState) {
    const { bvids, alias, resolvedFile } = config;
    const configuredBvids = Array.from(new Set(bvids));
    console.log(`\n[开始处理] ${alias} (共 ${configuredBvids.length} 个入口BV)...`);

    const outputPath = path.join(DATA_DIR, `${resolvedFile}.js`);
    const previousContent = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    const previousCount = countStoredSongs(previousContent);
    let existingIdentitiesByBvid = new Map();
    if (!ALLOW_SOURCE_SHRINK && previousContent.trim()) {
        try {
            existingIdentitiesByBvid = getStoredSongIdentitiesByBvid(previousContent);
        } catch (err) {
            throw new Error(`${alias} 旧来源文件解析失败：${err.message}；保留旧文件`);
        }
    }
    const activeBvids = new Set(configuredBvids);
    const requiredResultCache = new Map();
    const currentPageCounts = new Map();

    let allSongs = [];
    const failedBvids = [];
    const successfulRunRecords = [];

    const metadataByEntry = new Map();
    for (const bvid of configuredBvids) {
        try {
            console.log(`  🔎 入口 BV: ${bvid}，读取完整合集稿件元数据...`);
            const metadata = await withRetry(
                () => loadBiliCollectionMetadata(bvid),
                3,
                5000
            );
            metadataByEntry.set(bvid, metadata);
        } catch (err) {
            failedBvids.push(bvid);
            console.warn(`  ⚠️ 入口 BV:${bvid} 合集元数据读取失败，本轮不覆盖该来源。错误：${err.message}`);
        }

        if (configuredBvids.indexOf(bvid) < configuredBvids.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    const collectionGroups = groupCollectionEntries(configuredBvids, metadataByEntry);
    console.log(`  📚 ${configuredBvids.length} 个入口 BV 合并为 ${collectionGroups.length} 个独立合集抽样组`);
    for (const group of collectionGroups) {
        try {
            const entryResult = await processCollectionGroup(
                config,
                group,
                samplingState,
                existingIdentitiesByBvid,
                requiredResultCache,
                currentPageCounts
            );
            allSongs.push(...entryResult.songs);
            entryResult.candidateBvids.forEach(candidateBvid => activeBvids.add(candidateBvid));
            successfulRunRecords.push(entryResult.runRecord);
        } catch (err) {
            failedBvids.push(...group.entryBvids);
            console.warn(`  ⚠️ 合集入口 BV:${group.entryBvids.join(', ')} 处理失败，本轮不覆盖该来源。错误：${err.message}`);
        }
    }

    allSongs = dedupeSongs(allSongs);

    assertSourceRefreshSafe({
        alias,
        configuredBvids,
        failedBvids,
        previousCount: ALLOW_SOURCE_SHRINK
            ? previousCount
            : countStoredSongsForBvids(previousContent, Array.from(activeBvids), currentPageCounts),
        nextCount: allSongs.length,
        maxDropRatio: MAX_SOURCE_DROP_RATIO,
        minDropSongs: MIN_SOURCE_DROP_SONGS
    });
    assertCandidateCoversExisting({
        alias,
        existingContent: previousContent,
        nextSongs: allSongs,
        currentBvids: Array.from(activeBvids),
        currentPageCounts,
        allowSourceShrink: ALLOW_SOURCE_SHRINK
    });

    successfulRunRecords.forEach(run => {
        run.accepted = true;
    });

    if (allSongs.length === 0) throw new Error(`未解析到任何有效歌曲数据（所有入口BV均失败或无数据）`);

    let outputContent = `// ${alias} - 歌单数据 (多合集汇总)\n`;
    outputContent += `// 来源: ${configuredBvids.join(', ')}\n`;
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
        `   📉 非空合集均参与刷新；少于 15 个独立 BVID 时探测全部，` +
        `达到 15 个后默认探测播放量最低的 ${SAMPLE_SIZE} 个；单来源可按配置调整`
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
