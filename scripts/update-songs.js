const fs = require('fs');
const path = require('path');

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

function readPositiveIntegerEnv(name, fallback) {
    const parsed = Number.parseInt(process.env[name] || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
const SAMPLE_SIZE = readPositiveIntegerEnv('GITHUB_BV_SAMPLE_SIZE', 3);
const RECENT_RUN_WINDOW = readPositiveIntegerEnv('GITHUB_BV_RECENT_RUN_WINDOW', 5);
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
    { bvids: ["BV1xucZzxEkZ","BV117P2zwEuq","BV1LJ4m1A7FC"], file: "others", alias: "非常驻妹妹" },
    { bvids: ["BV1S4TT6pEn4"], file: "neno", alias: "碧生ねの" },
    { bvids: ["BV1jyjK6sEns"], file: "suzuhanainori", alias: "鈴花いのり" },
    { bvids: ["BV1AFG66UEpL"], file: "chiyourachomi", alias: "千代浦蝶美" },
    { bvids: ["BV1nUMP6vE7N"], file: "tamamachipue", alias: "玉町ぷえ" },
    { bvids: ["BV1co7i6QEez"], file: "isshikiizu", alias: "一色イズ" },
    { bvids: ["BV1jaYQeUEgM"], file: "hanamaruhareru", alias: "花丸晴琉" },
    { bvids: ["BV1H9ekeiEaB"], file: "hanabasamikyo", alias: "花鋏キョウ" },
    { bvids: ["BV1Qa9JB6EAw"], alias: "陽月るるふ" }
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

function normalizeBvid(value) {
    const matchResult = String(value || '').match(BV_REGEX);
    return matchResult?.[0] || null;
}

function uniqueBvids(values) {
    const seen = new Set();
    const result = [];
    values.forEach(value => {
        const bvid = normalizeBvid(value);
        if (!bvid || seen.has(bvid)) return;
        seen.add(bvid);
        result.push(bvid);
    });
    return result;
}

function shuffleCopy(values) {
    const shuffled = [...values];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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

function getRecentBvidSet(entryState) {
    const recentRuns = Array.isArray(entryState.recentRuns)
        ? entryState.recentRuns.slice(-RECENT_RUN_WINDOW)
        : [];
    const recent = new Set();
    recentRuns.forEach(run => {
        (run.sampled || run.selected || []).forEach(bvid => recent.add(bvid));
        if (run.winner) recent.add(run.winner);
    });
    return recent;
}

function extractCandidateBvids(rawData, fallbackBvid) {
    const collectionBvids = Array.isArray(rawData)
        ? rawData.map(col => col?.collectionBv)
        : [];
    return uniqueBvids([...collectionBvids, fallbackBvid]);
}

function selectSampleCandidates(candidatePool, entryState) {
    const normalizedPool = uniqueBvids(candidatePool);
    const sampleLimit = Math.max(1, SAMPLE_SIZE);
    const recent = getRecentBvidSet(entryState);
    const freshCandidates = normalizedPool.filter(bvid => !recent.has(bvid));
    const selected = shuffleCopy(freshCandidates).slice(0, sampleLimit);

    if (selected.length < sampleLimit) {
        const fill = shuffleCopy(normalizedPool.filter(bvid => !selected.includes(bvid)))
            .slice(0, sampleLimit - selected.length);
        selected.push(...fill);
    }

    return selected;
}

function parseRawDataToSongs(rawData, config) {
    const songs = [];
    const { resolvedFile } = config;

    (rawData || []).forEach(col => {
        (col.parts || []).forEach((p, i) => {
            let cleanTitle = p;
            const rawArtistCandidate = String(p || '')
                .split(' - ')
                .slice(-1)[0]
                .replace(LEADING_SOURCE_REGEX, '')
                .trim();

            // 1. 基础标签清除
            cleanTitle = cleanTitle.replace(/\[\d{4}[-]?\d{2}[-]?\d{2}\]/g, '');
            let prevLen;
            do {
                prevLen = cleanTitle.length;
                cleanTitle = cleanTitle.replace(/\[[^\[\]]*\]\s*$/, '');
            } while (cleanTitle.length !== prevLen);

            // 2. 清除开头编号
            cleanTitle = cleanTitle.trim()
                .replace(/^\d+\.\s*/, '')
                .replace(/^P\d+[：:]\s*/, '')
                .trim();

            // 3. 清除 (2), _sub 等后缀
            const artifactRegex = /(\s*\(\d+\)|_(sub|copy|backup|1080p|720p|\d+))$/i;
            cleanTitle = cleanTitle.replace(artifactRegex, '').trim();

            let artist = DEFAULT_ARTIST_TEXT;
            let songTitle = cleanTitle;

            if (cleanTitle.includes(' - ')) {
                const titleParts = cleanTitle.split(' - ');
                songTitle = titleParts[0].replace(artifactRegex, '').trim();
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

async function loadRawDataWithRetry(bvid) {
    return withRetry(async () => {
        const data = await loadVideoPageWithBrowser(bvid);
        if (!data || data.length === 0) {
            throw new Error('未解析到有效列表数据');
        }
        return data;
    }, 3, 5000);
}

async function parseCandidateBvid(config, bvid, cachedRawData = null) {
    const rawData = cachedRawData || await loadRawDataWithRetry(bvid);
    const songs = parseRawDataToSongs(rawData, config);
    if (songs.length === 0) {
        throw new Error('未解析到有效歌曲数据');
    }
    return {
        bvid,
        rawData,
        songs,
        candidateBvids: extractCandidateBvids(rawData, bvid)
    };
}

async function processEntryBvid(config, entryBvid, samplingState) {
    const entryState = getEntryState(samplingState, config, entryBvid);
    console.log(`  🔎 入口 BV: ${entryBvid}，刷新候选池...`);

    let entryRawData = null;
    let discoveredCandidates = [];
    try {
        entryRawData = await loadRawDataWithRetry(entryBvid);
        discoveredCandidates = extractCandidateBvids(entryRawData, entryBvid);
    } catch (err) {
        console.warn(`  ⚠️  入口BV候选刷新失败，将使用上次状态：${err.message}`);
    }

    const candidatePool = uniqueBvids([
        ...discoveredCandidates,
        ...(Array.isArray(entryState.candidates) ? entryState.candidates : []),
        entryBvid
    ]);
    entryState.candidates = candidatePool;

    const selected = selectSampleCandidates(candidatePool, entryState);
    const attempted = new Set();
    const results = [];

    console.log(`  🎲 候选 ${candidatePool.length} 个，抽样 ${selected.join(', ')}`);
    for (const sampleBvid of selected) {
        attempted.add(sampleBvid);
        try {
            const cachedRawData = sampleBvid === entryBvid ? entryRawData : null;
            const result = await parseCandidateBvid(config, sampleBvid, cachedRawData);
            results.push(result);
            console.log(`    ✅ ${sampleBvid}: ${result.songs.length} 首`);
        } catch (err) {
            console.warn(`    ⚠️  ${sampleBvid} 抽样失败：${err.message}`);
        }
    }

    if (results.length === 0) {
        const fallbackCandidates = shuffleCopy(candidatePool.filter(bvid => !attempted.has(bvid)))
            .slice(0, Math.max(1, SAMPLE_SIZE));
        if (fallbackCandidates.length > 0) {
            console.log(`  ↩️  抽样失败，回退未过滤候选：${fallbackCandidates.join(', ')}`);
        }
        for (const fallbackBvid of fallbackCandidates) {
            attempted.add(fallbackBvid);
            try {
                const cachedRawData = fallbackBvid === entryBvid ? entryRawData : null;
                const result = await parseCandidateBvid(config, fallbackBvid, cachedRawData);
                results.push(result);
                console.log(`    ✅ ${fallbackBvid}: ${result.songs.length} 首`);
            } catch (err) {
                console.warn(`    ⚠️  ${fallbackBvid} 回退失败：${err.message}`);
            }
        }
    }

    if (results.length === 0 && !attempted.has(entryBvid)) {
        console.log(`  ↩️  未过滤候选仍失败，最终回退入口 BV: ${entryBvid}`);
        const result = await parseCandidateBvid(config, entryBvid, entryRawData);
        attempted.add(entryBvid);
        results.push(result);
        console.log(`    ✅ ${entryBvid}: ${result.songs.length} 首`);
    }

    if (results.length === 0) {
        throw new Error(`入口 ${entryBvid} 未解析到任何有效歌曲数据`);
    }

    results.sort((a, b) => b.songs.length - a.songs.length);
    const winner = results[0];
    entryState.candidates = uniqueBvids([
        ...candidatePool,
        ...results.flatMap(result => result.candidateBvids)
    ]);
    entryState.lastRunAt = new Date().toISOString();
    entryState.recentRuns = Array.isArray(entryState.recentRuns) ? entryState.recentRuns : [];
    entryState.recentRuns.push({
        runAt: entryState.lastRunAt,
        sampled: Array.from(attempted),
        winner: winner.bvid,
        winnerSongCount: winner.songs.length,
        candidateCount: entryState.candidates.length
    });
    entryState.recentRuns = entryState.recentRuns.slice(-RECENT_RUN_WINDOW);

    console.log(`  🏆 采用 ${winner.bvid}: ${winner.songs.length} 首`);
    return winner.songs;
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
// 🔧 核心逻辑：入口BV随机抽样，保留后缀清洗
// ==========================================
async function processSinger(config, samplingState) {
    const { bvids, alias, resolvedFile } = config;
    console.log(`\n[开始处理] ${alias} (共 ${bvids.length} 个入口BV)...`);

    let allSongs = [];

    for (const bvid of bvids) {
        try {
            const entrySongs = await processEntryBvid(config, bvid, samplingState);
            allSongs.push(...entrySongs);
        } catch (err) {
            console.warn(`  ⚠️  入口BV:${bvid} 处理失败，跳过。错误：${err.message}`);
        }

        if (bvids.indexOf(bvid) < bvids.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    allSongs = dedupeSongs(allSongs);

    if (allSongs.length === 0) throw new Error(`未解析到任何有效歌曲数据（所有入口BV均失败或无数据）`);

    const outputPath = path.join(DATA_DIR, `${resolvedFile}.js`);
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
        }, {})
    };
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
}

async function main() {
    console.log("========================================");
    console.log("   🚀 B站直播源解析工具 (入口BV随机抽样模式)");
    console.log("========================================");
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const samplingState = loadSamplingState();
    const configsToProcess = RESOLVED_SINGER_CONFIGS.filter(shouldProcessConfig);
    if (SOURCE_FILTER.length > 0) {
        console.log(`   🔎 仅处理来源: ${SOURCE_FILTER.join(', ')}`);
    }
    console.log(`   🎲 每个入口BV抽样 ${Math.max(1, SAMPLE_SIZE)} 个，recent窗口 ${RECENT_RUN_WINDOW} 轮`);

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
    generateIndexJson();
    saveSamplingState(samplingState);
    console.log("\n========================================");
    console.log(`   🏁 任务结束: 更新 ${successCount}/${configsToProcess.length} 位歌手`);
    console.log("========================================");
    process.exit(0);
}

main().catch(err => { console.error("❌ 全局错误:", err.message); process.exit(1); });
