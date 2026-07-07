const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { URL } = require('url');
const {
  normalizeString,
  normalizeSongTitleKey,
  normalizeSongIdentityKey,
  getCanonicalSongIdentityDisplay,
  isSameSong,
  areArtistsCompatible,
  matchesArtistCondition
} = require('./artist-match');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const REPORT_DIR = path.join(ROOT, 'reports');
const GROWTH_HISTORY_PATH = path.join(REPORT_DIR, 'song-growth-history.json');
const UPDATE_SONGS_META_PATH = path.join(REPORT_DIR, 'update-songs-meta.json');
const ADMIN_TOKEN_PATH = '/root/.secrets/song-search-admin-token';
const PORT = Number(process.env.PORT || 8080);
const DUP_COPY_AI_API_BASE = (process.env.DUP_COPY_AI_API_BASE || 'https://api.siliconflow.cn/v1').trim();
const DUP_COPY_AI_API_KEY = (process.env.DUP_COPY_AI_API_KEY || '').trim();
const DUP_COPY_AI_MODEL = (process.env.DUP_COPY_AI_MODEL || 'THUDM/GLM-4-9B-0414').trim();
const DUP_COPY_AI_TIMEOUT_MS = Math.max(3000, Number(process.env.DUP_COPY_AI_TIMEOUT_MS || 30000));
const BILI_VIEW_API = 'https://api.bilibili.com/x/web-interface/view?bvid=';
const BV_LIVE_FETCH_TIMEOUT_MS = Math.max(3000, Number(process.env.BV_LIVE_FETCH_TIMEOUT_MS || 8000));
const BV_LIVE_CACHE_TTL_MS = Math.max(60 * 1000, Number(process.env.BV_LIVE_CACHE_TTL_MS || 10 * 60 * 1000));
const BV_LIVE_FALLBACK_MAX_PER_REQUEST = Math.max(0, Number(process.env.BV_LIVE_FALLBACK_MAX_PER_REQUEST || 12));
const DUP_COPY_MAX_ITEMS = 30;
const SONG_GROWTH_CACHE_TTL_MS = Math.max(5000, Number(process.env.SONG_GROWTH_CACHE_TTL_MS || 60 * 1000));
const REFRESH_LOCK_PATH = '/tmp/song-search-refresh.lock';
const REFRESH_SCRIPT_PATH = '/usr/local/bin/song-search-refresh.sh';
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
const STATS_CACHE_LIMIT = 18;
const STATS_PREVIEW_SONG_LIMIT = 3;
const STATS_PREVIEW_LINK_LIMIT = 8;
const STATS_SUMMARY_LINK_LIMIT = 20;
const STATS_PREVIEW_PERFORMANCE_LIMIT = 20;
const STATS_DEFAULT_PAGE_SIZE = 30;
const STATS_SOURCE_PAGE_SIZE_LIMIT = 10000;
const DEFAULT_SINGER_CONFIG_PATH = path.join(ROOT, 'scripts', 'singer-configs.json');
const ENV_SINGER_CONFIG_PATH = (process.env.SINGER_CONFIG_PATH || '').trim();
const ENV_RUNTIME_SINGER_CONFIG_PATH = (process.env.SINGER_CONFIG_RUNTIME_PATH || '').trim();
const RUNTIME_SINGER_CONFIG_CANDIDATES = buildRuntimeSingerConfigCandidates();

let store = {
  songs: [],
  files: [],
  fileToAlias: {},
  sourceProfiles: {},
  sourceStats: {},
  totalUnique: 0,
  titleEntries: [],
  titleMap: new Map(),
  titleSourceMap: new Map(),
  titleArtistMap: new Map(),
  artistSongMap: new Map(),
  bvMap: new Map(),
  uniqueSongSourceCount: new WeakMap(),
  uniqueSongOccurrenceCount: new WeakMap(),
  uploaderSourceMap: new Map(),
  sourceSongMap: new Map(),
  missingArtistSongs: [],
  missingArtistUnique: 0
};

const statsAggregateCache = new Map();
const bvLiveFallbackCache = new Map();
let storeVersion = 0;
let songGrowthCache = {
  key: '',
  expiresAtMs: 0,
  payload: null
};
let singerConfigBvSourceCache = {
  cacheKey: '',
  map: new Map()
};

const refreshState = {
  running: false,
  lastStartedAtMs: 0,
  lastFinishedAtMs: 0,
  lastExitCode: null,
  lastMessage: ''
};

const ROUTE_ALIASES = {
  '/': 'index.html',
  '/stats': 'stats.html',
  '/bv': 'bv-dup-check.html',
  '/dup': 'title-artist-dup-check.html',
  '/check': 'title-artist-check.html',
  '/vocaloid': 'vocaloid.html',
  '/growth': 'song-growth.html',
  '/m': 'index.html',
  '/h5': 'index.html',
  '/convert': 'converter.html',
  '/legacy': 'bili-check.html',
  '/admin-config': 'admin-singer-config.html'
};

function isValidArtist(artist) {
  if (!artist || !artist.trim()) return false;
  return !artist.includes('来源处未提供标准格式歌手');
}

function extractBV(value) {
  if (!value) return '';
  const matched = String(value).match(/BV[a-zA-Z0-9]+/);
  return matched ? matched[0].toUpperCase() : '';
}

function extractBvPreserveCase(value) {
  if (!value) return '';
  const matched = String(value).match(/BV[a-zA-Z0-9]+/);
  return matched ? matched[0] : '';
}

function normalizeUploaderMid(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  return raw;
}

function getUniqueSongCount(data) {
  return buildUniqueSongClusters(data).length;
}

function buildUniqueSongClusters(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const titleGroup = {};
  data.forEach(song => {
    const titleKey = normalizeSongIdentityKey(song);
    if (!titleGroup[titleKey]) titleGroup[titleKey] = [];
    titleGroup[titleKey].push(song);
  });

  const clusters = [];
  Object.values(titleGroup).forEach(group => {
    const titleClusters = [];
    group.forEach(currentSong => {
      const existing = titleClusters.find(cluster => isSameSong(currentSong, cluster.representative, isValidArtist));
      if (existing) {
        existing.songs.push(currentSong);
        return;
      }
      titleClusters.push({
        representative: currentSong,
        songs: [currentSong]
      });
    });
    clusters.push(...titleClusters);
  });
  return clusters;
}

function buildUniqueSongSourceCountMap(songs) {
  const map = new WeakMap();
  buildUniqueSongClusters(songs).forEach(cluster => {
    const sourceSet = new Set(cluster.songs.map(song => song.source || '').filter(Boolean));
    const count = sourceSet.size || 1;
    cluster.songs.forEach(song => map.set(song, count));
  });
  return map;
}

function buildUniqueSongOccurrenceCountMap(songs) {
  const map = new WeakMap();
  buildUniqueSongClusters(songs).forEach(cluster => {
    const count = cluster.songs.length || 1;
    cluster.songs.forEach(song => map.set(song, count));
  });
  return map;
}

function getSongUniqueSourceCount(song) {
  return (song && store.uniqueSongSourceCount && store.uniqueSongSourceCount.get(song)) || 0;
}

function getSongUniqueOccurrenceCount(song) {
  return (song && store.uniqueSongOccurrenceCount && store.uniqueSongOccurrenceCount.get(song)) || 0;
}

function isSoloUniqueSong(song) {
  return getSongUniqueSourceCount(song) === 1 && getSongUniqueOccurrenceCount(song) === 1;
}

function countSoloUniqueTracks(data) {
  return buildUniqueSongClusters(data)
    .filter(cluster => cluster.songs.some(song => isSoloUniqueSong(song)))
    .length;
}

function buildSourceStats(songs, files, fileToAlias) {
  const stats = {};
  (files || []).forEach(fileName => {
    const sourceSongs = songs.filter(song => song.source === fileName);
    const key = fileName.replace('.js', '');
    stats[fileName] = {
      file: fileName,
      alias: fileToAlias[key] || fileName,
      totalSongs: sourceSongs.length,
      totalUnique: getUniqueSongCount(sourceSongs)
    };
  });
  return stats;
}

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
  const imagePath = match[1];
  const query = match[2] || '';
  if (!/\.(?:jpe?g|png|webp)(?:@[^/?#]+)?$/i.test(imagePath)) return url;
  return imagePath.replace(/(\.(?:jpe?g|png|webp))(?:@[^/?#]+)?$/i, `$1${suffix}`) + query;
}

function buildFallbackSourceProfile(sourceFile) {
  const key = String(sourceFile || '').replace(/\.js$/, '');
  const alias = store.fileToAlias[key] || key || '来源';
  return {
    alias,
    avatarText: getDefaultAvatarText(alias),
    avatarUrl: '',
    youtubeUrl: '',
    accentColor: `hsl(${stringHash(key || alias) % 360} 55% 36%)`,
    statsAvgSortDeferred: false
  };
}

function normalizeSourceArchiveReason(raw) {
  return String(raw?.archiveReason || '').trim();
}

function normalizeSourceProfiles(rawProfiles, files, fileToAlias) {
  const profiles = {};
  (files || []).forEach(fileName => {
    const key = String(fileName || '').replace(/\.js$/, '');
    const alias = fileToAlias?.[key] || key || '来源';
    const raw = rawProfiles?.[key] || rawProfiles?.[fileName] || {};
    const profile = {
      alias,
      avatarText: String(raw.avatarText || '').trim() || getDefaultAvatarText(alias),
      avatarUrl: normalizeProfileUrl(raw.avatarUrl),
      youtubeUrl: normalizeProfileUrl(raw.youtubeUrl || raw.youtubeChannelUrl),
      accentColor: String(raw.accentColor || '').trim() || `hsl(${stringHash(key || alias) % 360} 55% 36%)`,
      statsAvgSortDeferred: raw.statsAvgSortDeferred === true
    };
    if (raw.archived === true) {
      profile.archived = true;
      const reason = normalizeSourceArchiveReason(raw);
      if (reason) profile.archiveReason = reason;
    }
    profiles[key] = profile;
  });
  return profiles;
}

function getSourceProfile(sourceFile) {
  const key = String(sourceFile || '').replace(/\.js$/, '');
  return store.sourceProfiles[key] || buildFallbackSourceProfile(sourceFile);
}

function getSourceAlias(sourceFile) {
  const key = String(sourceFile || '').replace('.js', '');
  return store.fileToAlias[key] || sourceFile || '未知来源';
}

function isDupCopyAiAvailable() {
  return !!DUP_COPY_AI_API_KEY;
}

function toDisplaySourceName(rawValue) {
  return String(rawValue || '')
    .replace(/^#/, '')
    .replace(/[【】]/g, '')
    .trim();
}

function getConcreteSourceName(entry) {
  const song = entry?.song || entry || {};
  const sourceAlias = getSourceAlias(song.source);
  if (sourceAlias !== '非常驻妹妹') {
    return sourceAlias || '未知来源';
  }

  const collection = String(song.collection || '');
  const bracketValues = Array.from(collection.matchAll(/【([^【】]+)】/g))
    .map(match => toDisplaySourceName(match[1]))
    .filter(Boolean)
    .filter(value => !/^cmykproject$/i.test(value) && !/^#?cmykproject$/i.test(value));
  if (bracketValues.length > 0) {
    return bracketValues[bracketValues.length - 1];
  }

  const videoTitle = String(song.videoTitle || '');
  const videoBracketValues = Array.from(videoTitle.matchAll(/【([^【】]+)】/g))
    .map(match => toDisplaySourceName(match[1]))
    .filter(Boolean);
  if (videoBracketValues.length > 0) {
    return videoBracketValues[videoBracketValues.length - 1];
  }

  return sourceAlias || '未知来源';
}

function normalizeArtistVariantForCopy(artist) {
  const text = String(artist || '').trim();
  if (!text) return '';
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s*feat\.\s*/gi, ' feat.')
    .trim();
  return cleaned;
}

function pickNormalizedArtistName(variants) {
  const cleaned = (Array.isArray(variants) ? variants : [])
    .map(normalizeArtistVariantForCopy)
    .filter(Boolean);
  if (cleaned.length === 0) return '';

  const exactCount = new Map();
  cleaned.forEach(name => {
    exactCount.set(name, (exactCount.get(name) || 0) + 1);
  });
  const exactWinner = Array.from(exactCount.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].length - b[0].length;
    })[0];

  const compatibleGroups = [];
  cleaned.forEach(name => {
    const group = compatibleGroups.find(item => areArtistsCompatible(item.representative, name));
    if (group) {
      group.items.push(name);
      return;
    }
    compatibleGroups.push({
      representative: name,
      items: [name]
    });
  });

  compatibleGroups.sort((a, b) => {
    if (b.items.length !== a.items.length) return b.items.length - a.items.length;
    return a.representative.length - b.representative.length;
  });
  const compatibleWinner = compatibleGroups[0];
  if (!compatibleWinner) {
    return exactWinner ? exactWinner[0] : cleaned[0];
  }

  const preferred = compatibleWinner.items
    .slice()
    .sort((a, b) => {
      const aHasFeat = /feat\./i.test(a);
      const bHasFeat = /feat\./i.test(b);
      if (aHasFeat !== bHasFeat) return aHasFeat ? -1 : 1;
      const aAscii = /^[\x00-\x7F\s./()&+\-]+$/.test(a);
      const bAscii = /^[\x00-\x7F\s./()&+\-]+$/.test(b);
      if (aAscii !== bAscii) return aAscii ? -1 : 1;
      return a.length - b.length;
    })[0];

  return preferred || compatibleWinner.representative || (exactWinner ? exactWinner[0] : cleaned[0]);
}

function dedupeLinksForCopy(links, limit = 2) {
  const seen = new Set();
  const out = [];
  (Array.isArray(links) ? links : []).forEach(link => {
    const value = String(link || '').trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push(value);
  });
  return out.slice(0, limit);
}

function buildLocalCopyText(entry) {
  const sourceDisplay = getConcreteSourceName(entry);
  const song = entry?.song || {};
  const links = dedupeLinksForCopy(entry?.links || [song.link]);
  const parts = [
    `来源：${sourceDisplay || '未知来源'}`,
    `歌名：${song.title || '未知歌曲'}`,
    `歌手：${entry?.artistNormalized || song.artist || '未知歌手'}`
  ];
  if (links.length > 0) {
    parts.push(`链接：${links.join(' ')}`);
  }
  return parts.join(' | ');
}

function getScopedSourceLabel(source) {
  return !source || source === 'all' ? '全部来源' : getSourceAlias(source);
}

function splitWithQuotes(str) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i += 1) {
    const char = str[i];
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        result.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function parseSearchQuery(query) {
  if (!query || !query.trim()) return null;
  const q = query.trim();
  const exactMatch = q.match(/^"([^"]+)"$/);
  if (exactMatch) return { type: 'exact', value: normalizeString(exactMatch[1]) };

  const phraseMatch = q.match(/^'([^']+)'$/);
  if (phraseMatch) return { type: 'phrase', value: normalizeString(phraseMatch[1]) };

  if (q.toUpperCase().includes(' OR ')) {
    return {
      type: 'or',
      values: q.split(/\s+OR\s+/i).map(part => parseSearchQuery(part.trim())).filter(Boolean)
    };
  }

  const processedQuery = q.replace(/\s*-\s*/g, ' ');
  const andParts = processedQuery.toUpperCase().includes(' AND ')
    ? processedQuery.split(/\s+AND\s+/i)
    : splitWithQuotes(processedQuery);

  if (andParts.length > 1) {
    return {
      type: 'and',
      values: andParts.map(part => parseSearchQuery(part.trim())).filter(Boolean)
    };
  }

  return { type: 'fuzzy', value: normalizeString(processedQuery) };
}

function matchesSingleCondition(text, condition) {
  if (!text) return false;
  const normText = normalizeString(text);
  switch (condition.type) {
    case 'exact':
      return normText === condition.value;
    case 'phrase':
    case 'fuzzy':
      return normText.includes(condition.value);
    default:
      return false;
  }
}

function matchesFieldCondition(fieldName, text, condition) {
  if (fieldName === 'artist' || fieldName === 'originalArtist') {
    return matchesSingleCondition(text, condition);
  }
  return matchesSingleCondition(text, condition);
}

function searchItem(item, condition, fields) {
  const enabledFields = [];
  if (fields.title) enabledFields.push({ field: 'title', text: item.title || '' });
  if (fields.artist) enabledFields.push({ field: 'artist', text: item.artist || '' });
  if (fields.collection) enabledFields.push({ field: 'collection', text: item.collection || '' });
  if (fields.source) {
    const sourceBase = String(item.source || '').replace('.js', '');
    const sourceAlias = store.fileToAlias[sourceBase] || item.source || '未知';
    enabledFields.push({ field: 'source', text: sourceAlias });
  }
  if (fields.bvid) {
    enabledFields.push({ field: 'bvid', text: extractBV(item.bvid || item.link || '') });
  }
  if (fields.pubdate) {
    const pubdateMs = Number(item.pubdate || 0) * 1000;
    const pubdateText = pubdateMs
      ? `${formatShanghaiDate(pubdateMs)} ${formatShanghaiDateTime(pubdateMs)}`
      : '';
    enabledFields.push({ field: 'pubdate', text: pubdateText });
  }
  if (enabledFields.length === 0) return false;

  function checkCondition(cond) {
    switch (cond.type) {
      case 'exact':
      case 'phrase':
      case 'fuzzy':
        return enabledFields.some(entry => matchesFieldCondition(entry.field, entry.text, cond));
      case 'and':
        return cond.values.every(checkCondition);
      case 'or':
        return cond.values.some(checkCondition);
      default:
        return false;
    }
  }

  return checkCondition(condition);
}

function sortSongs(data, sortMode) {
  const items = data.slice();
  if (sortMode === 'pubdate_asc') {
    items.sort((a, b) => {
      const av = Number(a.pubdate || 0);
      const bv = Number(b.pubdate || 0);
      if (av !== bv) return av - bv;
      return 0;
    });
    return items;
  }
  if (sortMode === 'pubdate_desc') {
    items.sort((a, b) => {
      const av = Number(a.pubdate || 0);
      const bv = Number(b.pubdate || 0);
      if (av !== bv) return bv - av;
      return 0;
    });
    return items;
  }
  return items;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatShanghaiDate(ts) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(ts));
}

function formatShanghaiDateTime(ts) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(ts));
}

