// scripts/update-songs.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer'); // 仅保留Puppeteer（模拟真实浏览器，避免被B站检测）

// ================= 1. 常量配置（和油猴脚本1:1） =================
const DELAY_TIME = 1500;
const BILI_VIDEO_PREFIX = 'https://www.bilibili.com/video/';
const BV_REGEX = /BV\w+/;
// 选择器（和油猴脚本完全一致）
const PLAYLIST_SELECTORS = ['.video-pod__list .pod-item'];
const PART_TITLE_SELECTOR = '.page-list .page-item.sub .title-txt';
const COLLECTION_TITLE_SELECTOR = '.head .title-txt';

// ================= 2. 歌手配置（保留你的最新配置） =================
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
    { bvid: "BV1PZHdzqE6k", file: "nayuta-piano-live", alias: "nayuta生演奏" },
    { bvid: "BV1MPpUzsE1D", file: "nayuta-daily", alias: "nayuta日常" },
    { bvid: "BV1UCkhBkEon", file: "MunMosh", alias: "むんもっしゅ" },
    { bvid: "BV11GZtBcEsp", file: "others", alias: "其他歌手" }
];

const DATA_DIR = path.join(__dirname, '..', 'data');
const BILI_VIDEO_URL = (bvid) => `https://www.bilibili.com/video/${bvid}`;

// ================= 3. 核心：Puppeteer加载页面（适配GitHub Actions） =================
async function loadVideoPageWithBrowser(bvid) {
    const url = BILI_VIDEO_URL(bvid);
    let browser;

    try {
        // 启动浏览器（适配GitHub Actions的Ubuntu环境）
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox', // Ubuntu root运行必须
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // 解决内存不足
                '--disable-blink-features=AutomationControlled', // 避免被B站识别为爬虫
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                '--disable-gpu', // 无GPU环境
                '--window-size=1920,1080'
            ],
            // GitHub Actions环境指定Chrome路径（通过环境变量）
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        });

        const page = await browser.newPage();
        // 模拟真实浏览器请求头
        await page.setExtraHTTPHeaders({
            'Referer': 'https://www.bilibili.com/',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        });

        // 禁用webdriver检测
        await page.evaluateOnNewDocument(() => {
            delete window.navigator.webdriver;
        });

        // 加载页面（等待网络空闲，超时60秒）
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // 等待DELAY_TIME（和油猴一致）
        await new Promise(resolve => setTimeout(resolve, DELAY_TIME));

        // 1:1 复刻油猴的getRawData逻辑（在浏览器环境执行）
        const rawData = await page.evaluate((PLAYLIST_SELECTORS, PART_TITLE_SELECTOR, COLLECTION_TITLE_SELECTOR, BV_REGEX, bvid) => {
            let containers = [];
            // 遍历选择器，找到第一个有内容的容器
            for (const sel of PLAYLIST_SELECTORS) {
                containers = document.querySelectorAll(sel);
                if (containers.length > 0) break;
            }

            if (containers.length === 0) {
                return null;
            }

            // 解析分P数据
            return Array.from(containers).map((container, idx) => {
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

                // 提取分P标题
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
        }, PLAYLIST_SELECTORS, PART_TITLE_SELECTOR, COLLECTION_TITLE_SELECTOR, BV_REGEX, bvid);

        await browser.close();
        return rawData;

    } catch (err) {
        if (browser) await browser.close();
        throw new Error(`浏览器加载失败: ${err.message}`);
    }
}

// ================= 4. 处理单个歌手 =================
async function processSinger(config) {
    const { bvid, file, alias } = config;
    console.log(`\n[处理中] ${alias} (BV: ${bvid})...`);
    
    try {
        // 步骤1：加载页面并解析分P数据
        const rawData = await loadVideoPageWithBrowser(bvid);
        if (!rawData || rawData.length === 0) {
            console.log(`  ⚠️  未解析到任何分P数据（检查BV号或视频是否有分P）`);
            return false;
        }

        // 步骤2：转换为歌单格式（和油猴逻辑一致）
        let songs = [];
        rawData.forEach(col => {
            col.parts.forEach((p, i) => {
                let artist = col.up;
                let songTitle = p;
                
                // 清理标题（去掉前缀数字/P标识）
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
                    link: `${BILI_VIDEO_PREFIX}${col.collectionBv}?p=${i+1}`,
                    source: `${file}.js` // 标记来源文件，适配前端筛选
                });
            });
        });

        // 步骤3：生成JS文件
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

        // 写入文件（处理权限）
        fs.writeFileSync(outputPath, outputContent, { encoding: 'utf8', mode: 0o644 });
        console.log(`  ✅ 成功: 生成 ${songs.length} 首歌曲 -> ${file}.js`);
        return true;

    } catch (err) {
        console.error(`  ❌ 异常错误:`, err.message);
        return false;
    }
}

// ================= 5. 生成index.json（适配前端加载） =================
function generateIndexJson() {
    const indexPath = path.join(DATA_DIR, 'index.json');
    const files = SINGER_CONFIGS.map(config => `${config.file}.js`);
    fs.writeFileSync(indexPath, JSON.stringify({ files: files }, null, 2), 'utf8');
    console.log(`\n✅ 生成index.json: 包含 ${files.length} 个数据文件`);
}

// ================= 6. 主程序 =================
async function main() {
    console.log("========================================");
    console.log("   🚀 B站分P解析（油猴逻辑复刻）启动");
    console.log("========================================");
    
    // 创建data目录（如果不存在）
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let successCount = 0;
    // 遍历处理每个歌手
    for (const config of SINGER_CONFIGS) {
        const ok = await processSinger(config);
        if (ok) successCount++;
        // 延迟2秒，避免频繁请求被B站封禁
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 生成index.json
    generateIndexJson();

    // 输出结果
    console.log("\n========================================");
    console.log(`   🏁 任务结束: 成功更新 ${successCount}/${SINGER_CONFIGS.length} 位歌手`);
    console.log("========================================");
}

// 执行主程序
main().catch(err => {
    console.error("❌ 全局错误:", err.message);
    process.exit(1); // 退出并标记失败，让GitHub Actions捕获
});
