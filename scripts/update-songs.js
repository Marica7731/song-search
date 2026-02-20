// scripts/update-songs.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer'); // 模拟真实浏览器

// ================= 1. 1:1 复制油猴脚本的常量 =================
const DELAY_TIME = 1500;
const BILI_VIDEO_PREFIX = 'https://www.bilibili.com/video/';
const BV_REGEX = /BV\w+/;
// 选择器（和油猴脚本完全一致，核心！）
>>>>>>> d51427f3cf6ad88c9f18d7159bbc095e9fe065de
const PLAYLIST_SELECTORS = ['.video-pod__list .pod-item'];
const PART_TITLE_SELECTOR = '.page-list .page-item.sub .title-txt';
const COLLECTION_TITLE_SELECTOR = '.head .title-txt';

// ================= 2. 歌手配置（填BV号即可） =================
const SINGER_CONFIGS = [
    { bvid: "BV1G6fLB7Efr", file: "naraetan", alias: "なれたん Naraetan" },
    { bvid: "BV1HRfuBCEXN", file: "figaro", alias: "Figaro" },
    { bvid: "BV1cofuBGEkX", file: "ririsya", alias: "凛凛咲 ririsya" },
    { bvid: "BV1aPFczzE6R", file: "suu_usuwa", alias: "稀羽すう Suu_Usuwa" },
    { bvid: "BV1mJZwB8EVa", file: "ray", alias: "來-Ray-" },
    { bvid: "BV1JSZHBrEVw", file: "sakusan", alias: "酢酸 / SAKUSAN" },
    { bvid: "BV1p1zBBCEZ3", file: "yoshika", alias: "よしか YOSHIKA" },
    { bvid: "BV1aDzEBBE3S", file: "yuri", alias: "優莉 yuri" },
    { bvid: "BV1zzZPBsEum", file: "otomoneruki", alias: "音門るき" },
    { bvid: "BV11GZtBcEsp", file: "others", alias: "其他歌手" }
];

const DATA_DIR = path.join(__dirname, '..', 'data');
const BILI_VIDEO_URL = (bvid) => `https://www.bilibili.com/video/${bvid}`;

// ================= 3. 核心：用Puppeteer模拟浏览器加载页面 =================
async function loadVideoPageWithBrowser(bvid) {
    const url = BILI_VIDEO_URL(bvid);
    // 启动无头浏览器（模拟真实Chrome）
    const browser = await puppeteer.launch({
        headless: 'new', // 新版无头模式，更接近真实浏览器
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled', // 避免被B站识别为爬虫
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
        ]
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Referer': 'https://www.bilibili.com/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Cache-Control': 'max-age=0',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            }
        };

        https.get(url, options, (res) => {
            let html = '';
            res.setEncoding('utf-8');
            res.on('data', chunk => html += chunk);
            res.on('end', () => resolve(html));
            res.on('error', err => reject(`页面下载失败: ${err.message}`));
        }).on('error', err => reject(`请求失败: ${err.message}`));
    });

    try {
        const page = await browser.newPage();
        // 模拟真实浏览器的请求头
        await page.setExtraHTTPHeaders({
            'Referer': 'https://www.bilibili.com/',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        });
        // 禁用自动化提示，避免被检测
        await page.evaluateOnNewDocument(() => {
            delete window.navigator.webdriver;
// ================= 4. 核心：1:1 复刻油猴的 getRawData 函数 =================
function getRawData($, bvid) {
    let containers = [];
    // 遍历油猴的PLAYLIST_SELECTORS，找到第一个有内容的容器
    for (const sel of PLAYLIST_SELECTORS) {
        containers = $(sel);
        if (containers.length > 0) break;
    }

    if (containers.length === 0) {
        console.log('  ❌ 未检测到分P容器（和油猴提示一致）');
        return null;
    }

    // 复刻油猴的容器遍历逻辑
    const result = [];
    containers.each((idx, container) => {
        const $container = $(container);

        // 提取合集标题（和油猴一致）
        const colTitleNode = $container.find(COLLECTION_TITLE_SELECTOR);
        let colTitle = colTitleNode?.text()?.trim() || `合集${idx+1}`;

        // 提取UP主（完全复刻油猴的正则+备选逻辑）
        let upName = "未知UP主";
        const upMatch = colTitle.match(/\[([^\]]+?\s*Ch\.[^\]]+)\]/);
        if (upMatch) {
            upName = upMatch[1];
        } else {
            const upEle = $('.up-name'); // 油猴里的备选选择器
            if (upEle.length > 0) upName = upEle.text().trim();
        }

        // 提取分P标题（和油猴一致）
        const partNodes = $container.find(PART_TITLE_SELECTOR);
        const parts = [];
        partNodes.each((_, node) => {
            parts.push($(node).text().trim());
        });

        // 提取合集BV号（和油猴的dataset.key逻辑一致）
        const collectionBv = $container.attr('data-key')?.match(BV_REGEX)?.[0] || bvid;

        result.push({
            collectionBv: collectionBv,
            collectionTitle: colTitle,
            up: upName,
            parts: parts
        });

        // 加载页面（等待所有JS执行、DOM渲染完成）
        await page.goto(url, {
            waitUntil: 'networkidle2', // 网络空闲时（页面加载完成）
            timeout: 60000 // 超时60秒，适配网络慢的情况
        });

        // 替换废弃的page.waitForTimeout → 用标准setTimeout
        await new Promise(resolve => setTimeout(resolve, DELAY_TIME));

        // 1:1 复刻油猴的getRawData逻辑（在浏览器环境里执行）
        const rawData = await page.evaluate((PLAYLIST_SELECTORS, PART_TITLE_SELECTOR, COLLECTION_TITLE_SELECTOR, BV_REGEX, bvid) => {
            let containers = [];
            for (const sel of PLAYLIST_SELECTORS) {
                containers = document.querySelectorAll(sel);
                if (containers.length > 0) break;
            }

            if (containers.length === 0) {
                return null;
            }

            const result = Array.from(containers).map((container, idx) => {
                // 提取合集标题
                const colTitleNode = container.querySelector(COLLECTION_TITLE_SELECTOR);
                let colTitle = colTitleNode?.textContent.trim() || `合集${idx+1}`;

                // 提取UP主（油猴逻辑）
                let upName = "未知UP主";
                const upMatch = colTitle.match(/\[([^\]]+?\s*Ch\.[^\]]+)\]/);
                if (upMatch) {
                    upName = upMatch[1];
                } else {
                    const upEle = document.querySelector('.up-name');
                    if (upEle) upName = upEle.textContent.trim();
                }

                // 提取分P
                const partNodes = container.querySelectorAll(PART_TITLE_SELECTOR);
                const parts = Array.from(partNodes).map(node => node.textContent.trim());

                // 提取合集BV号
                const collectionBv = container.dataset.key?.match(BV_REGEX)?.[0] || bvid;

                return {
                    collectionBv: collectionBv,
                    collectionTitle: colTitle,
                    up: upName,
                    parts: parts
                };
            });

            return result;
        }, PLAYLIST_SELECTORS, PART_TITLE_SELECTOR, COLLECTION_TITLE_SELECTOR, BV_REGEX, bvid);

        await browser.close();
        return rawData;

    } catch (err) {
        await browser.close();
        throw new Error(`浏览器加载失败: ${err.message}`);
    }
    return result;
}

