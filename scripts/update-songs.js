// scripts/update-songs.js
const fs = require('fs');
const path = require('path');

// ================= 关键兼容：适配全局安装的 Puppeteer =================
let puppeteer;
try {
    // 优先本地引入（本地开发环境）
    puppeteer = require('puppeteer');
} catch (err) {
    // 本地无则从全局引入（GitHub Actions 环境）
    try {
        const globalModules = path.resolve(process.execPath, '../..', 'lib/node_modules');
        puppeteer = require(path.join(globalModules, 'puppeteer'));
    } catch (globalErr) {
        console.error('❌ Puppeteer 未安装，请执行 npm install puppeteer 或 npm install -g puppeteer');
        process.exit(1);
    }
}

// ================= 可配置项（你可以在这里修改兜底文本） =================
// 无标准歌手格式时的兜底文本，想要空值就改成 '' 即可
const DEFAULT_ARTIST_TEXT = '来源处未提供标准格式歌手';
// const DEFAULT_ARTIST_TEXT = ''; // 取消这行注释，歌手字段就会留空

// ================= 通用重试函数 =================
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

// ================= 1. 常量配置（完全对齐油猴脚本 v9.3） =================
const DELAY_TIME = 1500;
const BILI_VIDEO_PREFIX = 'https://www.bilibili.com/video/';
const BV_REGEX = /BV[0-9a-zA-Z]+/;
const PLAYLIST_SELECTORS = ['.video-pod__list .pod-item'];

const PART_TITLE_SELECTORS = [
    '.page-list .page-item.sub .title-txt', // 分P合集选择器 (在pod-item内部)
    '.title .title-txt'                      // 单集合集选择器 (直接在当前容器内找标题)
];

const COLLECTION_TITLE_SELECTORS = [
    '.head .title .title-txt',               // 分P合集：从当前pod-item内部提取标题
    '.video-pod__header .header-top .left .title', // 备用布局
    '.title .title-txt'                       // 单集合集：直接把当前视频标题当作合集名
];

// ================= 2. 歌手配置（你只需要维护这里） =================
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
    { bvid: "BV11GZtBcEsp", file: "others", alias: "其他歌手" }
];

const DATA_DIR = path.join(__dirname, '..', 'data');
const BILI_VIDEO_URL = (bvid) => `https://www.bilibili.com/video/${bvid}`;

// ================= 3. 核心：Puppeteer加载页面 =================
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

// ================= 4. 处理单个歌手（核心逻辑重写，完全符合你的需求） =================
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
            // 【核心重写】
            // 1. 初始化歌手为兜底文本，不再默认填充alias
            let artist = DEFAULT_ARTIST_TEXT;
            let songTitle = p;
            
            // 2. 清洗标题：去掉序号、P前缀等无关内容
            let cleanTitle = p.replace(/^\d+\.\s*/, '').replace(/^P\d+[：:]\s*/, '');
            
            // 3. 只有标题包含「 - 」标准格式，才尝试提取歌手
            if (cleanTitle.includes(' - ')) {
                const titleParts = cleanTitle.split(' - ');
                // 取第一部分为歌名，最后一部分为歌手（兼容歌名里带「 - 」的情况）
                const extractedTitle = titleParts[0].trim();
                const extractedArtist = titleParts[titleParts.length - 1].trim();
                
                // 只有提取到有效歌手名，才覆盖兜底文本
                if (extractedArtist) {
                    artist = extractedArtist;
                }
                // 歌名用清洗后的内容
                songTitle = extractedTitle;
            } else {
                // 4. 无标准格式，直接用清洗后的标题当歌名，歌手保持兜底文本
                songTitle = cleanTitle;
            }

            // 校验BV号有效性
            let link = null;
            if (BV_REGEX.test(col.collectionBv)) {
                link = `${BILI_VIDEO_PREFIX}${col.collectionBv}?p=${i+1}`;
            } else {
                console.warn(`⚠️  无效BV号：【${col.collectionBv}】（${alias} - ${p}），跳过生成跳转链接`);
            }

            songs.push({
                title: songTitle,
                artist: artist,
                collection: col.collectionTitle,
                up: col.up, // UP主字段独立保留，不影响歌手
                link: link,
                source: `${file}.js`
            });
        });
    });

    const outputPath = path.join(DATA_DIR, `${file}.js`);
    let outputContent = `// ${alias} - 歌单数据（油猴逻辑复刻版）\n`;
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

// ================= 5. 生成index.json =================
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
    console.log(`\n✅ 生成index.json: 包含 ${indexData.files.length} 个数据文件 + 别名映射`);
}

// ================= 6. 主程序 =================
async function main() {
    console.log("========================================");
    console.log("   🚀 B站分P解析（歌手字段规则优化版）启动");
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
    if (failList.length > 0) {
        console.log(`   ❌ 失败列表:`);
        failList.forEach(item => {
            console.log(`     - ${item.alias} (${item.bvid}): ${item.error.slice(0, 100)}`);
        });
    }
    console.log("========================================");

    process.exit(0);
}

main().catch(err => {
    console.error("❌ 全局错误:", err.message);
    process.exit(1);
});