function clearStatsAggregateCache() {
  statsAggregateCache.clear();
}

function clearDerivedPayloadCaches() {
  clearStatsAggregateCache();
  songGrowthCache = {
    key: '',
    expiresAtMs: 0,
    payload: null
  };
}

function getUpdateSongsMeta() {
  if (fs.existsSync(UPDATE_SONGS_META_PATH)) {
    try {
      const meta = readJson(UPDATE_SONGS_META_PATH);
      const completedAtMs = Number(meta.completedAtMs || 0);
      return {
        source: 'update-songs-meta',
        completedAtMs: completedAtMs || null,
        completedAtShanghai: meta.completedAtShanghai || (completedAtMs ? formatShanghaiDateTime(completedAtMs) : null),
        successCount: Number(meta.successCount || 0),
        totalConfigs: Number(meta.totalConfigs || 0)
      };
    } catch {
      // fall through to mtime fallback
    }
  }

  if (fs.existsSync(INDEX_PATH)) {
    const stat = fs.statSync(INDEX_PATH);
    return {
      source: 'index-mtime-fallback',
      completedAtMs: stat.mtimeMs,
      completedAtShanghai: formatShanghaiDateTime(stat.mtimeMs),
      successCount: null,
      totalConfigs: null
    };
  }

  return {
    source: 'unavailable',
    completedAtMs: null,
    completedAtShanghai: null,
    successCount: null,
    totalConfigs: null
  };
}

function buildDailyGrowthRows(history) {
  const sorted = [...history]
    .filter(item => item && Number.isFinite(Number(item.ts)) && Number.isFinite(Number(item.total)))
    .map(item => ({ ts: Number(item.ts), total: Number(item.total) }))
    .sort((a, b) => a.ts - b.ts);

  const dailyMap = new Map();
  sorted.forEach(item => {
    dailyMap.set(formatShanghaiDate(item.ts), item);
  });

  const rows = Array.from(dailyMap.entries()).map(([date, item]) => ({
    date,
    total: item.total,
    ts: item.ts
  }));

  rows.forEach((row, index) => {
    row.delta = index === 0 ? 0 : row.total - rows[index - 1].total;
  });

  return rows;
}

function buildPublishGrowthRows(songs) {
  const byDate = new Map();
  songs.forEach(song => {
    const pubdate = Number(song.pubdate || 0);
    if (!pubdate) return;
    const date = formatShanghaiDate(pubdate * 1000);
    if (!byDate.has(date)) {
      byDate.set(date, { date, delta: 0, ts: pubdate * 1000 });
    }
    const row = byDate.get(date);
    row.delta += 1;
    if (pubdate * 1000 > row.ts) row.ts = pubdate * 1000;
  });

  let total = 0;
  return Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(row => {
      total += row.delta;
      return {
        date: row.date,
        total,
        ts: row.ts,
        delta: row.delta
      };
    });
}

function getGrowthSongDate(song) {
  const pubdate = Number(song?.pubdate || 0);
  return pubdate ? formatShanghaiDate(pubdate * 1000) : '';
}

function summarizeGrowthDetailSong(song, extra = {}) {
  return {
    title: song?.title || '未知歌曲',
    artist: song?.artist || song?.originalArtist || '',
    originalArtist: song?.originalArtist || '',
    collection: song?.collection || '',
    link: song?.link || '',
    bvid: getExportBvid(song),
    source: song?.source || '',
    sourceAlias: getExportSourceName(song),
    cover: song?.cover || '',
    pubdate: Number(song?.pubdate || 0),
    viewCount: Number(song?.viewCount || 0),
    ...extra
  };
}

function buildGrowthUniqueDetailSongs(songs, targetDate) {
  const items = [];
  const titleGroup = new Map();
  (Array.isArray(songs) ? songs : []).forEach(song => {
    const titleKey = normalizeSongIdentityKey(song);
    if (!titleGroup.has(titleKey)) titleGroup.set(titleKey, []);
    titleGroup.get(titleKey).push(song);
  });

  titleGroup.forEach(group => {
    const clusters = [];
    group.forEach(currentSong => {
      const existing = clusters.find(cluster => isSameSong(currentSong, cluster.representative, isValidArtist));
      if (existing) {
        existing.songs.push(currentSong);
        return;
      }
      clusters.push({ representative: currentSong, songs: [currentSong] });
    });

    clusters.forEach(cluster => {
      const sorted = cluster.songs
        .filter(song => Number(song?.pubdate || 0) > 0)
        .sort((a, b) => Number(a.pubdate || 0) - Number(b.pubdate || 0));
      const first = sorted[0] || cluster.representative;
      if (!first || getGrowthSongDate(first) !== targetDate) return;
      const sourceSet = new Set(cluster.songs.map(song => getExportSourceName(song)).filter(Boolean));
      const coverSong = sorted.find(song => song.cover) || first;
      items.push(summarizeGrowthDetailSong(coverSong, {
        title: first.title || coverSong.title || '未知歌曲',
        artist: first.artist || first.originalArtist || coverSong.artist || coverSong.originalArtist || '',
        originalArtist: first.originalArtist || coverSong.originalArtist || '',
        collection: first.collection || coverSong.collection || '',
        link: first.link || coverSong.link || '',
        bvid: getExportBvid(first) || getExportBvid(coverSong),
        pubdate: Number(first.pubdate || coverSong.pubdate || 0),
        performanceCount: cluster.songs.length,
        sourceCount: sourceSet.size || 1,
        sources: Array.from(sourceSet).slice(0, 6)
      }));
    });
  });

  return items.sort((a, b) => {
    if (b.pubdate !== a.pubdate) return b.pubdate - a.pubdate;
    return String(a.title || '').localeCompare(String(b.title || ''), 'zh-Hans');
  });
}

function buildGrowthDetailPayload(reqUrl) {
  const source = reqUrl.searchParams.get('source') || 'all';
  const date = String(reqUrl.searchParams.get('date') || '').trim();
  const type = reqUrl.searchParams.get('type') === 'unique' ? 'unique' : 'songs';
  const limit = Math.max(1, Math.min(120, Number(reqUrl.searchParams.get('limit') || '60')));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const error = new Error('Invalid growth detail date');
    error.statusCode = 400;
    throw error;
  }

  const sourceSongs = source === 'all'
    ? store.songs
    : (store.sourceSongMap.get(source) || []);
  const allItems = type === 'unique'
    ? buildGrowthUniqueDetailSongs(sourceSongs, date)
    : sourceSongs
      .filter(song => getGrowthSongDate(song) === date)
      .sort((a, b) => Number(b?.pubdate || 0) - Number(a?.pubdate || 0))
      .map(song => summarizeGrowthDetailSong(song));
  const items = allItems.slice(0, limit);
  return {
    source,
    sourceAlias: source === 'all' ? '全部来源' : getSourceAlias(source),
    date,
    type,
    total: allItems.length,
    limit,
    hasMore: allItems.length > items.length,
    items
  };
}

function buildPublishUniqueRows(songs) {
  const byDate = new Map();
  const titleGroup = new Map();
  (Array.isArray(songs) ? songs : []).forEach(song => {
    const titleKey = normalizeSongIdentityKey(song);
    if (!titleGroup.has(titleKey)) titleGroup.set(titleKey, []);
    titleGroup.get(titleKey).push(song);
  });

  titleGroup.forEach(group => {
    const clusters = [];
    group.forEach(currentSong => {
      const existing = clusters.find(cluster => isSameSong(currentSong, cluster.representative, isValidArtist));
      if (existing) {
        existing.songs.push(currentSong);
        return;
      }
      clusters.push({ representative: currentSong, songs: [currentSong] });
    });

    clusters.forEach(cluster => {
      const pubdate = cluster.songs
        .map(song => Number(song?.pubdate || 0))
        .filter(value => value > 0)
        .sort((a, b) => a - b)[0];
      if (!pubdate) return;

      const ts = pubdate * 1000;
      const date = formatShanghaiDate(ts);
      if (!byDate.has(date)) {
        byDate.set(date, { date, delta: 0, ts });
      }
      const row = byDate.get(date);
      row.delta += 1;
      if (ts > row.ts) row.ts = ts;
    });
  });

  let total = 0;
  return Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(row => {
      total += row.delta;
      return {
        date: row.date,
        total,
        ts: row.ts,
        delta: row.delta
      };
    });
}

function buildPublishViewRows(songs) {
  const byVideo = new Map();
  songs.forEach(song => {
    const bvid = extractBV(song.bvid || song.link || '');
    const pubdate = Number(song.pubdate || 0);
    const viewCount = Number(song.viewCount || 0);
    if (!bvid || !pubdate || !Number.isFinite(viewCount)) return;

    if (!byVideo.has(bvid)) {
      byVideo.set(bvid, {
        bvid,
        date: formatShanghaiDate(pubdate * 1000),
        ts: pubdate * 1000,
        delta: Math.max(0, viewCount)
      });
      return;
    }

    const existing = byVideo.get(bvid);
    if (viewCount > existing.delta) {
      existing.delta = Math.max(0, viewCount);
    }
    if (pubdate * 1000 > existing.ts) {
      existing.ts = pubdate * 1000;
      existing.date = formatShanghaiDate(existing.ts);
    }
  });

  const byDate = new Map();
  byVideo.forEach(video => {
    if (!byDate.has(video.date)) {
      byDate.set(video.date, {
        date: video.date,
        delta: 0,
        ts: video.ts
      });
    }
    const row = byDate.get(video.date);
    row.delta += video.delta;
    if (video.ts > row.ts) row.ts = video.ts;
  });

  let total = 0;
  return Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(row => {
      total += row.delta;
      return {
        date: row.date,
        total,
        ts: row.ts,
        delta: row.delta
      };
    });
}

