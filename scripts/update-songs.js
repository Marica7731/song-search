const fs = require('fs');
const path = require('path');

const DEFAULT_ARTIST_TEXT = '来源处未提供标准格式歌手';
const BILI_VIDEO_PREFIX = 'https://www.bilibili.com/video/';
const BILI_VIEW_API = 'https://api.bilibili.com/x/web-interface/view?bvid=';
const BV_REGEX = /BV[0-9a-zA-Z]+/;
const CLEAN_SUFFIX_REGEX = /(\s*\(\d+\)|_(sub|copy|backup|1080p|720p|\d+))$/i;
const TRAILING_TAG_REGEX = /(?:\s*(?:\[[^\]]*\]|【[^】]*】|【[^】]*))+$/;
const LEADING_SOURCE_REGEX = /^(?:\s*【[^】]+】)+\s*/;
const LEADING_INDEX_REGEX = /^(?:\s*\[\d+(?:\s*[-/]\s*\d+)+\]\.?\s*|\s*\d+\.\s+|\s*P\d+[：:]\s*)/i;

const SINGER_CONFIGS = [
    { bvids: ["BV1JRwUzoEpM","BV1icwSzXEYv"], file: "asuyumekanae", alias: "明日夢かなえ" },
    { bvids: ["BV1owcoz3Ekw"], file: "chiyutori ", alias: "知悠" },
    { bvids: ["BV1R2wQzfEuY"], file: "momijimaru", alias: "紅葉丸" },
    { bvids: ["BV1G4wxzmEV5"], file: "kukuri", alias: "戸鎖くくり" },
    { bvids: ["BV1G6fLB7Efr","BV1J5P7zrEB3"], file: "naraetan", alias: "なれたん Naraetan" },
    { bvids: ["BV1HRfuBCEXN"], file: "figaro", alias: "Figaro" },
    { bvids: ["BV1cofuBGEkX"], file: "ririsya", alias: "凛凛咲 ririsya" },
    { bvids: ["BV1ve411z7Nm"], file: "suu_usuwa", alias: "稀羽すう Suu_Usuwa" },
    { bvids: ["BV1mJZwB8EVa"], file: "ray", alias: "來-Ray-" },
    { bvids: ["BV1JSZHBrEVw"], file: "sakusan", alias: "酢酸 / SAKUSAN" },
    { bvids: ["BV1p1zBBCEZ3"], file: "yoshika", alias: "よしか YOSHIKA" },
    { bvids: ["BV1aDzEBBE3S"], file: "yuri", alias: "優莉 yuri" },
    { bvids: ["BV1zzZPBsEum"], file: "otomoneruki", alias: "音門るき" },
    { bvids: ["BV1dGqeYpEuc"], file: "earendel", alias: "厄倫蒂兒" },
    { bvids: ["BV1hw4m1i7qN"], file: "linon", alias: "天籠りのん" },
    { bvids: ["BV1MEP8z4E1J"], file: "stella", alias: "天ノ譜ステラ" },
    { bvids: ["BV11fQSB2ELX"], file: "hoshiho", alias: "HoshiHo" },
    { bvids: ["BV167c2znErj"], file: "shuna", alias: "朱名" },
    { bvids: ["BV1GXYFzXETo","BV1MPpUzsE1D","BV184W5zeE1Z"], file: "nayuta", alias: "nayuta" },
    { bvids: ["BV1UCkhBkEon"], file: "MunMosh", alias: "むんもっしゅ" },
    { bvids: ["BV1kLXbBJEiZ"], file: "sumica", alias: "澄花" },
    { bvids: ["BV1KHXxBUErU","BV1iHQXBzEgU"], file: "romany", alias: "ロマニ" },
    { bvids: ["BV1eTkKYDENL"], file: "friends", alias: "联动" },
    { bvids: ["BV1rkCTYzEZN","BV1wt421j7gT","BV1KpCdYmE3T","BV1aC4ce2E5s","BV1JbX9BmE5m"], file: "relay", alias: "接力" },
    { bvids: ["BV11GZtBcEsp","BV1xucZzxEkZ","BV117P2zwEuq"], file: "others", alias: "非常驻妹妹" },
    { bvids: ["BV1Qa9JB6EAw"], alias: "陽月るるふ" }
];

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const METADATA_CACHE_PATH = path.join(REPORT_DIR, 'bv-metadata-cache.json');

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, maxRetries = 3, delay = 2500) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.warn(`⚠️  第 ${attempt} 次尝试失败：${error.message}`);
            if (attempt < maxRetries) {
                await sleep(delay);
            }
        }
    }
    throw lastError;
}

function resolveConfig(config) {
    const alias = config.alias || config.file || config.bvids?.[0] || 'unknown';
    if (config.file) {
        return { ...config, alias, resolvedFile: config.file };
    }

    const aliasSlug = String(alias)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const fallbackSlug = String(config.bvids?.[0] || 'source').toLowerCase();

    return {
        ...config,
        alias,
        resolvedFile: aliasSlug || fallbackSlug
    };
}

