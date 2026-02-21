// scripts/update-songs.js
const fs = require('fs');
const path = require('path');
const https = require('https');

// ================= 配置区 (已填入你的歌手列表) =================
// 说明：
// - bvid: 合集的 BV 号
// - file: 生成的文件名 (不用加 .js)
// - alias: 歌手别名/昵称 (用于日志)
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

// ================= 工具函数：HTTPS请求封装 =================
function request(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

// ================= 新增：对齐油猴的通用解析工具函数 =================
/**
 * 提取UP主名（对齐油猴逻辑：优先从合集标题解析[名字 Ch.xxx]，兜底用API返回的UP名）
 * @param {string} collectionTitle 合集标题
 * @param {string} defaultUpName API返回的默认UP名
 * @returns {string} 解析后的UP名
 */
function extractUpName(collectionTitle, defaultUpName) {
    // 油猴逻辑：解析 [名字 Ch.xxx] 格式
    const upMatch = collectionTitle.match(/\[([^\]]+?\s*Ch\.[^\]]+)\]/);
    if (upMatch) {
        return upMatch[1].trim();
    }
    // 兜底用API返回的UP名
    return defaultUpName || "未知UP主";
}

/**
 * 清洗标题（对齐油猴的单集/分P标题清洗逻辑）
 * @param {string} rawTitle 原始分P/单集标题
 * @returns {string} 清洗后的标题
 */
function cleanTitle(rawTitle) {
    // 油猴逻辑：移除开头序号 "01. " 或 "P1："
    return rawTitle.replace(/^\d+\.\s*/, '').replace(/^P\d+[：:]\s*/, '').trim();
}

// ================= 核心逻辑：处理单个BV号 =================
async function processSinger(config) {
    const { bvid, file, alias } = config;
    console.log(`\n[处理中] ${alias} (${bvid})...`);
    
    try {
        // 1. 请求 B站 接口
        const viewData = await request(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
        
        if (viewData.code !== 0) {
            console.error(`  ❌ 失败: ${viewData.message}`);
            return null;
        }

        const data = viewData.data;
        const collectionTitle = data.title || `合集_${bvid}`; // 兜底：防止标题为空
        // 新增：对齐油猴的UP主提取逻辑
        const upName = extractUpName(collectionTitle, data.owner?.name || "未知UP主");
        
        let songs = [];

        // 2. 解析分P/单集列表（适配单集场景：pages为空则用视频主标题）
        const pages = data.pages && data.pages.length > 0 ? data.pages : [
            // 单集场景兜底：模拟pages结构，用主标题当分P标题
            { part: data.title, page: 1 }
        ];

        pages.forEach((page, index) => {
            const rawTitle = page.part || collectionTitle; // 兜底：分P标题为空则用合集标题
            const cleanPartTitle = cleanTitle(rawTitle); // 复用清洗逻辑
            
            // 解析歌名逻辑 (对齐油猴+原有规则)
            let artist = upName; // 优先用解析后的UP名
            let songTitle = cleanPartTitle;
            
            // 尝试分离 "歌名 - 歌手" (保留原有逻辑，增强兜底)
            if (cleanPartTitle.includes(' - ')) {
                const parts = cleanPartTitle.split(' - ');
                songTitle = parts[0].trim();
                const maybeArtist = parts[parts.length - 1].trim();
                // 增强：排除空值/无意义字符串
                if (maybeArtist.length > 0 && !maybeArtist.match(/^\s*$/)) {
                    artist = maybeArtist;
                }
            }

            songs.push({
                title: songTitle,
                artist: artist,
                collection: collectionTitle,
                up: upName, // 替换为解析后的UP名
                link: `https://www.bilibili.com/video/${bvid}?p=${index + 1}`
            });
        });

        // 3. 生成文件内容（保留原有结构，仅对齐变量）
        const outputPath = path.join(DATA_DIR, `${file}.js`);
        let outputContent = `// ${alias} - 歌单数据\n`;
        outputContent += `// 来源: ${collectionTitle}\n`;
        outputContent += `// 生成时间: ${new Date().toLocaleString()}\n`;
        outputContent += `// 监控 BV: ${bvid}\n\n`;
        outputContent += `window.SONG_DATA = window.SONG_DATA || [];\n\n`;
        outputContent += `window.SONG_DATA.push(\n`;
        
        songs.forEach((song, index) => {
            outputContent += `    ${JSON.stringify(song, null, 2)}`; // 新增：格式化JSON，更易读
            if (index < songs.length - 1) outputContent += ",";
            outputContent += "\n";
        });
        
        outputContent += `);\n`;

        // 4. 写入文件
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
    
    // 确保 data 目录存在
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let successCount = 0;
    
    // 串行处理每个歌手 (避免并发请求被封IP)
    for (const config of SINGER_CONFIGS) {
        const ok = await processSinger(config);
        if (ok) successCount++;
        // 每个请求间隔 1秒，防止请求过快
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("\n========================================");
    console.log(`   🏁 任务结束: 成功更新 ${successCount}/${SINGER_CONFIGS.length} 位歌手`);
    console.log("========================================");
}

main().catch(console.error);