function buildCombinedGrowthRows(songRows, viewRows, uniqueRows) {
  const dateMap = new Map();

  (Array.isArray(songRows) ? songRows : []).forEach(row => {
    const date = String(row?.date || '');
    if (!date) return;
    if (!dateMap.has(date)) {
      dateMap.set(date, { date, ts: 0, songDelta: 0, viewDelta: 0, uniqueSongDelta: 0 });
    }
    const entry = dateMap.get(date);
    entry.songDelta += Number(row?.delta || 0);
    entry.ts = Math.max(entry.ts, Number(row?.ts || 0));
  });

  (Array.isArray(viewRows) ? viewRows : []).forEach(row => {
    const date = String(row?.date || '');
    if (!date) return;
    if (!dateMap.has(date)) {
      dateMap.set(date, { date, ts: 0, songDelta: 0, viewDelta: 0, uniqueSongDelta: 0 });
    }
    const entry = dateMap.get(date);
    entry.viewDelta += Number(row?.delta || 0);
    entry.ts = Math.max(entry.ts, Number(row?.ts || 0));
  });

  (Array.isArray(uniqueRows) ? uniqueRows : []).forEach(row => {
    const date = String(row?.date || '');
    if (!date) return;
    if (!dateMap.has(date)) {
      dateMap.set(date, { date, ts: 0, songDelta: 0, viewDelta: 0, uniqueSongDelta: 0 });
    }
    const entry = dateMap.get(date);
    entry.uniqueSongDelta += Number(row?.delta || 0);
    entry.ts = Math.max(entry.ts, Number(row?.ts || 0));
  });

  let songTotal = 0;
  let viewTotal = 0;
  let uniqueSongTotal = 0;
  return Array.from(dateMap.values())
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map(row => {
      songTotal += Number(row.songDelta || 0);
      viewTotal += Number(row.viewDelta || 0);
      uniqueSongTotal += Number(row.uniqueSongDelta || 0);
      return {
        date: row.date,
        ts: row.ts || 0,
        songDelta: Number(row.songDelta || 0),
        songTotal,
        uniqueSongDelta: Number(row.uniqueSongDelta || 0),
        uniqueSongTotal,
        viewDelta: Number(row.viewDelta || 0),
        viewTotal
      };
    });
}

function buildSourceUniqueGrowthRows() {
  return store.files
    .map(file => {
      const rows = buildPublishUniqueRows(store.sourceSongMap.get(file) || []);
      const latest = rows[rows.length - 1] || null;
      return {
        file,
        alias: getSourceAlias(file),
        profile: getSourceProfile(file),
        totalSongs: Number(store.sourceStats[file]?.totalSongs || 0),
        totalUnique: Number(store.sourceStats[file]?.totalUnique || latest?.total || 0),
        rows
      };
    })
    .sort((a, b) => {
      if (b.totalSongs !== a.totalSongs) return b.totalSongs - a.totalSongs;
      return String(a.alias).localeCompare(String(b.alias), 'zh-Hans');
    });
}

function buildSourceGrowthRows() {
  return store.files
    .map(file => {
      const sourceSongs = store.sourceSongMap.get(file) || [];
      const publishRows = buildPublishGrowthRows(sourceSongs);
      const viewRows = buildPublishViewRows(sourceSongs);
      const uniqueRows = buildPublishUniqueRows(sourceSongs);
      const rows = buildCombinedGrowthRows(publishRows, viewRows, uniqueRows)
        .filter(row => Number(row.songDelta || 0) || Number(row.viewDelta || 0) || Number(row.uniqueSongDelta || 0));
      const latest = rows[rows.length - 1] || null;
      return {
        file,
        alias: getSourceAlias(file),
        profile: getSourceProfile(file),
        totalSongs: Number(store.sourceStats[file]?.totalSongs || latest?.songTotal || 0),
        totalUnique: Number(store.sourceStats[file]?.totalUnique || latest?.uniqueSongTotal || 0),
        rows
      };
    })
    .sort((a, b) => {
      if (b.totalSongs !== a.totalSongs) return b.totalSongs - a.totalSongs;
      return String(a.alias).localeCompare(String(b.alias), 'zh-Hans');
    });
}

function buildGrowthAnomalies(combinedRows) {
  const rows = (Array.isArray(combinedRows) ? combinedRows : []).slice(-45);
  const positiveDeltas = rows
    .map(row => Number(row.songDelta || 0))
    .filter(value => value > 0);
  const avgDelta = positiveDeltas.length
    ? positiveDeltas.reduce((sum, value) => sum + value, 0) / positiveDeltas.length
    : 0;

  return rows
    .filter(row => {
      const delta = Number(row.songDelta || 0);
      if (delta < 0) return true;
      if (avgDelta > 0 && delta >= Math.max(avgDelta * 2.5, avgDelta + 50)) return true;
      return false;
    })
    .slice(-8)
    .map(row => ({
      date: row.date,
      songDelta: Number(row.songDelta || 0),
      viewDelta: Number(row.viewDelta || 0),
      reason: Number(row.songDelta || 0) < 0 ? '曲目数回退' : '新增高于近期均值'
    }));
}

function loadSongStore() {
  const indexData = readJson(INDEX_PATH);
  const songs = [];

  (indexData.files || []).forEach(fileName => {
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) return;
    const jsContent = fs.readFileSync(filePath, 'utf8');
    const fakeWindow = { SONG_DATA: [] };
    try {
      const run = new Function('window', jsContent);
      run(fakeWindow);
      fakeWindow.SONG_DATA.forEach(song => {
        songs.push({
          ...song,
          source: fileName
        });
      });
    } catch (error) {
      console.warn(`Failed to load ${fileName}: ${error.message}`);
    }
  });

  const titleMap = new Map();
  const titleSourceMap = new Map();
  const titleArtistMap = new Map();
  const artistSongMap = new Map();
  const bvMap = new Map();
  const sourceSongMap = new Map();
  const uploaderSourceCountMap = new Map();

  songs.forEach((song, index) => {
    const sourceFile = String(song.source || '');
    if (!sourceSongMap.has(sourceFile)) {
      sourceSongMap.set(sourceFile, []);
    }
    sourceSongMap.get(sourceFile).push(song);

    const uploaderMid = normalizeUploaderMid(song.uploaderMid);
    if (uploaderMid && sourceFile) {
      if (!uploaderSourceCountMap.has(uploaderMid)) {
        uploaderSourceCountMap.set(uploaderMid, new Map());
      }
      const sourceCountMap = uploaderSourceCountMap.get(uploaderMid);
      sourceCountMap.set(sourceFile, (sourceCountMap.get(sourceFile) || 0) + 1);
    }

    const title = String(song.title || '').trim();
    const titleKey = normalizeSongTitleKey(title);
    if (titleKey) {
      if (!titleMap.has(titleKey)) {
        titleMap.set(titleKey, {
          title,
          songs: [],
          firstSeen: index
        });
      }
      titleMap.get(titleKey).songs.push(song);

      if (!titleSourceMap.has(titleKey)) {
        titleSourceMap.set(titleKey, new Set());
      }
      if (sourceFile) {
        titleSourceMap.get(titleKey).add(sourceFile);
      }
    }

    const artist = String(song.artist || '').trim();
    const artistKey = normalizeString(artist);
    if (artistKey) {
      if (!artistSongMap.has(artistKey)) {
        artistSongMap.set(artistKey, []);
      }
      artistSongMap.get(artistKey).push(song);
    }

    if (titleKey && artistKey) {
      const titleArtistKey = `${titleKey}|${artistKey}`;
      if (!titleArtistMap.has(titleArtistKey)) {
        titleArtistMap.set(titleArtistKey, []);
      }
      titleArtistMap.get(titleArtistKey).push(song);
    }

    const bv = extractBV(song.link);
    if (bv) {
      if (!bvMap.has(bv)) {
        bvMap.set(bv, []);
      }
      bvMap.get(bv).push(song);
    }
  });

  const titleEntries = Array.from(titleMap.values())
    .sort((a, b) => a.firstSeen - b.firstSeen)
    .map(entry => ({
      title: entry.title,
      firstSeen: entry.firstSeen
    }));
  const uploaderSourceMap = new Map();
  uploaderSourceCountMap.forEach((sourceCountMap, uploaderMid) => {
    let bestSource = '';
    let bestCount = -1;
    sourceCountMap.forEach((count, sourceFile) => {
      if (count > bestCount) {
        bestCount = count;
        bestSource = sourceFile;
      }
    });
    if (bestSource) {
      uploaderSourceMap.set(uploaderMid, bestSource);
    }
  });

  const sourceProfiles = normalizeSourceProfiles(indexData.sourceProfiles || {}, indexData.files || [], indexData.fileToAlias || {});

  store = {
    songs,
    files: indexData.files || [],
    fileToAlias: indexData.fileToAlias || {},
    sourceProfiles,
    sourceStats: buildSourceStats(songs, indexData.files || [], indexData.fileToAlias || {}),
    totalUnique: getUniqueSongCount(songs),
    titleEntries,
    titleMap,
    titleSourceMap,
    titleArtistMap,
    artistSongMap,
    bvMap,
    uniqueSongSourceCount: buildUniqueSongSourceCountMap(songs),
    uniqueSongOccurrenceCount: buildUniqueSongOccurrenceCountMap(songs),
    uploaderSourceMap,
    sourceSongMap,
    missingArtistSongs: songs.filter(song => !isValidArtist(song.artist)),
    missingArtistUnique: 0
  };
  store.missingArtistUnique = getUniqueSongCount(store.missingArtistSongs);
  storeVersion += 1;
  clearDerivedPayloadCaches();
}

function getSourceScopedSongs(source) {
  if (source === 'missing-artist') {
    return store.missingArtistSongs;
  }
  if (source && source !== 'all') {
    return store.sourceSongMap.get(source) || [];
  }
  return store.songs;
}

function getSourceSummary(source) {
  if (source === 'missing-artist') {
    return {
      count: store.missingArtistSongs.length,
      unique: store.missingArtistUnique
    };
  }
  if (!source || source === 'all') {
    return {
      count: store.songs.length,
      unique: store.totalUnique
    };
  }
  const stat = store.sourceStats[source];
  if (stat) {
    return {
      count: Number(stat.totalSongs || 0),
      unique: Number(stat.totalUnique || 0)
    };
  }
  const scoped = getSourceScopedSongs(source);
  return {
    count: scoped.length,
    unique: getUniqueSongCount(scoped)
  };
}

function filterCandidatesBySource(items, source) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!source || source === 'all') return items.slice();
  return items.filter(item => item.source === source);
}

function buildBvNotFoundResult(raw, reason = '') {
  return {
    isNotFound: true,
    originalInput: raw,
    dupCount: 0,
    isDup: false,
    dupList: [],
    song: null,
    reason
  };
}

function findSourceFileByConfigName(configFileName) {
  const raw = String(configFileName || '');
  const trimmed = raw.trim();
  const candidates = [];
  const pushCandidate = candidate => {
    if (!candidate) return;
    if (!candidates.includes(candidate)) candidates.push(candidate);
  };

  [raw, trimmed].forEach(base => {
    if (!base) return;
    pushCandidate(base);
    pushCandidate(base.endsWith('.js') ? base : `${base}.js`);
  });

  for (const candidate of candidates) {
    if (store.files.includes(candidate)) return candidate;
  }

  for (const candidate of candidates) {
    const target = candidate.toLowerCase();
    const matched = store.files.find(file => String(file || '').toLowerCase() === target);
    if (matched) return matched;
  }

  return '';
}

function getSingerConfigBvSourceMap() {
  try {
    const meta = readSingerConfigWithMeta();
    const stats = fs.existsSync(meta.loadedFrom) ? fs.statSync(meta.loadedFrom) : null;
    const cacheKey = `${meta.loadedFrom}|${stats?.mtimeMs || 0}|${meta.configs.length}|${store.files.join('|')}`;
    if (singerConfigBvSourceCache.cacheKey === cacheKey) {
      return singerConfigBvSourceCache.map;
    }

    const mapped = new Map();
    meta.configs.forEach(config => {
      const sourceFile = findSourceFileByConfigName(config.file);
      if (!sourceFile) return;
      const bvids = Array.isArray(config.bvids) ? config.bvids : [];
      bvids.forEach(rawBv => {
        const normalizedBv = extractBV(rawBv);
        if (!normalizedBv) return;
        if (!mapped.has(normalizedBv)) {
          mapped.set(normalizedBv, sourceFile);
        }
      });
    });

    singerConfigBvSourceCache = {
      cacheKey,
      map: mapped
    };
    return mapped;
  } catch (_) {
    return singerConfigBvSourceCache.map || new Map();
  }
}

function getPreferredSourceByUploaderMid(uploaderMid) {
  const mid = normalizeUploaderMid(uploaderMid);
  if (!mid) return '';
  return store.uploaderSourceMap.get(mid) || '';
}