const RESOLVED_SINGER_CONFIGS = SINGER_CONFIGS.map(resolveConfig);

function loadMetadataCache() {
    if (!fs.existsSync(METADATA_CACHE_PATH)) return {};
    try {
        const parsed = JSON.parse(fs.readFileSync(METADATA_CACHE_PATH, 'utf8'));
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function saveMetadataCache(cache) {
    fs.writeFileSync(METADATA_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
}

async function fetchJson(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.bilibili.com/'
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

async function fetchBvMetadata(bvid, cache, forceRefresh = false) {
    if (!BV_REGEX.test(bvid)) return null;
    if (!forceRefresh && cache[bvid]) return cache[bvid];

    const payload = await withRetry(async () => {
        const json = await fetchJson(`${BILI_VIEW_API}${bvid}`);
        if (!json || json.code !== 0 || !json.data) {
            throw new Error(`B站接口返回异常：code=${json?.code}`);
        }
        return json.data;
    });

    const metadata = {
        bvid: payload.bvid,
        aid: payload.aid,
        title: payload.title || '',
        ownerName: payload.owner?.name || '',
        ownerMid: payload.owner?.mid || null,
        pubdate: payload.pubdate || null,
        ctime: payload.ctime || null,
        duration: payload.duration || null,
        videos: payload.videos || 0,
        seasonId: payload.ugc_season?.id || null,
        seasonTitle: payload.ugc_season?.title || '',
        pages: Array.isArray(payload.pages) ? payload.pages.map(page => ({
            cid: page.cid || null,
            page: page.page || null,
            part: page.part || '',
            duration: page.duration || null,
            ctime: page.ctime || null
        })) : [],
        sections: Array.isArray(payload.ugc_season?.sections) ? payload.ugc_season.sections.map(section => ({
            title: section.title || '',
            episodes: Array.isArray(section.episodes) ? section.episodes.map(episode => ({
                bvid: episode.bvid,
                aid: episode.aid,
                cid: episode.cid || episode.page?.cid || null,
                title: episode.title || '',
                arcTitle: episode.arc?.title || '',
                pagePart: episode.page?.part || '',
                pageDuration: episode.page?.duration || null
            })) : []
        })) : [],
        fetchedAt: Date.now()
    };

    cache[bvid] = metadata;
    return metadata;
}

function cleanTitle(rawTitle) {
    let title = String(rawTitle || '');
    title = title.replace(/\[\d{4}[-]?\d{2}[-]?\d{2}\]/g, '');
    let previousLength;
    do {
        previousLength = title.length;
        title = title.replace(/\[[^\[\]]*\]\s*$/, '');
    } while (title.length !== previousLength);
    title = title
        .replace(TRAILING_TAG_REGEX, '')
        .trim();

    do {
        previousLength = title.length;
        title = title
            .replace(LEADING_SOURCE_REGEX, '')
            .replace(LEADING_INDEX_REGEX, '')
            .trim();
    } while (title.length !== previousLength);

    return title.replace(CLEAN_SUFFIX_REGEX, '').trim();
}

function cleanArtist(rawArtist) {
    let artist = String(rawArtist || '').trim();
    artist = artist.replace(TRAILING_TAG_REGEX, '').trim();
    artist = artist.replace(LEADING_SOURCE_REGEX, '').trim();
    return artist.replace(CLEAN_SUFFIX_REGEX, '').trim();
}

function splitSongTitleAndArtist(partTitle) {
    const normalized = String(partTitle || '')
        .replace(LEADING_SOURCE_REGEX, '')
        .replace(LEADING_INDEX_REGEX, '')
        .trim();
    const cleaned = cleanTitle(normalized);
    let title = cleaned;
    let artist = DEFAULT_ARTIST_TEXT;

    if (normalized.includes(' - ')) {
        const parts = normalized.split(' - ');
        title = cleanTitle(parts[0]);
        artist = cleanArtist(parts[parts.length - 1]) || DEFAULT_ARTIST_TEXT;
    }

    return { title, artist };
}

function collectEpisodeBvids(anchorMetadata) {
    const episodeMap = new Map();

    if (Array.isArray(anchorMetadata.sections) && anchorMetadata.sections.length > 0) {
        anchorMetadata.sections.forEach(section => {
            (section.episodes || []).forEach(episode => {
                if (BV_REGEX.test(episode.bvid) && !episodeMap.has(episode.bvid)) {
                    episodeMap.set(episode.bvid, episode);
                }
            });
        });
    }

    if (episodeMap.size === 0 && BV_REGEX.test(anchorMetadata.bvid)) {
        episodeMap.set(anchorMetadata.bvid, {
            bvid: anchorMetadata.bvid,
            title: anchorMetadata.title,
            arcTitle: anchorMetadata.title,
            pagePart: anchorMetadata.pages?.[0]?.part || '',
            pageDuration: anchorMetadata.pages?.[0]?.duration || null
        });
    }

    return Array.from(episodeMap.values());
}

function buildSongItem(config, episodeMetadata, pageMeta) {
    const parsed = splitSongTitleAndArtist(pageMeta.part || '');
    return {
        title: parsed.title,
        artist: parsed.artist,
        collection: episodeMetadata.title,
        up: episodeMetadata.ownerName || '未知UP主',
        link: `${BILI_VIDEO_PREFIX}${episodeMetadata.bvid}?p=${pageMeta.page}`,
        source: `${config.resolvedFile}.js`,
        bvid: episodeMetadata.bvid,
        aid: episodeMetadata.aid,
        cid: pageMeta.cid || null,
        page: pageMeta.page || null,
        pubdate: episodeMetadata.pubdate,
        ctime: episodeMetadata.ctime,
        videoDuration: episodeMetadata.duration,
        partDuration: pageMeta.duration || null,
        videos: episodeMetadata.videos,
        videoTitle: episodeMetadata.title,
        uploader: episodeMetadata.ownerName || '',
        uploaderMid: episodeMetadata.ownerMid || null
    };
}

async function processSinger(config, cache) {
    const { alias, resolvedFile, bvids } = config;
    console.log(`\n[开始处理] ${alias} (共 ${bvids.length} 个入口BV号)...`);

    const episodeBvids = new Map();
    for (const anchorBvid of bvids) {
        console.log(`  🔍 正在解析入口 BV: ${anchorBvid}`);
        try {
            const anchorMetadata = await fetchBvMetadata(anchorBvid, cache, true);
            collectEpisodeBvids(anchorMetadata).forEach(episode => {
                if (!episodeBvids.has(episode.bvid)) {
                    episodeBvids.set(episode.bvid, episode);
                }
            });
            await sleep(300);
        } catch (error) {
            console.warn(`  ⚠️  入口 BV 解析失败 ${anchorBvid}: ${error.message}`);
        }
    }

    const allSongs = [];
    const allEpisodeBvids = Array.from(episodeBvids.keys());
    console.log(`  📚 共发现 ${allEpisodeBvids.length} 个合集 BV`);

    for (const [index, episodeBvid] of allEpisodeBvids.entries()) {
        try {
            const metadata = await fetchBvMetadata(episodeBvid, cache, false);
            const pages = Array.isArray(metadata.pages) ? metadata.pages : [];
            pages.forEach(pageMeta => {
                allSongs.push(buildSongItem(config, metadata, pageMeta));
            });
            if ((index + 1) % 25 === 0) {
                console.log(`    · 已处理 ${index + 1}/${allEpisodeBvids.length} 个合集 BV`);
            }
            await sleep(120);
        } catch (error) {
            console.warn(`  ⚠️  合集 BV 元数据失败 ${episodeBvid}: ${error.message}`);
        }
    }

    if (allSongs.length === 0) {
        throw new Error('未解析到任何有效歌曲数据');
    }

    const outputPath = path.join(DATA_DIR, `${resolvedFile}.js`);
    let outputContent = `// ${alias} - 歌单数据 (多合集汇总)\n`;
    outputContent += `// 来源: ${bvids.join(', ')}\n`;
    outputContent += `// 生成时间: ${new Date().toLocaleString()}\n\n`;
    outputContent += `window.SONG_DATA = window.SONG_DATA || [];\n\nwindow.SONG_DATA.push(\n`;
    allSongs.forEach((song, index) => {
        outputContent += `    ${JSON.stringify(song, null, 2)}${index < allSongs.length - 1 ? ',' : ''}\n`;
    });
    outputContent += `);\n`;
    fs.writeFileSync(outputPath, outputContent, { encoding: 'utf8', mode: 0o644 });
    console.log(`  ✅ 成功: 汇总 ${allSongs.length} 首歌曲 -> ${resolvedFile}.js`);
}

function generateIndexJson() {
    const indexData = {
        files: RESOLVED_SINGER_CONFIGS.map(config => `${config.resolvedFile}.js`),
        fileToAlias: RESOLVED_SINGER_CONFIGS.reduce((map, config) => {
            map[config.resolvedFile] = config.alias;
            return map;
        }, {})
    };
    fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf8');
}

async function main() {
    console.log('========================================');
    console.log('   🚀 B站直播源解析工具 (合集 API + BV 元数据缓存)');
    console.log('========================================');

    ensureDir(DATA_DIR);
    ensureDir(REPORT_DIR);

    const metadataCache = loadMetadataCache();
    let successCount = 0;

    for (const config of RESOLVED_SINGER_CONFIGS) {
        try {
            await processSinger(config, metadataCache);
            successCount += 1;
        } catch (error) {
            console.error(`  ❌ 最终失败: ${config.alias} ${error.message}`);
        }
        await sleep(800);
    }

    generateIndexJson();
    saveMetadataCache(metadataCache);

    console.log('\n========================================');
    console.log(`   🏁 任务结束: 更新 ${successCount}/${RESOLVED_SINGER_CONFIGS.length} 位歌手`);
    console.log(`   🧱 BV 元数据缓存: ${METADATA_CACHE_PATH}`);
    console.log('========================================');
}

main().catch(error => {
    console.error('❌ 全局错误:', error.message);
    process.exit(1);
});
