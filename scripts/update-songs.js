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
            console.log(`⚠️  第 ${attempt} 次尝试失败，${delay/1000}秒后重试... 错误：${err.message.slice(0, 100)}`);
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

const SINGER_CONFIGS = [
    { bvid: "BV1G6fLB7Efr", file: "naraetan", alias: "なれたん Naraetan" },
    { bvid: "BV1HRfuBCEXN", file: "figaro", alias: "Figaro" },
    { bvid: "BV1cofuBGEkX", file: "ririsya", alias: "凛凛咲 ririsya" },
    { bvid: "BV1ve411z7Nm", file: "suu_usuwa", alias: "稀羽すう Suu_Usuwa" },
    { bvid: "BV1mJZwB8EVa", file: "ray", alias: "來-Ray-" },
    { bvid: "BV1JSZHBrEVw", file: "sakusan", alias: "酢酸 / SAKUSAN" },
    { bvid: "BV1p1zBBCEZ3", file: "yoshika", alias: "よしか YOSHIKA" },
    { bvid: "BV1aDzEBBE3S", file: "yuri", alias: "優莉 yuri" },
    { bvid: "BV1zzZPBsEum", file: "otomoneruki", alias: "音門るき" },
    { bvid: "BV1GXYFzXETo", file: "nayuta-piano-live", alias: "nayuta生演奏" },
    { bvid: "BV1MPpUzsE1D", file: "nayuta-daily", alias: "nayuta日常" },
    { bvid: "BV1UCkhBkEon", file: "MunMosh", alias: "むんもっしゅ" },
    { bvid: "BV1eTkKYDENL", file: "friends", alias: "联动" },
    { bvid: "BV11GZtBcEsp", file: "others", alias: "其他歌手" },
    { bvid: "BV1dGqeYpEuc", file: "earendel", alias: "厄倫蒂兒" }
];

const DATA_DIR = path.join(__dirname, '..', 'data');
const BILI_VIDEO_URL = (bvid) => `https://www.bilibili.com/video/${bvid}`;

async function loadVideoPageWithBrowser(bvid) {
    const url = BILI_VIDEO_URL(bvid);
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                '--disable-gpu',
                '--window-size=1920,1080'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome'
        });

        const page = await browser.newPage();
        await page.setExtraHTTPHeaders({
            'Referer': 'https://www.bilibili.com/',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        });

        await page.evaluateOnNewDocument(() => {
            delete window.navigator.webdriver;
        });

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        await new Promise(resolve => setTimeout(resolve, DELAY_TIME));

        const rawData = await page.evaluate((
            PLAYLIST_SELECTORS, 
            PART_TITLE_SELECTORS, 
            COLLECTION_TITLE_SELECTORS,
            inputBvid
        ) => {
            const BV_REGEX = /BV[0-9a-zA-Z]+/;

            function querySelectorFallback(container, selectors) {
                for (const selector of selectors) {
                    const element = container.querySelector(selector);
                    if (element) return element;
                }
                return null;
            }

            function querySelectorAllFallback(container, selectors) {
                for (const selector of selectors) {
                    const elements = container.querySelectorAll(selector);
                    if (elements.length > 0) return elements;
                }
                return [];
            }

            let containers = [];
            for (const sel of PLAYLIST_SELECTORS) {
                containers = document.querySelectorAll(sel);
                if (containers.length > 0) break;
            }

            if (containers.length === 0) {
                return null;
            }

            return Array.from(containers).map((container, idx) => {
                const colTitleNode = querySelectorFallback(container, COLLECTION_TITLE_SELECTORS);
                const colTitle = colTitleNode?.textContent.trim() || `合集${idx+1}`;

                let upName = "未知UP主";
                const upMatch = colTitle.match(/\[([^\]]+?\s*Ch\.[^\]]+)\]/);
                if (upMatch) {
                    upName = upMatch[1];
                } else {
                    const upEle = document.querySelector('.up-name');
                    if (upEle) upName = upEle.textContent.trim();
                }

                let partNodes = querySelectorAllFallback(container, [PART_TITLE_SELECTORS[0]]);
                let parts = Array.from(partNodes).map(node => node.textContent.trim());

                if (parts.length === 0) {
                     const singleTitleNode = querySelectorFallback(container, [PART_TITLE_SELECTORS[1]]);
                     if (singleTitleNode) {
                         parts.push(singleTitleNode.textContent.trim());
                     } else if (colTitleNode) {
                         parts.push(colTitle);
                     }
                }

                let collectionBv = inputBvid;
                const dataKey = container.dataset.key;
                if (dataKey) {
                    const matchResult = dataKey.match(BV_REGEX);
                    if (matchResult && matchResult[0]) {
                        collectionBv = matchResult[0];
                    }
                }

                return {
                    collectionBv: collectionBv,
                    collectionTitle: colTitle,
                    up: upName,
                    parts: parts
                };
            });
        }, PLAYLIST_SELECTORS, PART_TITLE_SELECTORS, COLLECTION_TITLE_SELECTORS, bvid);

        await browser.close();
        return rawData;

    } catch (err) {
        if (browser) await browser.close();
        throw new Error(`浏览器加载失败: ${err.message}`);
    }
}

