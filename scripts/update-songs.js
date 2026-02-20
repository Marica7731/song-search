// scripts/update-songs.js
const fs = require('fs');
const path = require('path');
const https = require('https');

// ================= 配置区 (更新：区分「单个视频」和「合集」) =================
// 说明：
// - type: "video" (单个多P视频) / "collection" (B站合集，需要填season_id)
// - bvid: 视频BV号（type=video时用）
// - season_id: 合集ID（type=collection时用，从合集页面URL里找）
// - file: 生成的文件名
// - alias: 歌手别名
const SINGER_CONFIGS = [
    { type: "video", bvid: "BV1G6fLB7Efr", file: "naraetan", alias: "なれたん Naraetan" },
    { type: "video", bvid: "BV1HRfuBCEXN", file: "figaro", alias: "Figaro" },
    { type: "video", bvid: "BV1cofuBGEkX", file: "ririsya", alias: "凛凛咲 ririsya" },
    { type: "video", bvid: "BV1aPFczzE6R", file: "suu_usuwa", alias: "稀羽すう Suu_Usuwa" },
    { type: "video", bvid: "BV1mJZwB8EVa", file: "ray", alias: "來-Ray-" },
    { type: "video", bvid: "BV1JSZHBrEVw", file: "sakusan", alias: "酢酸 / SAKUSAN" },
    { type: "video", bvid: "BV1p1zBBCEZ3", file: "yoshika", alias: "よしか YOSHIKA" },
    { type: "video", bvid: "BV1aDzEBBE3S", file: "yuri", alias: "優莉 yuri" },
    // 示例：如果是合集，改成 type=collection + 填season_id
    // { type: "collection", season_id: "123456", file: "otomoneruki", alias: "音門るき" },
    { type: "video", bvid: "BV1zzZPBsEum", file: "otomoneruki", alias: "音門るき" },
    { type: "video", bvid: "BV11GZtBcEsp", file: "others", alias: "其他歌手" }
];

const DATA_DIR = path.join(__dirname, '..', 'data');

// ================= 工具函数：HTTPS请求封装 =================
function request(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.bilibili.com/',
                'Cookie': '' // 如果接口限频，可填B站登录后的Cookie（非必需）
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    // 如果是合集页面，返回的可能是HTML，这里做兼容
                    resolve({ raw: data, code: -1 });
                }
            });
        }).on('error', reject);
    });
}

// ================= 核心逻辑1：处理单个视频（多P） =================
async function fetchVideoInfo(bvid) {
    const viewData = await request(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
    if (viewData.code !== 0) {
        console.error(`  ❌ 单个视频接口失败: ${viewData.message}`);
        return [];
    }

    const data = viewData.data;
    const collectionTitle = data.title;
    const upName = data.owner.name;
    let songs = [];

    // 解析单个视频的分P
    if (data.pages && data.pages.length > 0) {
        data.pages.forEach((page, index) => {
            const rawTitle = page.part || `P${index+1}`;
            let artist = upName;
            let songTitle = rawTitle;
            
            // 解析歌名（和油猴/转换器逻辑一致）
            let cleanTitle = rawTitle.replace(/^\d+\.\s*/, '').replace(/^P\d+[：:]\s*/, '');
            if (cleanTitle.includes(' - ')) {
                const parts = cleanTitle.split(' - ');
                songTitle = parts[0].trim();
                artist = parts[parts.length - 1].trim() || upName;
            } else {
                songTitle = cleanTitle;
            }

            songs.push({
                title: songTitle,
                artist: artist,
                collection: collectionTitle,
                up: upName,
                link: `https://www.bilibili.com/video/${bvid}?p=${index + 1}`
            });
        });
    }
    return songs;
}

// ================= 核心逻辑2：处理B站合集（复刻油猴脚本） =================
async function fetchCollectionInfo(season_id) {
    // B站合集接口（和油猴脚本解析的合集页面数据一致）
    const collData = await request(`https://api.bilibili.com/x/polymer/space/seasons_archives_list?season_id=${season_id}&page_num=1&page_size=100`);
    if (collData.code !== 0) {
        console.error(`  ❌ 合集接口失败: ${collData.message}`);
        return [];
    }

    const data = collData.data;
    const collectionTitle = data.season_info.title || "未知合集";
    const upName = data.season_info.up_info.name || "未知UP主";
    let songs = [];

    // 解析合集里的所有视频（复刻油猴脚本的partNodes解析）
    if (data.archives && data.archives.length > 0) {
        data.archives.forEach((archive, index) => {
            const rawTitle = archive.title;
            let artist = upName;
            let songTitle = rawTitle;
            
            // 同样的歌名解析逻辑
            let cleanTitle = rawTitle.replace(/^\d+\.\s*/, '').replace(/^P\d+[：:]\s*/, '');
            if (cleanTitle.includes(' - ')) {
                const parts = cleanTitle.split(' - ');
                songTitle = parts[0].trim();
                artist = parts[parts.length - 1].trim() || upName;
            } else {
                songTitle = cleanTitle;
            }

            songs.push({
                title: songTitle,
                artist: artist,
                collection: collectionTitle,
                up: upName,
                link: `https://www.bilibili.com/video/${archive.bvid}`
            });
        });
    }
    return songs;
}

// ================= 主处理函数（适配两种类型） =================
async function processSinger(config) {
    const { type, bvid, season_id, file, alias } = config;
    console.log(`\n[处理中] ${alias}...`);
    
    let songs = [];
    try {
        // 根据类型选择接口
        if (type === "video") {
            songs = await fetchVideoInfo(bvid);
        } else if (type === "collection") {
            songs = await fetchCollectionInfo(season_id);
        }

        if (songs.length === 0) {
            console.log(`  ⚠️  未获取到任何歌曲数据`);
            return false;
        }

        // 生成文件（覆盖模式，和你期望的一致）
        const outputPath = path.join(DATA_DIR, `${file}.js`);
        let outputContent = `// ${alias} - 歌单数据\n`;
        outputContent += `// 类型: ${type === "video" ? `视频(${bvid})` : `合集(${season_id})`}\n`;
        outputContent += `// 生成时间: ${new Date().toLocaleString()}\n\n`;
        outputContent += `window.SONG_DATA = window.SONG_DATA || [];\n\n`;
        outputContent += `window.SONG_DATA.push(\n`;
        
        songs.forEach((song, index) => {
            outputContent += `    ${JSON.stringify(song, null, 2)}`;
            if (index < songs.length - 1) outputContent += ",";
            outputContent += "\n";
        });
        
        outputContent += `);\n`;

        // 写入文件（'w' 模式 = 覆盖原有内容）
        fs.writeFileSync(outputPath, outputContent);
        console.log(`  ✅ 成功: 生成 ${songs.length} 首歌曲 -> ${file}.js`);
        return true;

    } catch (err) {
        console.error(`  ❌ 异常错误:`, err.message);
        return false;
    }
}

// ================= 主程序 =================
async function main() {
    console.log("========================================");
    console.log("   🚀 B站歌库自动更新任务启动");
    console.log("========================================");
    
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let successCount = 0;
    for (const config of SINGER_CONFIGS) {
        const ok = await processSinger(config);
        if (ok) successCount++;
        await new Promise(r => setTimeout(r, 1000)); // 防限频
    }

    console.log("\n========================================");
    console.log(`   🏁 任务结束: 成功更新 ${successCount}/${SINGER_CONFIGS.length} 位歌手`);
    console.log("========================================");
}

main().catch(console.error);
