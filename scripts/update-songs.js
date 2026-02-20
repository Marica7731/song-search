// scripts/update-songs.js
const fs = require('fs');
const path = require('path');
const https = require('https');

// ================= 配置区 =================
// 在这里填入你想要监控的 BV 号列表
const TARGET_BVIDS = [
    "BV1hRZPB5EDD", // 示例：なれたん的昭和名曲
    "BV1jxZABLEWJ"  // 示例：另一个合集
];
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'auto-naraetan.js');

// ================= 工具函数：HTTPS请求封装 =================
function request(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.bilibili.com/'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// ================= 核心逻辑：复刻油猴提取 =================
async function fetchBvidInfo(bvid) {
    console.log(`[${bvid}] 正在获取信息...`);
    
    // 1. 请求视频详情接口 (获取标题、UP主、分P列表)
    // 这个接口就像油猴脚本里的 document.querySelector
    const viewData = await request(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
    
    if (viewData.code !== 0) {
        console.error(`[${bvid}] 获取失败:`, viewData.message);
        return null;
    }

    const data = viewData.data;
    const title = data.title;
    const upName = data.owner.name;
    
    // 解析分P列表 (Pages)
    let songs = [];
    
    // 如果是多P视频
    if (data.pages && data.pages.length > 0) {
        data.pages.forEach((page, index) => {
            // 这里的逻辑对应油猴里的 partNodes 提取
            // page.part 是分P标题
            const rawTitle = page.part;
            
            // 简单的歌名解析 (和你 converter.html 里的逻辑保持一致)
            let artist = "未知歌手";
            let songTitle = rawTitle;
            
            // 尝试分离 "01. 歌名 - 歌手"
            let cleanTitle = rawTitle.replace(/^\d+\.\s*/, '');
            if (cleanTitle.includes(' - ')) {
                const parts = cleanTitle.split(' - ');
                songTitle = parts[0].trim();
                artist = parts[1].trim();
            } else {
                songTitle = cleanTitle;
            }

            songs.push({
                title: songTitle,
                artist: artist,
                collection: title, // 用视频标题当合集名
                up: upName,
                link: `https://www.bilibili.com/video/${bvid}?p=${index + 1}`
            });
        });
    }

    return songs;
}

// ================= 主程序 =================
async function main() {
    console.log("🚀 开始自动更新歌库...");
    
    // 确保 data 目录存在
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let allSongs = [];

    // 遍历所有配置的 BV 号
    for (const bvid of TARGET_BVIDS) {
        const songs = await fetchBvidInfo(bvid);
        if (songs) {
            allSongs = allSongs.concat(songs);
        }
        // 稍微休眠一下，避免请求过快被封
        await new Promise(r => setTimeout(r, 500));
    }

    // 生成最终的 JS 文件 (格式和你 data/ 目录下的要求一致)
    let outputContent = `// 此文件由 GitHub Actions 自动生成\n`;
    outputContent += `// 生成时间: ${new Date().toLocaleString()}\n\n`;
    outputContent += `window.SONG_DATA = window.SONG_DATA || [];\n\n`;
    outputContent += `window.SONG_DATA.push(\n`;
    
    allSongs.forEach((song, index) => {
        outputContent += `    ${JSON.stringify(song)}`;
        if (index < allSongs.length - 1) outputContent += ",";
        outputContent += "\n";
    });
    
    outputContent += `);\n`;

    // 写入文件
    fs.writeFileSync(OUTPUT_FILE, outputContent);
    console.log(`✅ 成功更新 ${allSongs.length} 首歌曲到 ${OUTPUT_FILE}`);
}

main().catch(console.error);