async function processSinger(config) {
    const { bvid, file, alias } = config;
    console.log(`\n[处理中] ${alias} (BV: ${bvid})...`);
    
    const rawData = await loadVideoPageWithBrowser(bvid);
    if (!rawData || rawData.length === 0) {
        throw new Error(`未解析到任何分P数据（检查BV号或视频是否有分P）`);
    }

    let songs = [];
    rawData.forEach(col => {
        col.parts.forEach((p, i) => {
            let artist = DEFAULT_ARTIST_TEXT;
            let songTitle = p;
            
            // ==========================================
            // 🔧 【核心修改】清洗逻辑升级
            // ==========================================
            let cleanTitle = p;

            // 1. 清除所有日期标签
            cleanTitle = cleanTitle.replace(/\[\d{4}[-]?\d{2}[-]?\d{2}\]/g, '');

            // 2. 🔧 新增：循环清除末尾的特征码/任意方括号 (如 [3RiwmKBR-Aw])
            let prevLen;
            do {
                prevLen = cleanTitle.length;
                // 正则含义：匹配字符串末尾的 [任意非括号字符]，并移除后面可能跟着的空格
                cleanTitle = cleanTitle.replace(/\[[^\[\]]*\]\s*$/, '');
            } while (cleanTitle.length !== prevLen); // 如果长度变了，说明去掉了东西，再检查一遍有没有漏网之鱼

            // 3. 清除首尾空格
            cleanTitle = cleanTitle.trim();

            // 4. 清除开头序号
            cleanTitle = cleanTitle.replace(/^\d+\.\s*/, '').replace(/^P\d+[：:]\s*/, '');

            // 5. 最终收尾
            cleanTitle = cleanTitle.trim();
            // ==========================================

            if (cleanTitle.includes(' - ')) {
                const titleParts = cleanTitle.split(' - ');
                const extractedTitle = titleParts[0].trim();
                const extractedArtist = titleParts[titleParts.length - 1].trim();
                
                if (extractedArtist) {
                    artist = extractedArtist;
                }
                songTitle = extractedTitle;
            } else {
                songTitle = cleanTitle;
            }

            let link = null;
            if (BV_REGEX.test(col.collectionBv)) {
                link = `${BILI_VIDEO_PREFIX}${col.collectionBv}?p=${i+1}`;
            }

            songs.push({
                title: songTitle,
                artist: artist,
                collection: col.collectionTitle,
                up: col.up,
                link: link,
                source: `${file}.js`
            });
        });
    });

    const outputPath = path.join(DATA_DIR, `${file}.js`);
    let outputContent = `// ${alias} - 歌单数据\n`;
    outputContent += `// 来源: ${BILI_VIDEO_URL(bvid)}\n`;
    outputContent += `// 生成时间: ${new Date().toLocaleString()}\n\n`;
    outputContent += `window.SONG_DATA = window.SONG_DATA || [];\n\n`;
    outputContent += `window.SONG_DATA.push(\n`;
    
    songs.forEach((song, idx) => {
        outputContent += `    ${JSON.stringify(song, null, 2)}`;
        if (idx < songs.length - 1) outputContent += ",";
        outputContent += "\n";
    });
    
    outputContent += `);\n`;

    fs.writeFileSync(outputPath, outputContent, { encoding: 'utf8', mode: 0o644 });
    console.log(`  ✅ 成功: 生成 ${songs.length} 首歌曲 -> ${file}.js`);
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
    console.log(`\n✅ 生成index.json: 包含 ${indexData.files.length} 个数据文件`);
}

async function main() {
    console.log("========================================");
    console.log("   🚀 B站分P解析（特征码清除版）启动");
    console.log("========================================");
    
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let successCount = 0;
    let failList = [];
    for (const config of SINGER_CONFIGS) {
        try {
            await withRetry(() => processSinger(config), 3, 5000);
            successCount++;
        } catch (err) {
            console.error(`  ❌ 最终失败: ${config.alias} (${config.bvid})`, err.message);
            failList.push({ alias: config.alias, bvid: config.bvid, error: err.message });
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    generateIndexJson();

    console.log("\n========================================");
    console.log(`   🏁 任务结束: 成功更新 ${successCount}/${SINGER_CONFIGS.length} 位歌手`);
    console.log("========================================");
    process.exit(0);
}

main().catch(err => {
    console.error("❌ 全局错误:", err.message);
    process.exit(1);
});