function escapeRegExp(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAliasKeywords(aliasText) {
  const raw = String(aliasText || '').trim();
  if (!raw) return [];
  const normalized = raw.replace(/[()（）【】[\]「」『』]/g, ' ').trim();
  const keywords = new Set();
  const pushToken = token => {
    const value = String(token || '').trim();
    if (!value) return;
    if (value.length < 2) return;
    if (!/[\p{L}\p{N}]/u.test(value)) return;
    keywords.add(value);
  };

  pushToken(raw);
  if (normalized) pushToken(normalized);
  normalized.split(/[\/|,，、\s]+/).forEach(pushToken);
  return Array.from(keywords).sort((a, b) => b.length - a.length);
}

function matchesAliasKeyword(text, textLower, keyword) {
  const token = String(keyword || '').trim();
  if (!token) return false;
  const isAscii = /^[\x00-\x7F]+$/.test(token);
  if (!isAscii) return text.includes(token);

  const lowerToken = token.toLowerCase();
  if (lowerToken.length < 3) return false;
  const regex = new RegExp(`(^|[^a-z0-9])${escapeRegExp(lowerToken)}([^a-z0-9]|$)`);
  return regex.test(textLower);
}

function inferSourceFromLivePayloadAlias(livePayload) {
  if (!livePayload) return '';
  const blocks = [];
  const videoTitle = String(livePayload.videoTitle || '').trim();
  if (videoTitle) blocks.push(videoTitle);
  const pages = Array.isArray(livePayload.pages) ? livePayload.pages : [];
  pages.forEach(pageItem => {
    const part = String(pageItem?.part || '').trim();
    if (part) blocks.push(part);
  });
  if (blocks.length === 0) return '';

  const fullText = blocks.join('\n');
  const lowerText = fullText.toLowerCase();
  let bestSource = '';
  let bestScore = 0;

  store.files.forEach(sourceFile => {
    const alias = getSourceAlias(sourceFile);
    const keywords = buildAliasKeywords(alias);
    if (keywords.length === 0) return;

    let score = 0;
    keywords.forEach(keyword => {
      if (!matchesAliasKeyword(fullText, lowerText, keyword)) return;
      const tokenLen = String(keyword).length;
      score += tokenLen >= 6 ? 4 : tokenLen >= 4 ? 3 : 2;
    });

    if (score > bestScore) {
      bestScore = score;
      bestSource = sourceFile;
    }
  });

  return bestScore > 0 ? bestSource : '';
}

function pickSourceFromDupSongs(dupList) {
  if (!Array.isArray(dupList) || dupList.length === 0) return '';
  const sourceCounter = new Map();
  dupList.forEach(song => {
    const sourceFile = String(song?.source || '').trim();
    if (!sourceFile) return;
    sourceCounter.set(sourceFile, (sourceCounter.get(sourceFile) || 0) + 1);
  });
  let bestSource = '';
  let bestCount = -1;
  sourceCounter.forEach((count, sourceFile) => {
    if (count > bestCount) {
      bestCount = count;
      bestSource = sourceFile;
    }
  });
  return bestSource;
}

function inferBvSourceByHints(normalizedBv, livePayload) {
  const fromConfig = getSingerConfigBvSourceMap().get(normalizedBv);
  if (fromConfig) return fromConfig;

  const fromAlias = inferSourceFromLivePayloadAlias(livePayload);
  if (fromAlias) return fromAlias;

  const fromUploader = getPreferredSourceByUploaderMid(livePayload?.uploaderMid);
  if (fromUploader) return fromUploader;
  return '';
}

function stripLiveTrackPrefix(rawText) {
  let value = String(rawText || '').trim();
  if (!value) return '';
  value = value.replace(/^\[\s*\d+\s*[\]\)]\s*/u, '');
  value = value.replace(/^(?:p\s*)?\d{1,3}\s*[\.\)\]:：、\-]\s*/iu, '');
  value = value.replace(/^(?:p\s*)?\d{1,3}\s+/iu, '');
  return value.trim();
}

function parseLivePartToSongEntry(partTitle, fallbackTitle, pageNo) {
  const rawPart = String(partTitle || '').trim();
  const cleanedPart = stripLiveTrackPrefix(rawPart);
  const text = cleanedPart || rawPart || String(fallbackTitle || '').trim() || `P${pageNo}`;

  const titleArtistMatch = text.match(/^(.+?)\s*[-－—–]\s*(.+)$/u);
  if (titleArtistMatch) {
    const parsedTitle = String(titleArtistMatch[1] || '').trim();
    const parsedArtist = String(titleArtistMatch[2] || '').trim();
    if (parsedTitle && parsedArtist) {
      return {
        title: parsedTitle,
        artist: parsedArtist
      };
    }
  }

  return {
    title: text,
    artist: ''
  };
}

function buildLiveFallbackSongsFromPayload(livePayload, preferredSource = '') {
  if (!livePayload || !livePayload.bvid) return [];
  const pages = Array.isArray(livePayload.pages) && livePayload.pages.length > 0
    ? livePayload.pages
    : [{ page: 1, part: livePayload.videoTitle || '' }];
  const bvid = String(livePayload.bvid || '').trim();
  if (!bvid) return [];

  return pages.map((pageItem, index) => {
    const pageNo = Number(pageItem?.page) > 0 ? Number(pageItem.page) : (index + 1);
    const partTitle = String(pageItem?.part || '').trim();
    const parsed = parseLivePartToSongEntry(partTitle, livePayload.videoTitle, pageNo);
    return {
      title: parsed.title,
      artist: parsed.artist,
      source: preferredSource,
      link: `https://www.bilibili.com/video/${bvid}?p=${pageNo}`,
      cover: livePayload.cover || '',
      bvid,
      page: pageNo,
      uploader: String(livePayload.uploader || '').trim(),
      uploaderMid: normalizeUploaderMid(livePayload.uploaderMid)
    };
  });
}