// ================= 4. 处理单个歌手 =================
async function processSinger(config) {
    const { bvid, file, alias } = config;
    console.log(`\n[处理中] ${alias} (BV: ${bvid})...`);
    
    try {
        // 步骤1：用浏览器加载页面并解析（和油猴环境一致）
        const rawData = await loadVideoPageWithBrowser(bvid);
        if (!rawData || rawData.length === 0) {
            console.log(`  ⚠️  未解析到任何分P数据（检查BV号或视频是否有分P）`);
            return false;
        }

        // 步骤2：转换为歌单格式
        let songs = [];
        rawData.forEach(col => {
            col.parts.forEach((p, i) => {
                let artist = col.up;
                let songTitle = p;
                
                let cleanTitle = p.replace(/^\d+\.\s*/, '').replace(/^P\d+[：:]\s*/, '');
                if (cleanTitle.includes(' - ')) {
                    const parts = cleanTitle.split(' - ');
                    songTitle = parts[0].trim();
                    artist = parts[parts.length - 1].trim() || artist;
                } else {
                    songTitle = cleanTitle;
                }

        // 步骤2：加载DOM，复刻油猴的解析逻辑
        const $ = cheerio.load(html);
        const rawData = getRawData($, bvid);
        if (!rawData || rawData.length === 0) {
            console.log(`  ⚠️  未解析到任何分P数据（检查BV号是否正确）`);
            return false;
        }

        // 步骤3：转换为歌单格式（和之前一致）
        let songs = [];
        rawData.forEach(col => {
            col.parts.forEach((p, i) => {
                // 歌名解析（和油猴/转换器逻辑一致）
                let artist = col.up;
                let songTitle = p;
                
                let cleanTitle = p.replace(/^\d+\.\s*/, '').replace(/^P\d+[：:]\s*/, '');
                if (cleanTitle.includes(' - ')) {
                    const parts = cleanTitle.split(' - ');
                    songTitle = parts[0].trim();
                    artist = parts[parts.length - 1].trim() || artist;
                } else {
                    songTitle = cleanTitle;
                }

                songs.push({
                    title: songTitle,
                    artist: artist,
                    collection: col.collectionTitle,
                    up: col.up,
                    link: `${BILI_VIDEO_PREFIX}${col.collectionBv}?p=${i+1}`
                });
            });
        });

        // 步骤3：生成JS文件
        const outputPath = path.join(DATA_DIR, `${file}.js`);
        let outputContent = `// ${alias} - 歌单数据（浏览器渲染版）\n`;
        // 步骤4：生成JS文件（覆盖模式）
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

        fs.writeFileSync(outputPath, outputContent);
        console.log(`  ✅ 成功: 生成 ${songs.length} 首歌曲 -> ${file}.js`);
        return true;

    } catch (err) {
        console.error(`  ❌ 异常错误:`, err.message);
        return false;
    }
}

// ================= 5. 主程序 =================
async function main() {
    console.log("========================================");
    console.log("   🚀 B站分P解析（油猴逻辑复刻）启动");
    console.log("========================================");
    
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let successCount = 0;
    for (const config of SINGER_CONFIGS) {
        const ok = await processSinger(config);
        if (ok) successCount++;
        // 避免频繁请求被封
        await new Promise(resolve => setTimeout(resolve, 2000));
        await new Promise(r => setTimeout(r, DELAY_TIME)); // 和油猴的延迟一致
    }

    console.log("\n========================================");
    console.log(`   🏁 任务结束: 成功更新 ${successCount}/${SINGER_CONFIGS.length} 位歌手`);
    console.log("========================================");
}

<<<<<<< HEAD
main().catch(err => console.error("全局错误:", err.message));
main().catch(err => console.error("全局错误:", err.message));
