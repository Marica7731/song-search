const fs = require('fs');
const path = require('path');

const DEFAULT_ARTIST_TEXT = '来源处未提供标准格式歌手';
const BILI_VIDEO_PREFIX = 'https://www.bilibili.com/video/';
const BILI_VIEW_API = 'https://api.bilibili.com/x/web-interface/view?bvid=';
const BV_REGEX = /BV[0-9a-zA-Z]+/;
const CLEAN_SUFFIX_REGEX = /(\s*\(\d+\)|_(sub|copy|backup|1080p|720p|\d+))$/i;
const TRAILING_TAG_REGEX = /(?:\s*(?:\[[^\]]*\]|【[^】]*】|【[^】]*))+$/;
const LEADING_SOURCE_REGEX = /^(?:\s*【[^】]+】)+\s*/;
const LEADING_WITH_INDEX_REGEX = /^\s*with\s+.+?\s+\d+\.\s+/i;
const LEADING_INDEX_REGEX = /^(?:\s*\[\d+(?:\s*[-/]\s*\d+)+\]\.?\s*|\s*\d+\.\s+|\s*P\d+[：:]\s*)/i;
const SPECIAL_BRACKET_ARTIST_SET = new Set(['[Alexandros]', '[ALEXANDROS]']);
const ROOT_DIR = path.join(__dirname, '..');
const DEFAULT_SINGER_CONFIG_PATH = path.join(__dirname, 'singer-configs.json');
const SOURCE_PROFILE_PATH = path.join(__dirname, 'source-profiles.json');
const ENV_SINGER_CONFIG_PATH = (process.env.SINGER_CONFIG_PATH || '').trim();
const ENV_RUNTIME_SINGER_CONFIG_PATH = (process.env.SINGER_CONFIG_RUNTIME_PATH || '').trim();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const METADATA_CACHE_PATH = path.join(REPORT_DIR, 'bv-metadata-cache.json');
const UPDATE_META_PATH = path.join(REPORT_DIR, 'update-songs-meta.json');

function stringHash(value) {
    let hash = 0;
    String(value || '').split('').forEach(ch => {
        hash = ((hash << 5) - hash) + ch.charCodeAt(0);
        hash |= 0;
    });
    return Math.abs(hash);
}

function getDefaultAvatarText(alias) {
    const chars = Array.from(String(alias || '').trim());
    const picked = chars.find(ch => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9]/u.test(ch));
    return (picked || '源').toUpperCase();
}

function normalizeProfileUrl(value) {
    const text = String(value || '').trim();
    return /^https?:\/\//i.test(text) ? text : '';
}

function pickProfileOverride(overrides, keys) {
    if (!overrides || typeof overrides !== 'object') return {};
    const candidates = keys
        .map(key => String(key || ''))
        .filter(Boolean);
    for (const key of candidates) {
        if (overrides[key]) return overrides[key];
    }
    const normalized = new Set(candidates.map(key => key.trim()).filter(Boolean));
    for (const [key, value] of Object.entries(overrides)) {
        if (normalized.has(String(key || '').trim())) return value;
    }
    return {};
}