async function fetchBiliViewPayload(rawBvInput) {
  const inputBv = extractBvPreserveCase(rawBvInput) || extractBV(rawBvInput);
  if (!inputBv) return null;
  const now = Date.now();
  const cached = bvLiveFallbackCache.get(inputBv);
  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BV_LIVE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${BILI_VIEW_API}${encodeURIComponent(inputBv)}`, {
      signal: controller.signal
    });
    if (!response.ok) return null;
    const json = await response.json().catch(() => null);
    if (!json || Number(json.code) !== 0 || !json.data) return null;
    const payload = json.data;
    const normalized = {
      bvid: extractBvPreserveCase(payload.bvid) || inputBv,
      uploader: String(payload.owner?.name || '').trim(),
      uploaderMid: normalizeUploaderMid(payload.owner?.mid),
      videoTitle: String(payload.title || '').trim(),
      cover: buildBiliThumbUrl(payload.pic),
      pages: Array.isArray(payload.pages) ? payload.pages : []
    };
    bvLiveFallbackCache.set(inputBv, {
      payload: normalized,
      expiresAt: now + BV_LIVE_CACHE_TTL_MS
    });
    return normalized;
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getSongTitleSourceCount(songOrTitle) {
  const title = typeof songOrTitle === 'string'
    ? songOrTitle
    : (songOrTitle && songOrTitle.title) || '';
  const key = normalizeSongTitleKey(title);
  return store.titleSourceMap.get(key)?.size || 0;
}

function getSongBvid(item) {
  return extractBvPreserveCase(item?.bvid || item?.link || '') || extractBV(item?.bvid || item?.link || '');
}

function countUniqueBvids(data) {
  const set = new Set();
  (Array.isArray(data) ? data : []).forEach(item => {
    const bvid = getSongBvid(item);
    if (bvid) set.add(bvid);
  });
  return set.size;
}

function buildStatsOverview(data) {
  const artistKeys = new Set();
  let validArtistPosts = 0;

  data.forEach(song => {
    if (isValidArtist(song.artist)) {
      validArtistPosts += 1;
      artistKeys.add(normalizeString(song.artist));
    }
  });

  const uniqueTracks = getUniqueSongCount(data);
  const soloTracks = countSoloUniqueTracks(data);
  const bvCount = countUniqueBvids(data);
  return {
    totalSongs: data.length,
    bvCount,
    uniqueTracks,
    soloTracks,
    avgPerformancesPerUniqueTrack: uniqueTracks > 0 ? data.length / uniqueTracks : 0,
    avgSongsPerBv: bvCount > 0 ? data.length / bvCount : 0,
    artistCount: artistKeys.size,
    validArtistPosts
  };
}

function buildStatsOverviewByTab(tab, data, groups) {
  const base = buildStatsOverview(data);
  if (tab === 'rank') {
    const trackCount = Array.isArray(groups) ? groups.length : 0;
    const totalSongs = Number(base.totalSongs || 0);
    const avgPerformancesPerTrack = trackCount > 0 ? totalSongs / trackCount : 0;
    const topTrack = trackCount > 0 ? groups[0] : null;
    const multiSourceTracks = (Array.isArray(groups) ? groups : [])
      .filter(item => Number(item?.sourceCount || 0) > 1)
      .length;
    const multiSourceRate = trackCount > 0
      ? `${((multiSourceTracks / trackCount) * 100).toFixed(1)}%`
      : '0.0%';
    return {
      kind: 'rank',
      totalSongs,
      trackCount,
      avgPerformancesPerTrack,
      topTrackCount: Number(topTrack?.count || 0),
      topTrackTitle: String(topTrack?.title || '').trim(),
      multiSourceTracks,
      multiSourceRate,
      artistCount: Number(base.artistCount || 0),
      validArtistPosts: Number(base.validArtistPosts || 0)
    };
  }

  if (tab === 'artist') {
    const artistCount = Array.isArray(groups) ? groups.length : 0;
    const totalSongs = Number(base.totalSongs || 0);
    const totalUniqueTracksByArtist = (Array.isArray(groups) ? groups : [])
      .reduce((sum, item) => sum + Number(item?.uniqueCount || 0), 0);
    const avgPerformancesPerArtist = artistCount > 0 ? totalSongs / artistCount : 0;
    const avgUniqueTracksPerArtist = artistCount > 0 ? totalUniqueTracksByArtist / artistCount : 0;
    const topArtist = artistCount > 0 ? groups[0] : null;
    return {
      kind: 'artist',
      totalSongs,
      artistCount,
      validArtistPosts: Number(base.validArtistPosts || 0),
      totalUniqueTracksByArtist,
      avgPerformancesPerArtist,
      avgUniqueTracksPerArtist,
      topArtistCount: Number(topArtist?.totalCount || 0),
      topArtistName: String(topArtist?.name || '').trim()
    };
  }

  return {
    kind: 'vtuber',
    ...base
  };
}

async function buildDupCheckResponse(mode, source, items) {
  const results = [];
  const liveFallback = {
    enabled: mode === 'bv',
    maxPerRequest: BV_LIVE_FALLBACK_MAX_PER_REQUEST,
    attempted: 0,
    skipped: 0
  };

  if (mode === 'bv') {
    const requestLiveCache = new Map();
    for (const item of items) {
      const raw = String(item?.raw || '').trim();
      const normalizedBv = extractBV(item?.bv || raw);
      const preserveCaseBv = extractBvPreserveCase(raw) || extractBvPreserveCase(item?.bv || '');
      if (!normalizedBv) {
        results.push(buildBvNotFoundResult(raw));
        continue;
      }

      const matchedSongs = store.bvMap.get(normalizedBv) || [];
      if (matchedSongs.length > 0) {
        matchedSongs.forEach(song => {
          const titleKey = normalizeSongTitleKey(song.title || '');
          const dupList = filterCandidatesBySource(store.titleMap.get(titleKey)?.songs || [], source);
          results.push({
            isNotFound: false,
            originalInput: raw,
            song,
            dupList,
            dupCount: dupList.length,
            isDup: dupList.length > 1
          });
        });
        continue;
      }

      const liveCacheKey = preserveCaseBv || normalizedBv;
      let livePayload = requestLiveCache.get(liveCacheKey);
      if (livePayload === undefined) {
        if (liveFallback.attempted >= BV_LIVE_FALLBACK_MAX_PER_REQUEST) {
          liveFallback.skipped += 1;
          results.push(buildBvNotFoundResult(raw, 'live-fallback-limit'));
          continue;
        }
        liveFallback.attempted += 1;
        livePayload = await fetchBiliViewPayload(liveCacheKey);
        requestLiveCache.set(liveCacheKey, livePayload || null);
      }
      if (!livePayload) {
        results.push(buildBvNotFoundResult(raw));
        continue;
      }

      const hintedSource = inferBvSourceByHints(normalizedBv, livePayload);
      const liveSongs = buildLiveFallbackSongsFromPayload(livePayload, hintedSource);
      if (liveSongs.length === 0) {
        results.push(buildBvNotFoundResult(raw));
        continue;
      }

      liveSongs.forEach(song => {
        const titleKey = normalizeSongTitleKey(song.title || '');
        const dupList = titleKey
          ? filterCandidatesBySource(store.titleMap.get(titleKey)?.songs || [], source)
          : [];
        const resolvedSource = song.source || pickSourceFromDupSongs(dupList);
        const displaySong = resolvedSource ? { ...song, source: resolvedSource } : song;
        results.push({
          isNotFound: false,
          originalInput: raw,
          song: displaySong,
          dupList,
          dupCount: dupList.length,
          isDup: dupList.length > 1
        });
      });
    }
  } else {
    items.forEach(item => {
      const inputTitle = String(item?.title || '').trim();
      const inputArtist = String(item?.artist || '').trim();
      const queryType = String(item?.type || 'titleArtist');
      const originalInput = String(item?.originalLine || item?.raw || '').trim();
      const titleKey = normalizeSongTitleKey(inputTitle);
      const artistKey = normalizeString(inputArtist);
      let dupList = [];
      let titleMatches = [];

      if (queryType === 'artistOnly') {
        dupList = getSourceScopedSongs(source)
          .filter(song => areArtistsCompatible(song.artist || '', inputArtist));
      } else if (titleKey) {
        titleMatches = filterCandidatesBySource(store.titleMap.get(titleKey)?.songs || [], source);
        dupList = artistKey
          ? titleMatches.filter(song => areArtistsCompatible(song.artist || '', inputArtist))
          : titleMatches;
      }

      if (dupList.length === 0) {
        const isArtistMismatch = queryType !== 'artistOnly' && artistKey && titleMatches.length > 0;
        results.push({
          isNotFound: false,
          originalInput,
          song: {
            title: inputTitle || '（按歌手名查询）',
            artist: inputArtist || '',
            source: '',
            link: ''
          },
          dupList: isArtistMismatch ? titleMatches : [],
          dupCount: isArtistMismatch ? titleMatches.length : 0,
          isDup: isArtistMismatch,
          isFirst: !isArtistMismatch,
          isArtistMismatch,
          queryType
        });
      } else {
        results.push({
          isNotFound: false,
          originalInput,
          song: dupList[0],
          dupList,
          dupCount: dupList.length,
          isDup: true,
          isFirst: false,
          queryType
        });
      }
    });
  }

  const total = results.length;
  let statsText = '';
  if (mode === 'titleArtist') {
    const first = results.filter(item => !item.isNotFound && item.isFirst).length;
    const mismatch = results.filter(item => item.isArtistMismatch).length;
    const exists = total - first;
    statsText = `总计 ${total} | 已收录 ${exists} | 首次 ${first} | 歌手疑似不一致 ${mismatch} | 当前库 ${getScopedSourceLabel(source)}`;
  } else {
    const notFound = results.filter(item => item.isNotFound).length;
    const found = total - notFound;
    const dup = results.filter(item => !item.isNotFound && item.isDup).length;
    const unique = found - dup;
    statsText = `总计 ${total} | 找到 ${found} | 未找到 ${notFound} | 重复 ${dup} | 非重复 ${unique} | 当前库 ${getScopedSourceLabel(source)}`;
  }

  return {
    mode,
    source,
    items: results,
    statsText,
    summary: buildDupCheckSummary(mode, source, results),
    liveFallback
  };
}

function buildDupCheckSummary(mode, source, results) {
  const rows = Array.isArray(results) ? results : [];
  const total = rows.length;
  const notFound = rows.filter(item => item.isNotFound).length;
  const artistMismatch = rows.filter(item => item.isArtistMismatch).length;
  const first = rows.filter(item => !item.isNotFound && !!item.isFirst).length;
  const dup = rows.filter(item => !item.isNotFound && !!item.isDup && !item.isArtistMismatch).length;
  const unique = mode === 'titleArtist'
    ? first
    : rows.filter(item => !item.isNotFound && !item.isDup).length;
  return {
    mode,
    source,
    sourceLabel: getScopedSourceLabel(source),
    total,
    groups: {
      first,
      exists: Math.max(0, total - first - notFound),
      notFound,
      duplicate: dup,
      unique,
      artistMismatch
    },
    copyPresets: [
      { id: 'titleArtist', label: '歌名 - 歌手', fields: ['title', 'artist'], separator: ' - ', format: 'text' },
      { id: 'titleArtistLink', label: '歌名 - 歌手 链接', fields: ['title', 'artist', 'link'], separator: ' ', format: 'text' },
      { id: 'tsv', label: 'TSV', fields: ['status', 'title', 'artist', 'source', 'link', 'bvid'], separator: '\t', format: 'table' }
    ]
  };
}

function buildArtistSummaryByTitle(title) {
  const normalizedTitle = normalizeSongTitleKey(title);
  const entry = store.titleMap.get(normalizedTitle);
  const matchedSongs = entry ? entry.songs : [];
  const artistMap = new Map();

  matchedSongs.forEach((song, index) => {
    const artistName = (song.artist || '未知歌手').trim();
    const sourceAlias = getSourceAlias(song.source);
    if (!artistMap.has(artistName)) {
      artistMap.set(artistName, {
        name: artistName,
        sources: new Set(),
        firstSeen: index
      });
    }
    artistMap.get(artistName).sources.add(sourceAlias);
  });

  const artists = Array.from(artistMap.values())
    .map(item => ({
      name: item.name,
      sources: Array.from(item.sources).join(' / '),
      sourceCount: item.sources.size,
      firstSeen: item.firstSeen
    }))
    .sort((a, b) => {
      if (b.sourceCount !== a.sourceCount) return b.sourceCount - a.sourceCount;
      return a.firstSeen - b.firstSeen;
    });

  return {
    title,
    artists,
    artistNames: artists.map(item => item.name),
    maxSourceArtist: artists.length > 0 ? artists[0].name : '',
    hasResult: artists.length > 0
  };
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
  };
  return map[ext] || 'application/octet-stream';
}

function getStaticHeaders(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const headers = { 'Content-Type': getMimeType(filePath) };
  if (ext === '.html') {
    headers['Cache-Control'] = 'no-store';
  }
  return headers;
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function handleBootstrap(res) {
  sendJson(res, 200, {
    mode: 'api',
    files: store.files,
    fileToAlias: store.fileToAlias,
    sourceProfiles: store.sourceProfiles,
    sourceStats: store.sourceStats,
    totalSongs: store.songs.length,
    totalUnique: store.totalUnique
  });
}

function handleSources(res) {
  const sources = store.files.map(fileName => {
    const key = fileName.replace('.js', '');
    return {
      file: fileName,
      alias: store.fileToAlias[key] || fileName,
      profile: getSourceProfile(fileName),
      totalSongs: store.sourceStats[fileName]?.totalSongs || 0,
      totalUnique: store.sourceStats[fileName]?.totalUnique || 0
    };
  });
  sendJson(res, 200, { sources });
}

function handleAllSongs(reqUrl, res) {
  const source = reqUrl.searchParams.get('source') || 'all';
  const data = getSourceScopedSongs(source);

  sendJson(res, 200, {
    items: data,
    total: data.length,
    totalUnique: getUniqueSongCount(data),
    files: store.files,
    fileToAlias: store.fileToAlias,
    sourceProfiles: store.sourceProfiles,
    sourceStats: store.sourceStats
  });
}

function filterSongs(source, keyword) {
  let data = getSourceScopedSongs(source);

  const kw = normalizeString(keyword || '');
  if (kw) {
    const artistCondition = { type: 'fuzzy', value: kw };
    data = data.filter(item => {
      const title = normalizeString(item.title || '');
      const artist = normalizeString(item.artist || '');
      const collection = normalizeString(item.collection || '');
      const originalArtist = normalizeString(item.originalArtist || '');
      return title.includes(kw)
        || collection.includes(kw)
        || artist.includes(kw)
        || originalArtist.includes(kw)
        || matchesArtistCondition(artist, artistCondition)
        || matchesArtistCondition(originalArtist, artistCondition);
    });
  }
  return data;
}

function aggregateBySong(data) {
  const titleGroups = new Map();
  data.forEach(item => {
    const artist = item.artist || '';
    const title = item.title || '未知歌曲';
    const titleKey = normalizeSongIdentityKey(item);
    if (!titleGroups.has(titleKey)) {
      titleGroups.set(titleKey, []);
    }
    const groups = titleGroups.get(titleKey);
    let entry = groups.find(saved => isSameSong(item, saved, isValidArtist));
    if (!entry) {
      const display = getCanonicalSongIdentityDisplay(item) || { title, artist };
      entry = {
        key: `${titleKey}|${groups.length}`,
        title: display.title,
        artist: display.artist,
        originalArtist: item.originalArtist || '',
        count: 0,
        performances: [],
        sourceSet: new Set(),
        sourceCount: 0,
        isSolo: false
      };
      groups.push(entry);
    }
    entry.count += 1;
    entry.sourceSet.add(item.source || '');
    entry.sourceCount = entry.sourceSet.size;
    entry.isSolo = isSoloUniqueSong(item);
    entry.performances.push({
      link: item.link || '',
      collection: item.collection || '未知合集',
      source: getSourceAlias(item.source),
      cover: item.cover || '',
      bvid: extractBV(item.bvid || item.link || '')
    });
  });
  return Array.from(titleGroups.values())
    .flat()
    .map(entry => ({
      ...entry,
      sourceSet: undefined
    }))
    .sort((a, b) => b.count - a.count);
}

function aggregateByVtuberSource(data) {
  const map = new Map();
  data.forEach(item => {
    const sourceFile = item.source || '未知来源';
    const sourceKey = sourceFile.replace('.js', '');
    const vtuberName = getSourceAlias(sourceFile);
    if (!map.has(sourceKey)) {
      map.set(sourceKey, {
        key: sourceFile,
        name: vtuberName,
        sourceFile,
        profile: getSourceProfile(sourceFile),
        bvSet: new Set(),
        songGroups: new Map()
      });
    }
    const vtuberEntry = map.get(sourceKey);
    const bvid = getSongBvid(item);
    if (bvid) vtuberEntry.bvSet.add(bvid);
    const titleKey = normalizeSongIdentityKey(item);
    if (!vtuberEntry.songGroups.has(titleKey)) {
      vtuberEntry.songGroups.set(titleKey, []);
    }
    const groups = vtuberEntry.songGroups.get(titleKey);
    let songEntry = groups.find(saved => isSameSong(item, saved.representative, isValidArtist));
    if (!songEntry) {
      const display = getCanonicalSongIdentityDisplay(item) || {
        title: item.title || '未知歌曲',
        artist: item.artist || ''
      };
      songEntry = {
        representative: item,
        title: display.title,
        artist: display.artist,
        originalArtist: item.originalArtist || '',
        cover: item.cover || '',
        count: 0,
        links: [],
        isSolo: false
      };
      groups.push(songEntry);
    }
    songEntry.count += 1;
    songEntry.isSolo = isSoloUniqueSong(item);
    if (item.link) {
      songEntry.links.push({
        link: item.link,
        collection: item.collection || '未知合集',
        source: vtuberName,
        cover: item.cover || ''
      });
    }
  });
  const result = Array.from(map.values());
  result.forEach(v => {
    const songArr = Array.from(v.songGroups.values()).flat().sort((a, b) => b.count - a.count);
    v.songs = songArr;
    delete v.songGroups;
    v.totalCount = songArr.reduce((acc, s) => acc + s.count, 0);
    v.bvCount = v.bvSet.size;
    delete v.bvSet;
    v.uniqueCount = songArr.length;
    v.soloCount = songArr.filter(song => song.isSolo).length;
  });
  result.sort((a, b) => b.totalCount - a.totalCount);
  return result;
}

function aggregateByArtist(data) {
  const map = new Map();
  data.forEach(item => {
    const artist = item.artist || '';
    if (!isValidArtist(artist)) return;
    const key = normalizeString(artist);
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: artist,
        bvSet: new Set(),
        songs: new Map()
      });
    }
    const artistEntry = map.get(key);
    const bvid = getSongBvid(item);
    if (bvid) artistEntry.bvSet.add(bvid);
    const songKey = normalizeSongIdentityKey(item);
    if (!artistEntry.songs.has(songKey)) {
      const display = getCanonicalSongIdentityDisplay(item);
      artistEntry.songs.set(songKey, {
        title: display?.title || item.title || '未知歌曲',
        cover: item.cover || '',
        count: 0,
        links: [],
        bvPageMap: new Map()
      });
    }
    const songEntry = artistEntry.songs.get(songKey);
    songEntry.count += 1;
    const linkBvid = bvid || getSongBvid({ link: item.link });
    if (linkBvid && item.link) {
      if (!songEntry.bvPageMap.has(linkBvid)) songEntry.bvPageMap.set(linkBvid, []);
      songEntry.bvPageMap.get(linkBvid).push({
        link: item.link,
        collection: item.collection || '未知合集',
        source: getSourceAlias(item.source),
        cover: item.cover || '',
        page: Number(item.page || 0) || null
      });
    }
    if (item.link) {
      songEntry.links.push({
        link: item.link,
        collection: item.collection || '未知合集',
        source: getSourceAlias(item.source),
        cover: item.cover || ''
      });
    }
  });
  const result = Array.from(map.values());
  result.forEach(v => {
    const songArr = Array.from(v.songs.values()).map(song => {
      const duplicateBvGroups = Array.from(song.bvPageMap?.entries?.() || [])
        .map(([bvid, links]) => {
          const pages = Array.from(new Set(links.map(link => link.page).filter(Boolean))).sort((a, b) => a - b);
          return { bvid, pages, links };
        })
        .filter(group => group.pages.length > 1);
      delete song.bvPageMap;
      return {
        ...song,
        duplicateBvGroups,
        duplicateBvCount: duplicateBvGroups.length
      };
    }).sort((a, b) => b.count - a.count);
    v.songs = songArr;
    v.totalCount = songArr.reduce((acc, s) => acc + s.count, 0);
    v.bvCount = v.bvSet.size;
    delete v.bvSet;
    v.uniqueCount = songArr.length;
    v.duplicateBvCount = songArr.reduce((sum, song) => sum + Number(song.duplicateBvCount || 0), 0);
  });
  result.sort((a, b) => b.totalCount - a.totalCount);
  return result;
}

function buildStatsAggregateCacheKey(tab, source, keyword) {
  return `${tab}::${source}::${normalizeString(keyword || '')}`;
}

function setStatsAggregateCache(cacheKey, value) {
  if (statsAggregateCache.has(cacheKey)) {
    statsAggregateCache.delete(cacheKey);
  }
  statsAggregateCache.set(cacheKey, value);
  if (statsAggregateCache.size > STATS_CACHE_LIMIT) {
    const oldestKey = statsAggregateCache.keys().next().value;
    statsAggregateCache.delete(oldestKey);
  }
}

function getStatsAggregatePayload(tab, source, keyword) {
  const cacheKey = buildStatsAggregateCacheKey(tab, source, keyword);
  if (statsAggregateCache.has(cacheKey)) {
    const cached = statsAggregateCache.get(cacheKey);
    statsAggregateCache.delete(cacheKey);
    statsAggregateCache.set(cacheKey, cached);
    return cached;
  }

  const data = filterSongs(source, keyword);
  let groups = [];
  let summaryText = '';
  if (tab === 'rank') {
    groups = aggregateBySong(data);
    summaryText = `共 ${groups.length} 首歌曲`;
  } else if (tab === 'artist') {
    groups = aggregateByArtist(data);
    summaryText = `共 ${groups.length} 位歌手`;
  } else {
    groups = aggregateByVtuberSource(data);
    summaryText = `共 ${groups.length} 位 VTuber`;
  }

  const payload = {
    overview: buildStatsOverviewByTab(tab, data, groups),
    groups,
    summaryText,
    hasData: data.length > 0
  };
  setStatsAggregateCache(cacheKey, payload);
  return payload;
}

function getStatsSortValue(item, field) {
  switch (field) {
    case 'bvid':
    case 'bv':
    case 'bvCount':
      return Number(item?.bvCount || 0);
    case 'avg':
    case 'average':
    case 'avgSongsPerBv':
      return Number(item?.bvCount || 0) > 0
        ? Number(item?.totalCount || item?.count || 0) / Number(item?.bvCount || 0)
        : 0;
    case 'unique':
    case 'uniqueCount':
      return Number(item?.uniqueCount || 0);
    case 'solo':
    case 'soloCount':
      return Number(item?.soloCount || 0);
    case 'songs':
    case 'total':
    case 'totalCount':
    case 'count':
    default:
      return Number(item?.totalCount || item?.count || 0);
  }
}

function isStatsAverageSortField(field) {
  return field === 'avg' || field === 'average' || field === 'avgSongsPerBv';
}

function isStatsAvgSortDeferredFlag(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function isStatsAvgSortDeferredGroup(item) {
  const sourceKey = String(item?.sourceFile || item?.key || '').replace(/\.js$/, '');
  const profile = item?.profile || (sourceKey ? store.sourceProfiles[sourceKey] : null);
  return isStatsAvgSortDeferredFlag(item?.statsAvgSortDeferred)
    || isStatsAvgSortDeferredFlag(profile?.statsAvgSortDeferred);
}

function sortStatsGroups(groups, tab, sortValue) {
  const input = Array.isArray(groups) ? groups : [];
  const defaultSort = tab === 'vtuber-source' ? 'songs-desc' : 'count-desc';
  const raw = String(sortValue || defaultSort).trim();
  const parts = raw.split('-');
  const direction = parts.pop() === 'asc' ? 'asc' : 'desc';
  const field = parts.join('-') || (tab === 'vtuber-source' ? 'songs' : 'count');
  const isAverageSort = isStatsAverageSortField(field);

  return input.slice().sort((a, b) => {
    if (isAverageSort) {
      const deferredA = isStatsAvgSortDeferredGroup(a);
      const deferredB = isStatsAvgSortDeferredGroup(b);
      if (deferredA !== deferredB) return deferredA ? 1 : -1;
    }
    const valA = getStatsSortValue(a, field);
    const valB = getStatsSortValue(b, field);
    if (valA !== valB) {
      return direction === 'asc' ? valA - valB : valB - valA;
    }
    return String(a?.name || a?.title || '').localeCompare(String(b?.name || b?.title || ''), 'zh-Hans');
  });
}

function buildGroupSummaryLinks(group, type, limit = STATS_SUMMARY_LINK_LIMIT) {
  const rows = [];
  (group.songs || []).forEach(song => {
    (song.links || []).forEach(link => {
      if (rows.length >= limit || !link.link) return;
      rows.push({
        title: song.title || '未知歌曲',
        artist: type === 'artist'
          ? (group.name || '')
          : ((song.artist || song.originalArtist || '').trim()),
        collection: link.collection || '未知合集',
        link: link.link
      });
    });
  });
  return rows;
}

function summarizeSongLinks(song, limit = STATS_PREVIEW_LINK_LIMIT) {
  const links = Array.isArray(song.links) ? song.links.slice(0, limit) : [];
  return {
    ...song,
    links,
    totalLinks: Array.isArray(song.links) ? song.links.length : 0,
    hasMoreLinks: Array.isArray(song.links) ? song.links.length > links.length : false
  };
}

function summarizeRankItem(item, full = false) {
  const limit = full ? item.performances.length : STATS_PREVIEW_PERFORMANCE_LIMIT;
  const performances = (item.performances || []).slice(0, limit);
  return {
    ...item,
    performances,
    totalPerformances: Array.isArray(item.performances) ? item.performances.length : performances.length,
    hasMorePerformances: Array.isArray(item.performances) ? item.performances.length > performances.length : false,
    fullLoaded: full || !Array.isArray(item.performances) || item.performances.length <= performances.length
  };
}

function summarizeGroupItem(group, type, full = false) {
  const songs = Array.isArray(group.songs) ? group.songs : [];
  const visibleSongs = (full ? songs : songs.slice(0, STATS_PREVIEW_SONG_LIMIT))
    .map(song => summarizeSongLinks(song, full ? (song.links || []).length : STATS_PREVIEW_LINK_LIMIT));
  const songsComplete = songs.length === visibleSongs.length
    && visibleSongs.every(song => !song.hasMoreLinks);
  return {
    ...group,
    songs: visibleSongs,
    totalSongs: songs.length,
    hasMoreSongs: songs.length > visibleSongs.length,
    fullLoaded: full || songsComplete,
    summaryLinks: buildGroupSummaryLinks(group, type)
  };
}

function getStatsDetailItem(tab, source, keyword, key) {
  const payload = getStatsAggregatePayload(tab, source, keyword);
  if (tab === 'rank') {
    const item = payload.groups.find(group => group.key === key);
    return item ? summarizeRankItem(item, true) : null;
  }
  if (tab === 'artist') {
    const item = payload.groups.find(group => group.key === key);
    return item ? summarizeGroupItem(item, 'artist', true) : null;
  }
  const item = payload.groups.find(group => group.key === key || group.sourceFile === key);
  return item ? summarizeGroupItem(item, 'vtuber', true) : null;
}

function getStatsViewPageSize(tab, reqUrl) {
  const defaultPageSize = tab === 'vtuber-source' ? STATS_SOURCE_PAGE_SIZE_LIMIT : STATS_DEFAULT_PAGE_SIZE;
  const maxPageSize = tab === 'vtuber-source' ? STATS_SOURCE_PAGE_SIZE_LIMIT : 100;
  const raw = reqUrl.searchParams.has('pageSize')
    ? Number(reqUrl.searchParams.get('pageSize'))
    : defaultPageSize;
  const pageSize = Number.isFinite(raw) && raw > 0 ? raw : defaultPageSize;
  return Math.max(1, Math.min(maxPageSize, pageSize));
}

function handleStatsView(reqUrl, res) {
  const tab = reqUrl.searchParams.get('tab') || 'vtuber-source';
  const source = reqUrl.searchParams.get('source') || 'all';
  const keyword = reqUrl.searchParams.get('q') || '';
  const sort = reqUrl.searchParams.get('sort') || (tab === 'vtuber-source' ? 'songs-desc' : 'count-desc');
  const page = Math.max(1, Number(reqUrl.searchParams.get('page') || '1'));
  const pageSize = getStatsViewPageSize(tab, reqUrl);
  const payload = getStatsAggregatePayload(tab, source, keyword);
  const groups = sortStatsGroups(payload.groups || [], tab, sort);
  const total = groups.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const items = groups.slice(start, start + pageSize).map(item => {
    if (tab === 'rank') return summarizeRankItem(item, false);
    if (tab === 'artist') return summarizeGroupItem(item, 'artist', false);
    return summarizeGroupItem(item, 'vtuber', false);
  });

  sendJson(res, 200, {
    tab,
    items,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    summaryText: payload.summaryText,
    overview: payload.overview,
    hasData: payload.hasData,
    source,
    q: keyword,
    sort
  });
}

function handleStatsDetail(reqUrl, res) {
  const tab = reqUrl.searchParams.get('tab') || 'vtuber-source';
  const source = reqUrl.searchParams.get('source') || 'all';
  const keyword = reqUrl.searchParams.get('q') || '';
  const key = reqUrl.searchParams.get('key') || '';

  if (!key) {
    sendJson(res, 400, { error: 'Missing key' });
    return;
  }

  const item = getStatsDetailItem(tab, source, keyword, key);
  if (!item) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  sendJson(res, 200, {
    tab,
    source,
    q: keyword,
    key,
    item
  });
}

function getSearchOptions(reqUrl) {
  const fieldsParam = reqUrl.searchParams.get('fields') || 'title,artist';
  const fieldsList = fieldsParam.split(',').map(item => item.trim()).filter(Boolean);
  return {
    query: reqUrl.searchParams.get('q') || '',
    source: reqUrl.searchParams.get('source') || 'all',
    sort: reqUrl.searchParams.get('sort') || 'pubdate_desc',
    page: Math.max(1, Number(reqUrl.searchParams.get('page') || '1')),
    pageSize: Math.max(1, Math.min(10000, Number(reqUrl.searchParams.get('pageSize') || '50'))),
    fields: {
      title: fieldsList.includes('title'),
      artist: fieldsList.includes('artist'),
      collection: fieldsList.includes('collection'),
      source: fieldsList.includes('source'),
      bvid: fieldsList.includes('bvid'),
      pubdate: fieldsList.includes('pubdate')
    }
  };
}

function getSearchResultSet(options) {
  const sourceSummary = getSourceSummary(options.source);
  let data = getSourceScopedSongs(options.source);
  const filteredBySourceCount = sourceSummary.count;
  const filteredBySourceUnique = sourceSummary.unique;
  const hasSearchFields = Object.values(options.fields).some(Boolean);

  if (options.query && hasSearchFields) {
    const condition = parseSearchQuery(options.query);
    if (condition) {
      data = data.filter(item => searchItem(item, condition, options.fields));
    }
  }

  data = sortSongs(data, options.sort);

  const total = data.length;
  const hasSearchCondition = options.query && hasSearchFields;
  const totalUnique = hasSearchCondition ? getUniqueSongCount(data) : filteredBySourceUnique;

  return {
    data,
    total,
    summary: {
      totalSongs: store.songs.length,
      totalUnique: store.totalUnique,
      filteredBySourceCount,
      filteredBySourceUnique,
      searchCount: total,
      searchUnique: totalUnique
    }
  };
}

function buildSongRowId(item) {
  const raw = [
    item?.source || '',
    item?.link || '',
    item?.title || '',
    item?.artist || '',
    item?.collection || '',
    item?.pubdate || ''
  ].map(value => String(value)).join('\u001f');
  return crypto.createHash('sha1').update(raw).digest('base64url');
}

function withSearchRowMeta(item) {
  const uniqueSourceCount = getSongUniqueSourceCount(item);
  const uniqueOccurrenceCount = getSongUniqueOccurrenceCount(item);
  return {
    ...item,
    rowId: buildSongRowId(item),
    sourceAlias: getExportSourceName(item),
    bvid: getExportBvid(item),
    uniqueSourceCount,
    uniqueOccurrenceCount,
    isUniqueSong: isSoloUniqueSong(item)
  };
}

function handleSearch(reqUrl, res) {
  const options = getSearchOptions(reqUrl);
  const result = getSearchResultSet(options);
  const { page, pageSize, sort } = options;
  const start = (page - 1) * pageSize;
  const items = result.data.slice(start, start + pageSize).map(withSearchRowMeta);

  sendJson(res, 200, {
    items,
    page,
    pageSize,
    sort,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
    summary: result.summary
  });
}

function getSearchExportFields(reqUrl) {
  const allowed = new Set(['title', 'artist', 'collection', 'source', 'link', 'bvid', 'pubdate']);
  const raw = reqUrl.searchParams.get('copyFields') || reqUrl.searchParams.get('exportFields') || 'title,artist,link';
  const fields = raw.split(',').map(item => item.trim()).filter(item => allowed.has(item));
  return fields.length ? fields : ['title'];
}

function getExportSourceName(item) {
  const sourceBase = String(item.source || '').replace(/\.js$/, '');
  return store.fileToAlias[sourceBase] || item.source || '';
}

function getExportBvid(item) {
  return item.bvid || extractBvPreserveCase(item.link || '') || extractBV(item.link || '');
}

function getSearchExportValue(item, field) {
  if (field === 'title') return item.title || '';
  if (field === 'artist') return isValidArtist(item.artist) ? item.artist : '';
  if (field === 'collection') return item.collection || '';
  if (field === 'source') return getExportSourceName(item);
  if (field === 'link') return item.link || '';
  if (field === 'bvid') return getExportBvid(item);
  if (field === 'pubdate') {
    const pubdateMs = Number(item.pubdate || 0) * 1000;
    return pubdateMs ? formatShanghaiDateTime(pubdateMs) : '';
  }
  return '';
}

function sanitizeTsvValue(value) {
  return String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

function handleSearchExport(reqUrl, res) {
  const options = getSearchOptions(reqUrl);
  const result = getSearchResultSet(options);
  const fields = getSearchExportFields(reqUrl);
  const format = reqUrl.searchParams.get('format') === 'tsv' ? 'tsv' : 'text';
  const validArtistOnly = reqUrl.searchParams.get('validArtistOnly') === '1';
  const separator = format === 'tsv' ? '\t' : (reqUrl.searchParams.get('separator') || ' ');
  const data = validArtistOnly
    ? result.data.filter(item => isValidArtist(item.artist))
    : result.data;

  const body = data.map(item => (
    fields.map(field => sanitizeTsvValue(getSearchExportValue(item, field))).join(separator)
  )).join('\n');

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function getGrowthHistoryMtimeMs() {
  try {
    return fs.existsSync(GROWTH_HISTORY_PATH) ? fs.statSync(GROWTH_HISTORY_PATH).mtimeMs : 0;
  } catch (_) {
    return 0;
  }
}

function buildSongGrowthPayload() {
  let collectionRows = [];
  if (fs.existsSync(GROWTH_HISTORY_PATH)) {
    try {
      collectionRows = buildDailyGrowthRows(readJson(GROWTH_HISTORY_PATH));
    } catch (error) {
      throw new Error(`Failed to read growth history: ${error.message}`);
    }
  }
  const publishRows = buildPublishGrowthRows(store.songs);
  const publishViewRows = buildPublishViewRows(store.songs);
  const publishUniqueRows = buildPublishUniqueRows(store.songs);
  const sourceUniqueRows = buildSourceUniqueGrowthRows();
  const sourceRows = buildSourceGrowthRows();
  const combinedRows = buildCombinedGrowthRows(publishRows, publishViewRows, publishUniqueRows);
  const generatedAtMs = Date.now();
  return {
    collectionRows,
    publishRows,
    publishViewRows,
    publishUniqueRows,
    sourceUniqueRows,
    sourceRows,
    combinedRows,
    anomalies: buildGrowthAnomalies(combinedRows),
    latest: {
      collection: collectionRows[collectionRows.length - 1] || null,
      publish: publishRows[publishRows.length - 1] || null,
      publishViews: publishViewRows[publishViewRows.length - 1] || null,
      publishUnique: publishUniqueRows[publishUniqueRows.length - 1] || null,
      combined: combinedRows[combinedRows.length - 1] || null
    },
    cache: {
      hit: false,
      ttlMs: SONG_GROWTH_CACHE_TTL_MS,
      generatedAtMs,
      generatedAtShanghai: formatShanghaiDateTime(generatedAtMs)
    }
  };
}

function getSongGrowthPayload() {
  const now = Date.now();
  const key = `${storeVersion}|${store.songs.length}|${getGrowthHistoryMtimeMs()}`;
  if (songGrowthCache.payload && songGrowthCache.key === key && songGrowthCache.expiresAtMs > now) {
    return {
      ...songGrowthCache.payload,
      cache: {
        ...(songGrowthCache.payload.cache || {}),
        hit: true,
        expiresAtMs: songGrowthCache.expiresAtMs
      }
    };
  }

  const payload = buildSongGrowthPayload();
  songGrowthCache = {
    key,
    expiresAtMs: now + SONG_GROWTH_CACHE_TTL_MS,
    payload
  };
  return {
    ...payload,
    cache: {
      ...(payload.cache || {}),
      hit: false,
      expiresAtMs: songGrowthCache.expiresAtMs
    }
  };
}

function handleSongGrowth(res) {
  try {
    sendJson(res, 200, getSongGrowthPayload());
  } catch (error) {
    sendJson(res, 500, { error: `Failed to build growth payload: ${error.message}` });
  }
}

function handleSongGrowthDetails(reqUrl, res) {
  try {
    sendJson(res, 200, buildGrowthDetailPayload(reqUrl));
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message || 'Failed to build growth details' });
  }
}

function getTopSourceStats(limit = 6) {
  return store.files
    .map(file => ({
      file,
      alias: getSourceAlias(file),
      totalSongs: Number(store.sourceStats[file]?.totalSongs || 0),
      totalUnique: Number(store.sourceStats[file]?.totalUnique || 0)
    }))
    .sort((a, b) => b.totalSongs - a.totalSongs)
    .slice(0, limit);
}

function getMissingArtistSourceStats(limit = 6) {
  const bySource = new Map();
  store.missingArtistSongs.forEach(song => {
    const source = String(song.source || '');
    if (!source) return;
    bySource.set(source, (bySource.get(source) || 0) + 1);
  });
  return Array.from(bySource.entries())
    .map(([source, count]) => ({
      file: source,
      alias: getSourceAlias(source),
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function countAmbiguousTitleArtists() {
  let count = 0;
  store.titleMap.forEach(entry => {
    const artists = new Set();
    (entry.songs || []).forEach(song => {
      const artist = String(song.artist || '').trim();
      if (isValidArtist(artist)) artists.add(normalizeString(artist));
    });
    if (artists.size > 1) count += 1;
  });
  return count;
}

function getSingerConfigSummary() {
  try {
    const meta = readSingerConfigWithMeta();
    return {
      loadedFrom: meta.loadedFrom,
      runtimeOverrideActive: meta.runtimeOverrideActive,
      sourceCount: meta.configs.length,
      bvidCount: meta.configs.reduce((sum, item) => sum + (Array.isArray(item.bvids) ? item.bvids.length : 0), 0)
    };
  } catch (error) {
    return {
      error: error.message,
      sourceCount: 0,
      bvidCount: 0
    };
  }
}

function buildTabsOverviewPayload() {
  const statsVtuber = getStatsAggregatePayload('vtuber-source', 'all', '');
  const statsRank = getStatsAggregatePayload('rank', 'all', '');
  const statsArtist = getStatsAggregatePayload('artist', 'all', '');
  const growth = getSongGrowthPayload();
  const configSummary = getSingerConfigSummary();
  const generatedAtMs = Date.now();

  return {
    mode: 'api',
    generatedAtMs,
    generatedAtShanghai: formatShanghaiDateTime(generatedAtMs),
    tabs: {
      home: {
        metrics: {
          totalSongs: store.songs.length,
          totalUnique: store.totalUnique,
          sourceCount: store.files.length,
          defaultPageSize: 40,
          exportFormats: ['text', 'tsv']
        },
        rowIdentity: {
          field: 'rowId',
          reason: '同一 BV 多 P 时，行内复制必须按稳定行标识定位'
        },
        topSources: getTopSourceStats(5)
      },
      stats: {
        overview: statsVtuber.overview,
        rankOverview: statsRank.overview,
        artistOverview: statsArtist.overview,
        cache: {
          aggregateLimit: STATS_CACHE_LIMIT,
          previewSongLimit: STATS_PREVIEW_SONG_LIMIT,
          previewLinkLimit: STATS_PREVIEW_LINK_LIMIT
        },
        missingArtist: {
          totalSongs: store.missingArtistSongs.length,
          totalUnique: store.missingArtistUnique,
          topSources: getMissingArtistSourceStats()
        }
      },
      bv: {
        totalKnownBv: store.bvMap.size,
        liveFallback: {
          timeoutMs: BV_LIVE_FETCH_TIMEOUT_MS,
          cacheTtlMs: BV_LIVE_CACHE_TTL_MS,
          maxPerRequest: BV_LIVE_FALLBACK_MAX_PER_REQUEST
        },
        copyPresets: buildDupCheckSummary('bv', 'all', []).copyPresets,
        config: configSummary
      },
      titleArtistDup: {
        titleCount: store.titleEntries.length,
        ambiguousTitleCount: countAmbiguousTitleArtists(),
        copyPresets: buildDupCheckSummary('titleArtist', 'all', []).copyPresets
      },
      naming: {
        titleCount: store.titleEntries.length,
        ambiguousTitleCount: countAmbiguousTitleArtists(),
        suggestLimit: 16,
        candidatePolicy: '按来源覆盖数排序，用户输入可保留为候选'
      },
      growth: {
        latest: growth.latest,
        anomalies: growth.anomalies,
        cache: growth.cache,
        rowCount: Array.isArray(growth.combinedRows) ? growth.combinedRows.length : 0
      }
    },
    priorities: [
      { id: 'P1', label: '修复行复制定位和 DOM 注入' },
      { id: 'P2', label: '统一复制面板和来源筛选' },
      { id: 'P3', label: '移动端、缓存、图表体验' }
    ]
  };
}

function handleTabsOverview(res) {
  try {
    sendJson(res, 200, buildTabsOverviewPayload());
  } catch (error) {
    sendJson(res, 500, { error: `Failed to build tabs overview: ${error.message}` });
  }
}

function handleSiteMeta(res) {
  sendJson(res, 200, {
    updateSongsLastRun: getUpdateSongsMeta(),
    dupCopyAi: {
      enabled: isDupCopyAiAvailable(),
      model: DUP_COPY_AI_MODEL || null
    }
  });
}

function handleTitleSuggest(reqUrl, res) {
  const keyword = normalizeString(reqUrl.searchParams.get('q') || '');
  if (!keyword) {
    sendJson(res, 200, { items: [] });
    return;
  }
  const items = store.titleEntries
    .filter(entry => normalizeString(entry.title).includes(keyword))
    .slice(0, 16)
    .map(entry => entry.title);
  sendJson(res, 200, { items });
}

function handleTitleLookup(req, res, body) {
  let payload;
  try {
    payload = body ? JSON.parse(body) : {};
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const results = items.map(item => {
    const title = String(item?.title || '').trim();
    const inputArtist = String(item?.inputArtist || '').trim();
    const summary = buildArtistSummaryByTitle(title);
    const isArtistValid = inputArtist
      ? summary.artistNames.some(name => areArtistsCompatible(name, inputArtist))
      : false;
    return {
      ...summary,
      inputArtist,
      isArtistValid,
      originalLine: String(item?.line || '')
    };
  });

  const passed = results.filter(item => item.hasResult && item.isArtistValid).length;
  const needsReview = results.filter(item => item.hasResult && !item.isArtistValid).length;
  const noResult = results.filter(item => !item.hasResult).length;

  sendJson(res, 200, {
    items: results,
    summary: {
      total: results.length,
      passed,
      needsReview,
      noResult,
      ambiguous: results.filter(item => Array.isArray(item.artists) && item.artists.length > 1).length
    }
  });
}

function buildDupCopyPayloadItems(payloadItems) {
  return (Array.isArray(payloadItems) ? payloadItems : [])
    .slice(0, DUP_COPY_MAX_ITEMS)
    .map(item => {
      const song = item && typeof item.song === 'object' ? item.song : {};
      const dupList = Array.isArray(item?.dupList) ? item.dupList : [];
      const songBvid = extractBV(song.bvid || song.link || '');
      const songCollection = String(song.collection || '').trim();
      const scopedVariants = [song]
        .concat(dupList.filter(entry => extractBV(entry?.bvid || entry?.link || '') === songBvid))
        .concat(dupList.filter(entry => String(entry?.collection || '').trim() === songCollection && songCollection));
      const artistVariants = [];
      const linkCandidates = [];

      scopedVariants.forEach(entry => {
        if (!entry || typeof entry !== 'object') return;
        if (entry.artist) artistVariants.push(String(entry.artist).trim());
        if (entry.link) linkCandidates.push(String(entry.link).trim());
      });

      const normalizedArtist = pickNormalizedArtistName(artistVariants);
      const links = dedupeLinksForCopy(item?.links || linkCandidates, 2);
      const sourceDisplay = getConcreteSourceName(song);

      return {
        originalInput: String(item?.originalInput || '').trim(),
        status: String(item?.status || '').trim(),
        sourceDisplay,
        artistNormalized: normalizedArtist,
        dedupeCount: Number(item?.dedupeCount || dupList.length || 0),
        song: {
          title: String(song.title || '').trim(),
          artist: String(song.artist || '').trim(),
          collection: String(song.collection || '').trim(),
          source: String(song.source || '').trim(),
          bvid: extractBV(song.bvid || song.link || ''),
          link: String(song.link || '').trim(),
          videoTitle: String(song.videoTitle || '').trim()
        },
        artistVariants: Array.from(new Set(artistVariants.filter(Boolean))),
        links
      };
    })
    .filter(item => item.song.title || item.originalInput);
}

function buildDupCopyPrompt(mode, entries) {
  const modeLabel = mode === 'titleArtist' ? '歌名歌手查重' : 'BV查重';
  const entryText = entries.map((entry, index) => [
    `#${index + 1}`,
    `input: ${entry.originalInput || '(empty)'}`,
    `status: ${entry.status || ''}`,
    `source_display: ${entry.sourceDisplay || ''}`,
    `collection: ${entry.song.collection || ''}`,
    `bvid: ${entry.song.bvid || ''}`,
    `title: ${entry.song.title || ''}`,
    `artist_display: ${entry.artistNormalized || entry.song.artist || ''}`,
    `dedupe_count: ${Number(entry.dedupeCount || 0)}`,
    `links: ${JSON.stringify(entry.links || [])}`
  ].join('\n')).join('\n\n');

  return [
    '你是歌曲查重页面的复制文段整理助手。',
    `当前页面：${modeLabel}。`,
    '请把下面每一项整理成适合直接复制发送的简洁中文文段。',
    '要求：',
    '1. 只输出 JSON，不要 markdown，不要解释。',
    '2. JSON 格式固定为 {"items":[{"copyText":"..."}]}。',
    '3. items 数量必须与输入条目数量完全一致，顺序一致。',
    '4. source_display、title、artist_display、links 都视为最终字段，不要自行改写含义，不要替换成别的来源或歌手。',
    '5. 每条 copyText 都要尽量自然，像人工整理，但格式保持稳定，优先使用：来源：... | 歌名：... | 歌手：... | 链接：...',
    '6. links 数组里的链接都要保留；如果有两个链接就都保留。',
    '7. 不要编造没有提供的信息；没有就略过，不要写“未知”。',
    '',
    entryText
  ].join('\n');
}

