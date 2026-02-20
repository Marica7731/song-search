// scripts/update-songs.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const cheerio = require('cheerio'); // 复刻油猴的DOM解析

// ================= 1. 完全复刻油猴在视频页的核心常量 =================
// 视频页分P列表的选择器（油猴脚本里解析分P的核心选择器，你可以替换成自己油猴里的）
// 通用B站视频页分P选择器（99%油猴脚本都会用这个，若你的不一样，替换成你油猴里的即可）
const VIDEO_PAGE_PART_SELECTOR = '.list-box li.page-item'; // 视频页分P项选择器
const VIDEO_PAGE_TITLE_SELECTOR = 'h1.video-title'; // 视频主标题选择器
const VIDEO_PAGE_UP_SELECTOR = '.up-name'; // UP主名称选择器

// ================= 2. 歌手配置（填BV号即可，脚本自动生成视频页URL） =================
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
const BILI_VIDEO_URL = (bvid) => `https://www.bilibili.com/video/${bvid}`; // 视频页URL模板

// ================= 3. 工具函数：下载视频页HTML（模拟浏览器） =================
function downloadVideoPage(bvid) {
    const url = BILI_VIDEO_URL(bvid);
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://www.bilibili.com/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
                // 无需Cookie，和你油猴脚本一致
            }
        };

        https.get(url, options, (res) => {
            let html = '';
            // 处理编码，避免中文乱码
            res.setEncoding('utf-8');
            res.on('data', chunk => html += chunk);
            res.on('end', () => resolve(html));
            res.on('error', err => reject(`页面下载失败: ${err.message}`));
        }).on('error', err => reject(`请求失败: ${err.message}`));
    });
}

// ================= 4. 核心：1:1 复刻油猴在视频页的DOM解析逻辑 =================
function parseVideoPage(html, bvid) {
    const $ = cheerio.load(html); // 模拟浏览器DOM环境
    const songs = [];

    // 步骤1：提取视频主标题（合集/视频名称）
    const collectionTitle = $(VIDEO_PAGE_TITLE_SELECTOR).text().trim() || `视频_${bvid}`;

    // 步骤2：提取UP主名称
    const upName = $(VIDEO_PAGE_UP_SELECTOR).text().trim() || "未知UP主";

    // 步骤3：解析分P列表（和油猴脚本完全一致）
    $(VIDEO_PAGE_PART_SELECTOR).each((index, partNode) => {
        const $part = $(partNode);
        // 提取分P标题（油猴里的核心逻辑）
        let rawTitle = $part.find('span').text().trim() || $part.text().trim();
        if (!rawTitle) return; // 跳过空分P

        // 解析歌名/歌手（和你油猴/转换器逻辑完全一致）
        let artist = upName;
        let songTitle = rawTitle;
        
        // 移除开头序号（01. / P1: 等）
        let cleanTitle = rawTitle.replace(/^\d+\.\s*/, '').replace(/^P\d+[：:]\s*/, '');
        // 分离 "歌名 - 歌手"
        if (cleanTitle.includes(' - ')) {
            const parts = cleanTitle.split(' - ');
            songTitle = parts[0].trim();
            artist = parts[parts.length - 1].trim() || artist;
        } else {
            songTitle = cleanTitle;
        }

        // 生成分P链接
        const partIndex = index + 1;
        const link = `${BILI_VIDEO_URL(bvid)}?p=${partIndex}`;

        songs.push({
            title: songTitle,
            artist: artist,
            collection: collectionTitle,
            up: upName,
            link: link
        });
    });

    return songs;
}

// ================= 5. 处理单个歌手 =================
async function processSinger(config) {
    const { bvid, file, alias } = config;
    console.log(`\n[处理中] ${alias} (BV: ${bvid})...`);
    
    try {
        // 步骤1：下载视频页HTML
        const html = await downloadVideoPage(bvid);
        if (!html) {
            console.log(`  ❌ 视频页下载失败`);
            return false;
        }

        // 步骤2：解析DOM提取分P数据（复刻油猴）
        const songs = parseVideoPage(html, bvid);
        if (songs.length === 0) {
            console.log(`  ⚠️  未解析到任何分P数据（检查BV号或选择器）`);
            return false;
        }

        // 步骤3：生成JS文件（覆盖模式，符合你的需求）
        const outputPath = path.join(DATA_DIR, `${file}.js`);
        let outputContent = `// ${alias} - 歌单数据（视频页DOM解析）\n`;
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

        // 覆盖写入文件（'w'模式，每次全量替换）
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
    console.log("   🚀 B站视频页DOM解析 - 歌单更新启动");
    console.log("========================================");
    
    // 确保data目录存在
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let successCount = 0;
    // 串行处理，防反爬
    for (const config of SINGER_CONFIGS) {
        const ok = await processSinger(config);
        if (ok) successCount++;
        await new Promise(r => setTimeout(r, 1500)); // 和油猴的DELAY_TIME一致
    }

    console.log("\n========================================");
    console.log(`   🏁 任务结束: 成功更新 ${successCount}/${SINGER_CONFIGS.length} 位歌手`);
    console.log("========================================");
}

// 启动主程序
main().catch(err => console.error("全局错误:", err.message));
