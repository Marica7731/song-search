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
    { bvids: ["BV1G6fLB7Efr"], file: "naraetan", alias: "なれたん Naraetan" },
    { bvids: ["BV1HRfuBCEXN"], file: "figaro", alias: "Figaro" },
    { bvids: ["BV1cofuBGEkX"], file: "ririsya", alias: "凛凛咲 ririsya" },
    { bvids: ["BV1ve411z7Nm"], file: "suu_usuwa", alias: "稀羽すう Suu_Usuwa" },
    { bvids: ["BV1mJZwB8EVa"], file: "ray", alias: "來-Ray-" },
    { bvids: ["BV1JSZHBrEVw"], file: "sakusan", alias: "酢酸 / SAKUSAN" },
    { bvids: ["BV1p1zBBCEZ3"], file: "yoshika", alias: "よしか YOSHIKA" },
    { bvids: ["BV1aDzEBBE3S"], file: "yuri", alias: "優莉 yuri" },
    { bvids: ["BV1zzZPBsEum"], file: "otomoneruki", alias: "音門るき" },
    { bvids: ["BV1GXYFzXETo","BV1MPpUzsE1D","BV184W5zeE1Z"], file: "nayuta", alias: "nayuta" },
    { bvids: ["BV1UCkhBkEon"], file: "MunMosh", alias: "むんもっしゅ" },
    { bvids: ["BV1eTkKYDENL"], file: "friends", alias: "联动" },
    { bvids: ["BV11GZtBcEsp","BV1owcoz3Ekw"], file: "others", alias: "非常驻妹妹" },
    { bvids: ["BV1dGqeYpEuc"], file: "earendel", alias: "厄倫蒂兒" },
    { bvids: ["BV1hw4m1i7qN"], file: "linon", alias: "天籠りのん" },
    { bvids: ["BV1MEP8z4E1J"], file: "stella", alias: "天ノ譜ステラ" },
    { bvids: ["BV117P2zwEuq"], file: "inori", alias: "祈祷" },
    { bvids: ["BV167c2znErj"], file: "shuna", alias: "朱名" }
];

const DATA_DIR = path.join(__dirname, '..', 'data');
const BILI_VIDEO_URL = (bvid) => `https://www.bilibili.com/video/${bvid}`;

async function loadVideoPageWithBrowser(bvid) {
    const url = BILI_VIDEO_URL(bvid);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled', '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36', '--disable-gpu', '--window-size=1920,1080'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome'
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

// ==========================================
// 🔧 核心逻辑：移除去重，保留后缀清洗
// ==========================================
async function processSinger(config) {
    const { bvids, file, alias } = config;
    console.log(`\n[开始处理] ${alias} (共 ${bvids.length} 个BV号)...`);

    let allSongs = [];

    for (const bvid of bvids) {
        console.log(`  🔍 正在解析 BV: ${bvid}...`);
        const rawData = await loadVideoPageWithBrowser(bvid);
        if (!rawData || rawData.length === 0) {
            console.warn(`  ⚠️  BV:${bvid} 未解析到数据，跳过`);
            continue;
        }

        rawData.forEach(col => {
            col.parts.forEach((p, i) => {
                let cleanTitle = p;

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

                // 3. ✨ 关键逻辑：清除 (2), _sub 等后缀，但不去重 ✨
                const artifactRegex = /(\s*\(\d+\)|_(sub|copy|backup|1080p|720p|\d+))$/i;
                cleanTitle = cleanTitle.replace(artifactRegex, '').trim();

                let artist = DEFAULT_ARTIST_TEXT;
                let songTitle = cleanTitle;

                if (cleanTitle.includes(' - ')) {
                    const titleParts = cleanTitle.split(' - ');
                    // 对切割后的部分再次洗涤后缀
                    songTitle = titleParts[0].replace(artifactRegex, '').trim();
                    artist = titleParts[titleParts.length - 1].replace(artifactRegex, '').trim();
                }

                let link = null;
                if (BV_REGEX.test(col.collectionBv)) {
                    link = `${BILI_VIDEO_PREFIX}${col.collectionBv}?p=${i + 1}`;
                }

                // 直接推送，不再检查重复
                allSongs.push({
                    title: songTitle,
                    artist: artist,
                    collection: col.collectionTitle,
                    up: col.up,
                    link: link,
                    source: `${file}.js`
                });
            });
        });

        if (bvids.indexOf(bvid) < bvids.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    if (allSongs.length === 0) throw new Error(`未解析到任何有效歌曲数据`);

    const outputPath = path.join(DATA_DIR, `${file}.js`);
    let outputContent = `// ${alias} - 歌单数据 (多合集汇总)\n`;
    outputContent += `// 来源: ${bvids.join(', ')}\n`;
    outputContent += `// 生成时间: ${new Date().toLocaleString()}\n\n`;
    outputContent += `window.SONG_DATA = window.SONG_DATA || [];\n\nwindow.SONG_DATA.push(\n`;

    allSongs.forEach((song, idx) => {
        outputContent += `    ${JSON.stringify(song, null, 2)}${idx < allSongs.length - 1 ? "," : ""}\n`;
    });

    outputContent += `);\n`;
    fs.writeFileSync(outputPath, outputContent, { encoding: 'utf8', mode: 0o644 });
    console.log(`  ✅ 成功: 汇总 ${allSongs.length} 首歌曲 -> ${file}.js`);
    return true;
}

function generateIndexJson() {
    const indexPath = path.join(DATA_DIR, 'index.json');
    const indexData = {
        files: SINGER_CONFIGS.map(config => `${config.file}.js`),
        fileToAlias: SINGER_CONFIGS.reduce((map, config) => {
            map[config.file] = config.alias;
            return map;
        }, {})
    };
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
}

async function main() {
    console.log("========================================");
    console.log("   🚀 B站直播源解析工具 (不去重模式)");
    console.log("========================================");
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    let successCount = 0;
    for (const config of SINGER_CONFIGS) {
        try {
            await withRetry(() => processSinger(config), 3, 5000);
            successCount++;
        } catch (err) { console.error(`  ❌ 最终失败: ${config.alias}`, err.message); }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    generateIndexJson();
    console.log("\n========================================");
    console.log(`   🏁 任务结束: 更新 ${successCount}/${SINGER_CONFIGS.length} 位歌手`);
    console.log("========================================");
    process.exit(0);
}

main().catch(err => { console.error("❌ 全局错误:", err.message); process.exit(1); });