async function requestDupCopyAi(prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DUP_COPY_AI_TIMEOUT_MS);
  try {
    const response = await fetch(`${DUP_COPY_AI_API_BASE.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DUP_COPY_AI_API_KEY}`
      },
      body: JSON.stringify({
        model: DUP_COPY_AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1200
      }),
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`AI request failed (${response.status}): ${text.slice(0, 240)}`);
    }
    const payload = text ? JSON.parse(text) : {};
    const message = (((payload || {}).choices || [])[0] || {}).message || {};
    return String(message.content || '').trim();
  } finally {
    clearTimeout(timer);
  }
}

function parseDupCopyAiResponse(rawText, expectedLength) {
  const text = String(rawText || '').trim();
  const plain = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(plain);
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  if (items.length !== expectedLength) {
    throw new Error(`AI result length mismatch: expected ${expectedLength}, got ${items.length}`);
  }
  return items.map(item => String(item?.copyText || '').trim());
}

async function handleDupCopyClean(req, res, body) {
  let payload;
  try {
    payload = body ? JSON.parse(body) : {};
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const mode = payload.mode === 'titleArtist' ? 'titleArtist' : 'bv';
  const entries = buildDupCopyPayloadItems(payload.items);
  if (entries.length === 0) {
    sendJson(res, 400, { error: 'No items to clean' });
    return;
  }

  const fallbackItems = entries.map(entry => ({
    copyText: buildLocalCopyText(entry)
  }));
  const fallbackText = fallbackItems.map(item => item.copyText).join('\n');

  if (!isDupCopyAiAvailable()) {
    sendJson(res, 503, {
      error: 'AI copy cleaner is not configured on server',
      fallbackItems,
      fallbackText
    });
    return;
  }

  try {
    const prompt = buildDupCopyPrompt(mode, entries);
    const content = await requestDupCopyAi(prompt);
    const cleanedTexts = parseDupCopyAiResponse(content, entries.length);
    const items = cleanedTexts.map(copyText => ({ copyText }));
    sendJson(res, 200, {
      items,
      text: items.map(item => item.copyText).join('\n'),
      model: DUP_COPY_AI_MODEL
    });
  } catch (error) {
    sendJson(res, 502, {
      error: error.message,
      fallbackItems,
      fallbackText
    });
  }
}

function handleInternalReload(req, res) {
  const remote = req.socket.remoteAddress || '';
  const isLocal = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  if (!isLocal) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }
  try {
    loadSongStore();
    sendJson(res, 200, {
      ok: true,
      totalSongs: store.songs.length,
      totalUnique: store.totalUnique
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

function serveStatic(reqUrl, res) {
  let pathname = decodeURIComponent(reqUrl.pathname);
  if (ROUTE_ALIASES[pathname]) {
    pathname = `/${ROUTE_ALIASES[pathname]}`;
  } else if (pathname === '/') {
    pathname = '/index.html';
  }
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  let targetPath = filePath;
  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(ROOT, 'index.html');
  }

  fs.readFile(targetPath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, getStaticHeaders(targetPath));
    res.end(data);
  });
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleDupCheck(req, res, body) {
  let payload;
  try {
    payload = body ? JSON.parse(body) : {};
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const mode = payload.mode === 'titleArtist' ? 'titleArtist' : 'bv';
  const source = String(payload.source || 'all') || 'all';
  const items = Array.isArray(payload.items) ? payload.items : [];
  const startedAt = Date.now();
  const result = await buildDupCheckResponse(mode, source, items);

  sendJson(res, 200, {
    ...result,
    elapsedMs: Date.now() - startedAt
  });
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
  candidates.push(path.join(ROOT, 'runtime', 'singer-configs.json'));
  return uniquePaths(candidates);
}

function getSingerConfigReadCandidates() {
  return uniquePaths([
    ENV_SINGER_CONFIG_PATH,
    ...RUNTIME_SINGER_CONFIG_CANDIDATES,
    DEFAULT_SINGER_CONFIG_PATH
  ]);
}

function normalizeSingerConfigItems(items, fromLabel = '配置') {
  if (!Array.isArray(items)) {
    throw new Error(`${fromLabel}根节点必须是数组`);
  }

  return items.map((rawItem, index) => {
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      throw new Error(`${fromLabel}第 ${index + 1} 项不是对象`);
    }

    const archived = rawItem.archived === true || rawItem.skipUpdate === true || rawItem.frozen === true;
    const rawBvids = Array.isArray(rawItem.bvids) ? rawItem.bvids : [];
    const seenBv = new Set();
    const normalizedBvids = [];
    rawBvids.forEach(rawBv => {
      const bv = extractBvPreserveCase(rawBv);
      if (!bv) return;
      const dedupeKey = bv.toLowerCase();
      if (seenBv.has(dedupeKey)) return;
      seenBv.add(dedupeKey);
      normalizedBvids.push(bv);
    });
    if (!archived && normalizedBvids.length === 0) {
      throw new Error(`${fromLabel}第 ${index + 1} 项缺少有效 bvids`);
    }

    const normalizedItem = { bvids: normalizedBvids };
    if (Object.prototype.hasOwnProperty.call(rawItem, 'file')) {
      if (typeof rawItem.file !== 'string') {
        throw new Error(`${fromLabel}第 ${index + 1} 项 file 必须是字符串`);
      }
      if (rawItem.file.trim()) {
        normalizedItem.file = rawItem.file;
      }
    }
    if (Object.prototype.hasOwnProperty.call(rawItem, 'alias')) {
      if (typeof rawItem.alias !== 'string') {
        throw new Error(`${fromLabel}第 ${index + 1} 项 alias 必须是字符串`);
      }
      if (rawItem.alias.trim()) {
        normalizedItem.alias = rawItem.alias.trim();
      }
    }
    copySingerConfigBooleanField(rawItem, normalizedItem, 'archived', fromLabel, index);
    copySingerConfigBooleanField(rawItem, normalizedItem, 'skipUpdate', fromLabel, index);
    copySingerConfigBooleanField(rawItem, normalizedItem, 'frozen', fromLabel, index);
    copySingerConfigStringField(rawItem, normalizedItem, 'archiveReason', fromLabel, index);
    copySingerConfigStringField(rawItem, normalizedItem, 'sectionTitle', fromLabel, index);
    copySingerConfigStringField(rawItem, normalizedItem, 'excludeSectionTitle', fromLabel, index);
    copySingerConfigStringArrayField(rawItem, normalizedItem, 'sectionTitles', fromLabel, index);
    copySingerConfigStringArrayField(rawItem, normalizedItem, 'excludeSectionTitles', fromLabel, index);
    copySingerConfigStringArrayField(rawItem, normalizedItem, 'excludeBvids', fromLabel, index);
    return normalizedItem;
  });
}

function copySingerConfigBooleanField(rawItem, normalizedItem, fieldName, fromLabel, index) {
  if (!Object.prototype.hasOwnProperty.call(rawItem, fieldName)) return;
  if (typeof rawItem[fieldName] !== 'boolean') {
    throw new Error(`${fromLabel}第 ${index + 1} 项 ${fieldName} 必须是布尔值`);
  }
  if (rawItem[fieldName]) normalizedItem[fieldName] = true;
}

function copySingerConfigStringField(rawItem, normalizedItem, fieldName, fromLabel, index) {
  if (!Object.prototype.hasOwnProperty.call(rawItem, fieldName)) return;
  if (typeof rawItem[fieldName] !== 'string') {
    throw new Error(`${fromLabel}第 ${index + 1} 项 ${fieldName} 必须是字符串`);
  }
  const value = rawItem[fieldName].trim();
  if (value) normalizedItem[fieldName] = value;
}

function copySingerConfigStringArrayField(rawItem, normalizedItem, fieldName, fromLabel, index) {
  if (!Object.prototype.hasOwnProperty.call(rawItem, fieldName)) return;
  if (!Array.isArray(rawItem[fieldName])) {
    throw new Error(`${fromLabel}第 ${index + 1} 项 ${fieldName} 必须是字符串数组`);
  }
  const values = rawItem[fieldName].map(value => {
    if (typeof value !== 'string') {
      throw new Error(`${fromLabel}第 ${index + 1} 项 ${fieldName} 必须是字符串数组`);
    }
    return value.trim();
  }).filter(Boolean);
  if (values.length > 0) normalizedItem[fieldName] = values;
}

function parseSingerConfigFile(filePath) {
  const rawText = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(rawText);
  return normalizeSingerConfigItems(parsed, `配置文件(${filePath})`);
}

function isRuntimeSingerConfigPath(filePath) {
  const resolved = path.resolve(filePath);
  return RUNTIME_SINGER_CONFIG_CANDIDATES.some(item => path.resolve(item) === resolved);
}

function readSingerConfigWithMeta() {
  const errors = [];
  const candidates = getSingerConfigReadCandidates();
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const configs = parseSingerConfigFile(filePath);
      return {
        configs,
        loadedFrom: filePath,
        runtimeOverrideActive: isRuntimeSingerConfigPath(filePath),
        runtimeCandidates: RUNTIME_SINGER_CONFIG_CANDIDATES,
        defaultPath: DEFAULT_SINGER_CONFIG_PATH
      };
    } catch (error) {
      errors.push(`${filePath}: ${error.message}`);
    }
  }

  throw new Error(errors.length > 0
    ? `读取来源配置失败：${errors.join(' | ')}`
    : '未找到可用来源配置文件');
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function writeRuntimeSingerConfig(configs) {
  const payload = JSON.stringify(configs, null, 2) + '\n';
  const errors = [];
  for (const filePath of RUNTIME_SINGER_CONFIG_CANDIDATES) {
    try {
      ensureParentDir(filePath);
      fs.writeFileSync(filePath, payload, 'utf8');
      return filePath;
    } catch (error) {
      errors.push(`${filePath}: ${error.message}`);
    }
  }
  throw new Error(`写入运行时配置失败：${errors.join(' | ')}`);
}

function deleteRuntimeSingerConfigFiles() {
  const removed = [];
  const errors = [];
  RUNTIME_SINGER_CONFIG_CANDIDATES.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    try {
      fs.unlinkSync(filePath);
      removed.push(filePath);
    } catch (error) {
      errors.push(`${filePath}: ${error.message}`);
    }
  });
  if (errors.length > 0) {
    throw new Error(`删除运行时配置失败：${errors.join(' | ')}`);
  }
  return removed;
}