function normalizeBiliImageUrl(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (text.startsWith('//')) return `https:${text}`;
    if (/^http:\/\//i.test(text)) return text.replace(/^http:\/\//i, 'https://');
    if (/^https?:\/\//i.test(text)) return text;
    return '';
}

function buildBiliThumbUrl(value) {
    const url = normalizeBiliImageUrl(value);
    if (!url) return '';
    const width = 160;
    const height = 90;
    const suffix = `@${width}w_${height}h_1c.webp`;
    const match = url.match(/^([^?#]+)([?#].*)?$/);
    if (!match) return url;
    const path = match[1];
    const query = match[2] || '';
    if (!/\.(?:jpe?g|png|webp)(?:@[^/?#]+)?$/i.test(path)) return url;
    return path.replace(/(\.(?:jpe?g|png|webp))(?:@[^/?#]+)?$/i, `$1${suffix}`) + query;
}

function uniquePaths(paths) {
    const out = [];
    const seen = new Set();
    (Array.isArray(paths) ? paths : []).forEach(rawPath => {
        const text = String(rawPath || '').trim();
        if (!text) return;
        const resolved = path.resolve(text);
        const key = process.platform === 'win32' ? resolved.toLowerCase() : resolved;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(resolved);
    });
    return out;
}

function buildRuntimeSingerConfigCandidates() {
    const candidates = [];
    if (ENV_RUNTIME_SINGER_CONFIG_PATH) {
        candidates.push(ENV_RUNTIME_SINGER_CONFIG_PATH);
    }
    if (process.platform !== 'win32') {
        candidates.push('/var/lib/song-search/singer-configs.json');
    }
    candidates.push(path.join(ROOT_DIR, 'runtime', 'singer-configs.json'));
    return uniquePaths(candidates);
}

function getSingerConfigCandidatePaths() {
    return uniquePaths([
        ENV_SINGER_CONFIG_PATH,
        ...buildRuntimeSingerConfigCandidates(),
        DEFAULT_SINGER_CONFIG_PATH
    ]);
}

function extractBvPreserveCase(rawValue) {
    const matched = String(rawValue || '').match(BV_REGEX);
    return matched ? matched[0] : '';
}

function normalizeSingerConfigItems(items, fromLabel = '配置') {
    if (!Array.isArray(items)) {
        throw new Error(`${fromLabel}根节点必须是数组`);
    }
    return items.map((rawItem, index) => {
        if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
            throw new Error(`${fromLabel}第 ${index + 1} 项不是对象`);
        }

        const archived = isArchivedConfig(rawItem);
        const rawBvids = Array.isArray(rawItem.bvids) ? rawItem.bvids : [];
        const seen = new Set();
        const normalizedBvids = [];
        rawBvids.forEach(rawBv => {
            const bv = extractBvPreserveCase(rawBv);
            if (!bv) return;
            const dedupeKey = bv.toLowerCase();
            if (seen.has(dedupeKey)) return;
            seen.add(dedupeKey);
            normalizedBvids.push(bv);
        });
        if (!archived && normalizedBvids.length === 0) {
            throw new Error(`${fromLabel}第 ${index + 1} 项缺少有效 bvids`);
        }

        return {
            ...rawItem,
            bvids: normalizedBvids
        };
    });
}

function loadSingerConfigs() {
    const errors = [];
    const candidates = getSingerConfigCandidatePaths();
    for (const filePath of candidates) {
        if (!fs.existsSync(filePath)) continue;
        try {
            const rawText = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(rawText);
            return {
                configs: normalizeSingerConfigItems(parsed, `配置文件(${filePath})`),
                loadedFrom: filePath
            };
        } catch (error) {
            errors.push(`${filePath}: ${error.message}`);
        }
    }

    throw new Error(errors.length > 0
        ? `读取来源配置失败：${errors.join(' | ')}`
        : `未找到可用配置文件: ${DEFAULT_SINGER_CONFIG_PATH}`);
}

function loadSourceProfileOverrides() {
    if (!fs.existsSync(SOURCE_PROFILE_PATH)) return {};
    try {
        const parsed = JSON.parse(fs.readFileSync(SOURCE_PROFILE_PATH, 'utf8'));
        const profiles = parsed?.profiles && typeof parsed.profiles === 'object'
            ? parsed.profiles
            : parsed;
        return profiles && typeof profiles === 'object' && !Array.isArray(profiles) ? profiles : {};
    } catch (error) {
        console.warn(`⚠️  来源头像配置读取失败：${error.message}`);
        return {};
    }
}

function buildSourceProfile(config, overrides) {
    const alias = config.alias || config.resolvedFile || '来源';
    const raw = pickProfileOverride(overrides, [config.resolvedFile, alias]);
    const avatarText = String(raw.avatarText || '').trim() || getDefaultAvatarText(alias);
    const accentColor = String(raw.accentColor || '').trim() || `hsl(${stringHash(config.resolvedFile || alias) % 360} 55% 36%)`;
    const profile = {
        alias,
        avatarText,
        avatarUrl: normalizeProfileUrl(raw.avatarUrl),
        youtubeUrl: normalizeProfileUrl(raw.youtubeUrl || raw.youtubeChannelUrl),
        accentColor,
        statsAvgSortDeferred: raw.statsAvgSortDeferred === true
    };
    if (isArchivedConfig(config)) {
        profile.archived = true;
        const reason = getArchiveReason(config);
        if (reason) profile.archiveReason = reason;
    }
    return profile;
}

function isArchivedConfig(config) {
    return config?.archived === true || config?.skipUpdate === true || config?.frozen === true;
}

function getArchiveReason(config) {
    return String(config?.archiveReason || '').trim();
}

const loadedSingerConfig = loadSingerConfigs();
const SINGER_CONFIGS = loadedSingerConfig.configs;
const SOURCE_PROFILE_OVERRIDES = loadSourceProfileOverrides();
console.log(`📦 来源配置: ${loadedSingerConfig.loadedFrom}`);

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

function normalizeSectionTitle(value) {
    return String(value || '').trim();
}

function buildSectionTitleSet(...values) {
    const result = new Set();
    values.flat().forEach(value => {
        const title = normalizeSectionTitle(value);
        if (title) result.add(title);
    });
    return result;
}

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

function formatShanghaiDateTime(date = new Date()) {
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(date);
}

function writeUpdateMeta(successCount, options = {}) {
    const now = new Date();
    const payload = {
        completedAtMs: now.getTime(),
        completedAtIso: now.toISOString(),
        completedAtShanghai: formatShanghaiDateTime(now),
        successCount,
        totalConfigs: RESOLVED_SINGER_CONFIGS.length,
        archivedCount: Number(options.archivedCount || 0)
    };
    fs.writeFileSync(UPDATE_META_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

function ensureArchivedSourceData(config) {
    const outputPath = path.join(DATA_DIR, `${config.resolvedFile}.js`);
    if (!fs.existsSync(outputPath)) {
        throw new Error(`封存来源缺少存量数据文件: data/${config.resolvedFile}.js`);
    }
    const reason = getArchiveReason(config);
    console.log(`  📦 封存跳过: ${config.alias} -> ${config.resolvedFile}.js${reason ? ` (${reason})` : ''}`);
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
        viewCount: Number(payload.stat?.view || 0),
        cover: buildBiliThumbUrl(payload.pic),
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
    const original = String(rawArtist || '').trim();
    const originalWithoutSource = original.replace(LEADING_SOURCE_REGEX, '').trim();
    let artist = original.replace(TRAILING_TAG_REGEX, '').trim();
    if (!artist && SPECIAL_BRACKET_ARTIST_SET.has(originalWithoutSource)) {
        artist = originalWithoutSource;
    }
    artist = artist.replace(LEADING_SOURCE_REGEX, '').trim();
    artist = artist.replace(CLEAN_SUFFIX_REGEX, '').trim();
    if (!artist && SPECIAL_BRACKET_ARTIST_SET.has(originalWithoutSource)) {
        return originalWithoutSource;
    }
    return artist;
}

function splitSongTitleAndArtist(partTitle) {
    const normalized = String(partTitle || '')
        .replace(LEADING_SOURCE_REGEX, '')
        .replace(LEADING_WITH_INDEX_REGEX, '')
        .replace(LEADING_INDEX_REGEX, '')
        .replace(/\s+-\s*$/, '')
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

function resolveSongTitleAndArtist(episodeMetadata, pageMeta) {
    const parsedFromPart = splitSongTitleAndArtist(pageMeta.part || '');
    const isSinglePageEpisode = Number(episodeMetadata.videos || 0) <= 1
        && Number(pageMeta.page || 1) === 1;

    if (!isSinglePageEpisode || parsedFromPart.artist !== DEFAULT_ARTIST_TEXT) {
        return parsedFromPart;
    }

    const parsedFromVideoTitle = splitSongTitleAndArtist(episodeMetadata.title || '');
    if (parsedFromVideoTitle.title && parsedFromVideoTitle.artist !== DEFAULT_ARTIST_TEXT) {
        return parsedFromVideoTitle;
    }

    return parsedFromPart;
}

function collectEpisodeBvids(anchorMetadata, config = {}) {
    const episodeMap = new Map();
    const includeSectionTitles = buildSectionTitleSet(config.sectionTitle, config.sectionTitles || []);
    const excludeSectionTitles = buildSectionTitleSet(config.excludeSectionTitle, config.excludeSectionTitles || []);

    if (Array.isArray(anchorMetadata.sections) && anchorMetadata.sections.length > 0) {
        anchorMetadata.sections.forEach(section => {
            const sectionTitle = normalizeSectionTitle(section.title);
            if (includeSectionTitles.size > 0 && !includeSectionTitles.has(sectionTitle)) return;
            if (excludeSectionTitles.has(sectionTitle)) return;
            (section.episodes || []).forEach(episode => {
                if (BV_REGEX.test(episode.bvid) && !episodeMap.has(episode.bvid)) {
                    episodeMap.set(episode.bvid, episode);
                }
            });
        });
    }

    if (episodeMap.size === 0 && includeSectionTitles.size === 0 && BV_REGEX.test(anchorMetadata.bvid)) {
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
    const parsed = resolveSongTitleAndArtist(episodeMetadata, pageMeta);
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
        viewCount: Number(episodeMetadata.viewCount || 0),
        cover: episodeMetadata.cover || '',
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
            collectEpisodeBvids(anchorMetadata, config).forEach(episode => {
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
            const metadata = await fetchBvMetadata(episodeBvid, cache, true);
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
        }, {}),
        sourceProfiles: RESOLVED_SINGER_CONFIGS.reduce((map, config) => {
            map[config.resolvedFile] = buildSourceProfile(config, SOURCE_PROFILE_OVERRIDES);
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
    let archivedCount = 0;

    for (const config of RESOLVED_SINGER_CONFIGS) {
        const archived = isArchivedConfig(config);
        try {
            if (archived) {
                ensureArchivedSourceData(config);
                archivedCount += 1;
            } else {
                await processSinger(config, metadataCache);
            }
            successCount += 1;
        } catch (error) {
            console.error(`  ❌ 最终失败: ${config.alias} ${error.message}`);
        }
        await sleep(archived ? 100 : 800);
    }

    generateIndexJson();
    saveMetadataCache(metadataCache);
    writeUpdateMeta(successCount, { archivedCount });

    console.log('\n========================================');
    console.log(`   🏁 任务结束: 更新 ${successCount}/${RESOLVED_SINGER_CONFIGS.length} 位歌手（封存 ${archivedCount}）`);
    console.log(`   🧱 BV 元数据缓存: ${METADATA_CACHE_PATH}`);
    console.log(`   🕒 执行时间记录: ${UPDATE_META_PATH}`);
    console.log('========================================');
}

main().catch(error => {
    console.error('❌ 全局错误:', error.message);
    process.exit(1);
});
