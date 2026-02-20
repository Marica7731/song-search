// scripts/update-songs.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const cheerio = require('cheerio'); // 复刻油猴的DOM解析

// ================= 1. 完全复用油猴脚本的常量（一字不改） =================
const DELAY_TIME = 1500;
const BILI_VIDEO_PREFIX = 'https://www.bilibili.com/video/';
const BV_REGEX = /BV\w+/;

// 选择器（和油猴脚本1:1一致，保证解析逻辑相同）
const PLAYLIST_SELECTORS = ['.video-pod__list .pod-item'];
const PART_TITLE_SELECTOR = '.page-list .page-item.sub .title-txt';
const COLLECTION_TITLE_SELECTOR = '.head .title-txt';

// ================= 2. 歌手配置（填合集页面URL，而非BV号/season_id） =================
// 关键：url 填你油猴脚本能解析的「B站合集页面完整URL」
const SINGER_CONFIGS = [
    { url: "https://space.bilibili.com/xxx/channel/collectiondetail?sid=xxx", file: "naraetan", alias: "なれたん Naraetan" },
    { url: "https://space.bilibili.com/xxx/channel/collectiondetail?sid=xxx", file: "figaro", alias: "Figaro" },
    { url: "https://space.bilibili.com/xxx/channel/collectiondetail?sid=xxx", file: "ririsya", alias: "凛凛咲 ririsya" },
    { url: "https://space.bilibili.com/xxx/channel/collectiondetail?sid=xxx", file: "suu_usuwa", alias: "稀羽すう Suu_Usuwa" },
    { url: "https://space.bilibili.com/xxx/channel/collectiondetail?sid=xxx", file: "ray", alias: "來-Ray-" },
    { url: "https://space.bilibili.com/xxx/channel/collectiondetail?sid=xxx", file: "sakusan", alias: "酢酸 / SAKUSAN" },
    { url: "https://space.bilibili.com/xxx/channel/collectiondetail?sid=xxx", file: "yoshika", alias: "よしか YOSHIKA" },
    { url: "https://space.bilibili.com/xxx/channel/collectiondetail?sid=xxx", file: "yuri", alias: "優莉 yuri" },
    { url: "https://space.bilibili.com/xxx/channel/collectiondetail?sid=xxx", file: "otomoneruki", alias: "音門るき" },
    { url: "https://space.bilibili.com/xxx/channel/collectiondetail?sid=xxx", file: "others", alias: "其他歌手" }
];

const DATA_DIR = path.join(__dirname, '..', 'data');

// ================= 3. 工具函数：下载合集页面HTML（模拟浏览器请求） =================
function downloadPageHtml(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://www.bilibili.com/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Cookie': '' // 可选：填B站登录后的Cookie（如果合集需要登录才能看）
            }
        };

        https.get(url, options, (res) => {
            let html = '';
            res.on('data', chunk => html += chunk.toString('utf-8'));
            res.on('end', () => resolve(html));
            res.on('error', reject);
        }).on('error', reject);
    });
}

// ================= 4. 核心逻辑：1:1 复刻油猴的 getRawData 函数 =================
function parseCollectionData(html, pageUrl) {
    const $ = cheerio.load(html); // 加载HTML到cheerio，模拟浏览器DOM
    const bv = pageUrl.match(BV_REGEX) ? pageUrl.match(BV_REGEX)[0] : '未知BV号';

    // 步骤1：找合集容器（和油猴的循环选择器逻辑一致）
    let containers = [];
    for (const sel of PLAYLIST_SELECTORS) {
        containers = $(sel);
        if (containers.length > 0) break;
    }

    if (containers.length === 0) {
        console.log('❌ 未检测到分P容器（和油猴提示一致）');
        return null;
    }

    // 步骤2：遍历容器，提取数据（完全复刻油猴逻辑）
    const result = [];
    containers.each((idx, container) => {
        const $container = $(container);

        // 提取合集标题
        const colTitleNode = $container.find(COLLECTION_TITLE_SELECTOR);
        let colTitle = colTitleNode?.text()?.trim() || `合集${idx+1}`;

        // 提取UP主（和油猴的正则+备选逻辑一致）
        let upName = "未知UP主";
        const upMatch = colTitle.match(/\[([^\]]+?\s*Ch\.[^\]]+)\]/);
        if (upMatch) {
            upName = upMatch[1];
        } else {
            const upEle = $('.up-name'); // 油猴里的备选选择器
            if (upEle.length > 0) upName = upEle.text().trim();
        }

        // 提取分P标题（和油猴的partNodes逻辑一致）
        const partNodes = $container.find(PART_TITLE_SELECTOR);
        const parts = [];
        partNodes.each((_, node) => {
            parts.push($(node).text().trim());
        });

        // 提取合集BV号（和油猴的dataset.key逻辑一致）
        const collectionBv = $container.attr('data-key')?.match(BV_REGEX)?.[0] || bv;

        result.push({
            collectionBv: collectionBv,
            collectionTitle: colTitle,
            up: upName,
            parts: parts
        });
    });

    return result;
}

// ================= 5. 处理单个歌手（生成歌单数据） =================
async function processSinger(config) {
    const { url, file, alias } = config;
    console.log(`\n[处理中] ${alias} (URL: ${url})...`);
    
    try {
        // 步骤1：下载合集页面HTML
        const html = await downloadPageHtml(url);
        if (!html) {
            console.log(`  ❌ 页面下载失败`);
            return false;
        }

        // 步骤2：解析DOM（复刻油猴逻辑）
        const rawData = parseCollectionData(html, url);
        if (!rawData || rawData.length === 0) {
            console.log(`  ⚠️  未解析到任何歌单数据`);
            return false;
        }

        // 步骤3：转换为歌单格式（和之前一致）
        let songs = [];
        rawData.forEach(col => {
            col.parts.forEach((p, i) => {
                // 歌名解析（和转换器/油猴逻辑一致）
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

        // 步骤4：生成JS文件（覆盖模式）
        const outputPath = path.join(DATA_DIR, `${file}.js`);
        let outputContent = `// ${alias} - 歌单数据（DOM解析版）\n`;
        outputContent += `// 来源: ${url}\n`;
        outputContent += `// 生成时间: ${new Date().toLocaleString()}\n\n`;
        outputContent += `window.SONG_DATA = window.SONG_DATA || [];\n\n`;
        outputContent += `window.SONG_DATA.push(\n`;
        
        songs.forEach((song, index) => {
            outputContent += `    ${JSON.stringify(song, null, 2)}`;
            if (index < songs.length - 1) outputContent += ",";
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

// ================= 6. 主程序 =================
async function main() {
    console.log("========================================");
    console.log("   🚀 B站合集DOM解析 - 歌单更新启动");
    console.log("========================================");
    
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let successCount = 0;
    for (const config of SINGER_CONFIGS) {
        const ok = await processSinger(config);
        if (ok) successCount++;
        await new Promise(r => setTimeout(r, 2000)); // 防反爬，间隔2秒
    }

    console.log("\n========================================");
    console.log(`   🏁 任务结束: 成功更新 ${successCount}/${SINGER_CONFIGS.length} 位歌手`);
    console.log("========================================");
}

main().catch(console.error);