function readAdminToken() {
  try {
    return fs.readFileSync(ADMIN_TOKEN_PATH, 'utf8').trim();
  } catch (_) {
    return '';
  }
}

function getAdminTokenFromRequest(req) {
  const headerToken = (req.headers['x-admin-token'] || '').trim();
  if (headerToken) return headerToken;
  const auth = (req.headers.authorization || '').trim();
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
}

function isAuthorizedAdmin(req) {
  const expected = readAdminToken();
  if (!expected) return false;
  return getAdminTokenFromRequest(req) === expected;
}

function withAdminAuth(req, res) {
  if (!isAuthorizedAdmin(req)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return false;
  }
  return true;
}

function readUpdateSongsMeta() {
  try {
    return JSON.parse(fs.readFileSync(UPDATE_SONGS_META_PATH, 'utf8'));
  } catch (_) {
    return null;
  }
}

function probeRefreshLock() {
  return new Promise(resolve => {
    execFile('flock', ['-n', REFRESH_LOCK_PATH, 'true'], error => {
      if (!error) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

async function buildRefreshStatus() {
  const meta = readUpdateSongsMeta();
  const lockBusy = await probeRefreshLock();
  const now = Date.now();
  const retryAfterMs = refreshState.lastStartedAtMs
    ? Math.max(0, REFRESH_COOLDOWN_MS - (now - refreshState.lastStartedAtMs))
    : 0;
  return {
    available: Boolean(readAdminToken()),
    running: refreshState.running || lockBusy,
    cooldownMs: REFRESH_COOLDOWN_MS,
    retryAfterMs,
    lastStartedAtMs: refreshState.lastStartedAtMs || null,
    lastFinishedAtMs: refreshState.lastFinishedAtMs || null,
    lastExitCode: refreshState.lastExitCode,
    lastMessage: refreshState.lastMessage || '',
    updateSongsMeta: meta
  };
}

async function handleAdminRefreshStatus(req, res) {
  if (!withAdminAuth(req, res)) return;
  const status = await buildRefreshStatus();
  sendJson(res, 200, status);
}

async function handleAdminRefresh(req, res) {
  if (!withAdminAuth(req, res)) return;
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  const now = Date.now();
  const lockBusy = await probeRefreshLock();
  if (refreshState.running || lockBusy) {
    sendJson(res, 409, { error: 'Refresh already running' });
    return;
  }

  if (refreshState.lastStartedAtMs && now - refreshState.lastStartedAtMs < REFRESH_COOLDOWN_MS) {
    sendJson(res, 429, {
      error: 'Refresh cooldown',
      retryAfterMs: REFRESH_COOLDOWN_MS - (now - refreshState.lastStartedAtMs)
    });
    return;
  }

  refreshState.running = true;
  refreshState.lastStartedAtMs = now;
  refreshState.lastMessage = 'Refresh started';

  execFile('flock', ['-n', REFRESH_LOCK_PATH, REFRESH_SCRIPT_PATH], error => {
    refreshState.running = false;
    refreshState.lastFinishedAtMs = Date.now();
    refreshState.lastExitCode = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
    refreshState.lastMessage = error ? String(error.message || 'Refresh failed') : 'Refresh completed';
  });

  sendJson(res, 202, {
    ok: true,
    startedAtMs: refreshState.lastStartedAtMs,
    cooldownMs: REFRESH_COOLDOWN_MS
  });
}

async function handleAdminSingerConfigs(req, res) {
  if (!withAdminAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const meta = readSingerConfigWithMeta();
      sendJson(res, 200, {
        ok: true,
        loadedFrom: meta.loadedFrom,
        runtimeOverrideActive: meta.runtimeOverrideActive,
        runtimeCandidates: meta.runtimeCandidates,
        defaultPath: meta.defaultPath,
        configs: meta.configs
      });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  let body;
  try {
    body = await readRequestBody(req);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
    return;
  }

  let parsedPayload;
  try {
    parsedPayload = body ? JSON.parse(body) : {};
  } catch (_) {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const rawConfigs = Array.isArray(parsedPayload)
    ? parsedPayload
    : (Array.isArray(parsedPayload.configs) ? parsedPayload.configs : null);
  if (!rawConfigs) {
    sendJson(res, 400, { error: 'Body must be an array or {configs: []}' });
    return;
  }

  let normalizedConfigs;
  try {
    normalizedConfigs = normalizeSingerConfigItems(rawConfigs, '请求体');
  } catch (error) {
    sendJson(res, 400, { error: error.message });
    return;
  }

  try {
    const savedPath = writeRuntimeSingerConfig(normalizedConfigs);
    sendJson(res, 200, {
      ok: true,
      savedTo: savedPath,
      sourceCount: normalizedConfigs.length,
      bvidCount: normalizedConfigs.reduce((sum, item) => sum + item.bvids.length, 0)
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

async function handleAdminSingerConfigsReset(req, res) {
  if (!withAdminAuth(req, res)) return;
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const removed = deleteRuntimeSingerConfigFiles();
    const meta = readSingerConfigWithMeta();
    sendJson(res, 200, {
      ok: true,
      removed,
      loadedFrom: meta.loadedFrom,
      runtimeOverrideActive: meta.runtimeOverrideActive,
      configs: meta.configs
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

loadSongStore();

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (reqUrl.pathname === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (reqUrl.pathname === '/api/bootstrap') {
    handleBootstrap(res);
    return;
  }
  if (reqUrl.pathname === '/api/sources') {
    handleSources(res);
    return;
  }
  if (reqUrl.pathname === '/api/all-songs') {
    handleAllSongs(reqUrl, res);
    return;
  }
  if (reqUrl.pathname === '/api/search') {
    handleSearch(reqUrl, res);
    return;
  }
  if (reqUrl.pathname === '/api/search/export') {
    handleSearchExport(reqUrl, res);
    return;
  }
  if (reqUrl.pathname === '/api/stats/view') {
    handleStatsView(reqUrl, res);
    return;
  }
  if (reqUrl.pathname === '/api/stats/detail') {
    handleStatsDetail(reqUrl, res);
    return;
  }
  if (reqUrl.pathname === '/api/song-growth') {
    handleSongGrowth(res);
    return;
  }
  if (reqUrl.pathname === '/api/song-growth/details') {
    handleSongGrowthDetails(reqUrl, res);
    return;
  }
  if (reqUrl.pathname === '/api/tabs/overview') {
    handleTabsOverview(res);
    return;
  }
  if (reqUrl.pathname === '/api/site-meta') {
    handleSiteMeta(res);
    return;
  }
  if (reqUrl.pathname === '/api/admin/refresh-status') {
    await handleAdminRefreshStatus(req, res);
    return;
  }
  if (reqUrl.pathname === '/api/admin/refresh') {
    await handleAdminRefresh(req, res);
    return;
  }
  if (reqUrl.pathname === '/api/admin/singer-configs') {
    await handleAdminSingerConfigs(req, res);
    return;
  }
  if (reqUrl.pathname === '/api/admin/singer-configs/reset-runtime') {
    await handleAdminSingerConfigsReset(req, res);
    return;
  }
  if (reqUrl.pathname === '/api/title-artist/suggest') {
    handleTitleSuggest(reqUrl, res);
    return;
  }
  if (reqUrl.pathname === '/api/title-artist/lookup' && req.method === 'POST') {
    try {
      const body = await readRequestBody(req);
      handleTitleLookup(req, res, body);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }
  if (reqUrl.pathname === '/api/dup-check' && req.method === 'POST') {
    try {
      const body = await readRequestBody(req);
      await handleDupCheck(req, res, body);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }
  if (reqUrl.pathname === '/api/dup-copy-clean' && req.method === 'POST') {
    try {
      const body = await readRequestBody(req);
      await handleDupCopyClean(req, res, body);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }
  if (reqUrl.pathname === '/internal/reload') {
    handleInternalReload(req, res);
    return;
  }

  serveStatic(reqUrl, res);
});

server.listen(PORT, () => {
  console.log(`song-search server listening on http://0.0.0.0:${PORT}`);
  console.log(`loaded songs: ${store.songs.length}, unique: ${store.totalUnique}`);
});
