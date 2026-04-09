const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');
const { URL } = require('url');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const REPORT_DIR = path.join(ROOT, 'reports');
const GROWTH_HISTORY_PATH = path.join(REPORT_DIR, 'song-growth-history.json');
const UPDATE_SONGS_META_PATH = path.join(REPORT_DIR, 'update-songs-meta.json');
const ADMIN_TOKEN_PATH = '/root/.secrets/song-search-admin-token';
const PORT = Number(process.env.PORT || 8080);
const REFRESH_LOCK_PATH = '/tmp/song-search-refresh.lock';
const REFRESH_SCRIPT_PATH = '/usr/local/bin/song-search-refresh.sh';
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
const STATS_CACHE_LIMIT = 18;
const STATS_PREVIEW_SONG_LIMIT = 3;
const STATS_PREVIEW_LINK_LIMIT = 8;
const STATS_SUMMARY_LINK_LIMIT = 20;
const STATS_PREVIEW_PERFORMANCE_LIMIT = 20;

let store = {
  songs: [],
  files: [],
  fileToAlias: {},
  sourceStats: {},
  totalUnique: 0,
  titleEntries: [],
  titleMap: new Map(),
  titleSourceMap: new Map(),
  titleArtistMap: new Map(),
  artistSongMap: new Map(),
  bvMap: new Map(),
  sourceSongMap: new Map(),
  missingArtistSongs: []
};

const statsAggregateCache = new Map();

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
  '/growth': 'song-growth.html',
  '/convert': 'converter.html',
  '/legacy': 'bili-check.html'
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

function normalizeString(str) {
  if (!str) return '';
  let s = String(str).trim();
  s = s.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
  s = s.replace(/\u3000/g, ' ');
  s = s.replace(/[～〜˜]/g, '~');
  s = s.replace(/[—–―]/g, '-');
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/…/g, '...');
  s = s.replace(/\s+/g, ' ');
  return s.toLowerCase();
}

function hasContinuousCommonStr(str1, str2, minLength = 2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  if (s1.length < minLength || s2.length < minLength) return false;
  for (let i = 0; i <= s1.length - minLength; i += 1) {
    const subStr = s1.substring(i, i + minLength);
    if (s2.includes(subStr)) return true;
  }
  return false;
}

function isSameSong(songA, songB) {
  const titleA = normalizeString(songA.title || '未知歌曲');
  const titleB = normalizeString(songB.title || '未知歌曲');
  if (titleA !== titleB) return false;

  const artistA = (songA.artist || '').trim();
  const artistB = (songB.artist || '').trim();
  const validA = isValidArtist(artistA);
  const validB = isValidArtist(artistB);

  if (!validA || !validB) return true;
  const normArtistA = normalizeString(artistA);
  const normArtistB = normalizeString(artistB);
  return normArtistA === normArtistB || hasContinuousCommonStr(artistA, artistB);
}

function getUniqueSongCount(data) {
  if (data.length === 0) return 0;
  const titleGroup = {};
  data.forEach(song => {
    const titleKey = normalizeString(song.title || '未知歌曲');
    if (!titleGroup[titleKey]) titleGroup[titleKey] = [];
    titleGroup[titleKey].push(song);
  });

  let totalUnique = 0;
  Object.values(titleGroup).forEach(group => {
    if (group.length === 1) {
      totalUnique += 1;
      return;
    }
    const uniqueSongs = [];
    group.forEach(currentSong => {
      const isDuplicate = uniqueSongs.some(savedSong => isSameSong(currentSong, savedSong));
      if (!isDuplicate) uniqueSongs.push(currentSong);
    });
    totalUnique += uniqueSongs.length;
  });
  return totalUnique;
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

function getSourceAlias(sourceFile) {
  const key = String(sourceFile || '').replace('.js', '');
  return store.fileToAlias[key] || sourceFile || '未知来源';
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

function searchItem(item, condition, fields) {
  const sourceBase = String(item.source || '').replace('.js', '');
  const sourceAlias = store.fileToAlias[sourceBase] || item.source || '未知';
  const bvid = extractBV(item.bvid || item.link || '');
  const pubdateMs = Number(item.pubdate || 0) * 1000;
  const pubdateText = pubdateMs
    ? `${formatShanghaiDate(pubdateMs)} ${formatShanghaiDateTime(pubdateMs)}`
    : '';
  const fieldTexts = {
    title: item.title || '',
    artist: item.artist || '',
    collection: item.collection || '',
    source: sourceAlias,
    bvid,
    pubdate: pubdateText
  };
  const enabledFields = Object.entries(fields)
    .filter(([, enabled]) => enabled)
    .map(([field]) => fieldTexts[field]);
  if (enabledFields.length === 0) return false;

  function checkCondition(cond) {
    switch (cond.type) {
      case 'exact':
      case 'phrase':
      case 'fuzzy':
        return enabledFields.some(text => matchesSingleCondition(text, cond));
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

  songs.forEach((song, index) => {
    const sourceFile = String(song.source || '');
    if (!sourceSongMap.has(sourceFile)) {
      sourceSongMap.set(sourceFile, []);
    }
    sourceSongMap.get(sourceFile).push(song);

    const title = String(song.title || '').trim();
    const titleKey = normalizeString(title);
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

  store = {
    songs,
    files: indexData.files || [],
    fileToAlias: indexData.fileToAlias || {},
    sourceStats: buildSourceStats(songs, indexData.files || [], indexData.fileToAlias || {}),
    totalUnique: getUniqueSongCount(songs),
    titleEntries,
    titleMap,
    titleSourceMap,
    titleArtistMap,
    artistSongMap,
    bvMap,
    sourceSongMap,
    missingArtistSongs: songs.filter(song => !isValidArtist(song.artist))
  };
  clearStatsAggregateCache();
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

function filterCandidatesBySource(items, source) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!source || source === 'all') return items.slice();
  return items.filter(item => item.source === source);
}

function getSongTitleSourceCount(songOrTitle) {
  const title = typeof songOrTitle === 'string'
    ? songOrTitle
    : (songOrTitle && songOrTitle.title) || '';
  const key = normalizeString(title);
  return store.titleSourceMap.get(key)?.size || 0;
}

function buildStatsOverview(data) {
  const artistKeys = new Set();
  const soloTitleKeys = new Set();
  let validArtistPosts = 0;

  data.forEach(song => {
    if (isValidArtist(song.artist)) {
      validArtistPosts += 1;
      artistKeys.add(normalizeString(song.artist));
    }
    const titleKey = normalizeString(song.title || '');
    if (titleKey && (store.titleSourceMap.get(titleKey)?.size || 0) === 1) {
      soloTitleKeys.add(titleKey);
    }
  });

  return {
    totalSongs: data.length,
    uniqueTracks: getUniqueSongCount(data),
    soloTracks: soloTitleKeys.size,
    artistCount: artistKeys.size,
    validArtistPosts
  };
}

function buildDupCheckResponse(mode, source, items) {
  const results = [];

  if (mode === 'bv') {
    items.forEach(item => {
      const raw = String(item?.raw || '').trim();
      const bv = extractBV(item?.bv || raw);
      if (!bv) {
        results.push({
          isNotFound: true,
          originalInput: raw,
          dupCount: 0,
          isDup: false,
          dupList: [],
          song: null
        });
        return;
      }

      const matchedSongs = store.bvMap.get(bv) || [];
      if (matchedSongs.length === 0) {
        results.push({
          isNotFound: true,
          originalInput: raw,
          dupCount: 0,
          isDup: false,
          dupList: [],
          song: null
        });
        return;
      }

      matchedSongs.forEach(song => {
        const titleKey = normalizeString(song.title || '');
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
    });
  } else {
    items.forEach(item => {
      const inputTitle = String(item?.title || '').trim();
      const inputArtist = String(item?.artist || '').trim();
      const queryType = String(item?.type || 'titleArtist');
      const originalInput = String(item?.originalLine || item?.raw || '').trim();
      const titleKey = normalizeString(inputTitle);
      const artistKey = normalizeString(inputArtist);
      let dupList = [];

      if (queryType === 'artistOnly') {
        dupList = filterCandidatesBySource(store.artistSongMap.get(artistKey) || [], source);
      } else if (titleKey) {
        if (artistKey) {
          dupList = filterCandidatesBySource(store.titleArtistMap.get(`${titleKey}|${artistKey}`) || [], source);
        } else {
          dupList = filterCandidatesBySource(store.titleMap.get(titleKey)?.songs || [], source);
        }
      }

      if (dupList.length === 0) {
        results.push({
          isNotFound: false,
          originalInput,
          song: {
            title: inputTitle || '（仅歌手查询）',
            artist: inputArtist || '',
            source: '',
            link: ''
          },
          dupList: [],
          dupCount: 0,
          isDup: false,
          isFirst: true,
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
    const exists = total - first;
    statsText = `总计 ${total} | 已收录 ${exists} | 首次 ${first} | 当前库 ${getScopedSourceLabel(source)}`;
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
    statsText
  };
}

function buildArtistSummaryByTitle(title) {
  const normalizedTitle = normalizeString(title);
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
    sourceStats: store.sourceStats
  });
}

function filterSongs(source, keyword) {
  let data = getSourceScopedSongs(source);

  const kw = normalizeString(keyword || '');
  if (kw) {
    data = data.filter(item => {
      const title = normalizeString(item.title || '');
      const artist = normalizeString(item.artist || '');
      const collection = normalizeString(item.collection || '');
      const originalArtist = normalizeString(item.originalArtist || '');
      return title.includes(kw) || artist.includes(kw) || collection.includes(kw) || originalArtist.includes(kw);
    });
  }
  return data;
}

function buildSongAggregateKey(title, artist) {
  return `${normalizeString(title || '未知歌曲')}|${normalizeString(artist || '')}`;
}

function aggregateBySong(data) {
  const map = new Map();
  data.forEach(item => {
    const artist = item.artist || '';
    const title = item.title || '未知歌曲';
    const key = buildSongAggregateKey(title, artist);
    if (!map.has(key)) {
      map.set(key, {
        key,
        title,
        artist,
        originalArtist: item.originalArtist || '',
        count: 0,
        performances: [],
        sourceSet: new Set(),
        sourceCount: 0,
        isSolo: false
      });
    }
    const entry = map.get(key);
    entry.count += 1;
    entry.sourceSet.add(item.source || '');
    entry.sourceCount = entry.sourceSet.size;
    entry.isSolo = getSongTitleSourceCount(title) === 1;
    entry.performances.push({
      link: item.link || '',
      collection: item.collection || '未知合集',
      source: getSourceAlias(item.source),
      bvid: extractBV(item.bvid || item.link || '')
    });
  });
  return Array.from(map.values())
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
        songs: new Map()
      });
    }
    const vtuberEntry = map.get(sourceKey);
    const songKey = normalizeString(item.title || '未知歌曲');
    if (!vtuberEntry.songs.has(songKey)) {
      vtuberEntry.songs.set(songKey, {
        title: item.title || '未知歌曲',
        artist: item.artist || '',
        originalArtist: item.originalArtist || '',
        count: 0,
        links: [],
        isSolo: false
      });
    }
    const songEntry = vtuberEntry.songs.get(songKey);
    songEntry.count += 1;
    songEntry.isSolo = getSongTitleSourceCount(item) === 1;
    if (item.link) {
      songEntry.links.push({
        link: item.link,
        collection: item.collection || '未知合集',
        source: vtuberName
      });
    }
  });
  const result = Array.from(map.values());
  result.forEach(v => {
    const songArr = Array.from(v.songs.values()).sort((a, b) => b.count - a.count);
    v.songs = songArr;
    v.totalCount = songArr.reduce((acc, s) => acc + s.count, 0);
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
        songs: new Map()
      });
    }
    const artistEntry = map.get(key);
    const songKey = normalizeString(item.title || '未知歌曲');
    if (!artistEntry.songs.has(songKey)) {
      artistEntry.songs.set(songKey, {
        title: item.title || '未知歌曲',
        count: 0,
        links: []
      });
    }
    const songEntry = artistEntry.songs.get(songKey);
    songEntry.count += 1;
    if (item.link) {
      songEntry.links.push({
        link: item.link,
        collection: item.collection || '未知合集',
        source: getSourceAlias(item.source)
      });
    }
  });
  const result = Array.from(map.values());
  result.forEach(v => {
    const songArr = Array.from(v.songs.values()).sort((a, b) => b.count - a.count);
    v.songs = songArr;
    v.totalCount = songArr.reduce((acc, s) => acc + s.count, 0);
    v.uniqueCount = songArr.length;
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
    overview: buildStatsOverview(data),
    groups,
    summaryText,
    hasData: data.length > 0
  };
  setStatsAggregateCache(cacheKey, payload);
  return payload;
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

function handleStatsView(reqUrl, res) {
  const tab = reqUrl.searchParams.get('tab') || 'vtuber-source';
  const source = reqUrl.searchParams.get('source') || 'all';
  const keyword = reqUrl.searchParams.get('q') || '';
  const page = Math.max(1, Number(reqUrl.searchParams.get('page') || '1'));
  const pageSize = Math.max(1, Math.min(100, Number(reqUrl.searchParams.get('pageSize') || '30')));
  const payload = getStatsAggregatePayload(tab, source, keyword);
  const groups = payload.groups || [];
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
    q: keyword
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

function handleSearch(reqUrl, res) {
  const query = reqUrl.searchParams.get('q') || '';
  const source = reqUrl.searchParams.get('source') || 'all';
  const sort = reqUrl.searchParams.get('sort') || 'pubdate_desc';
  const page = Math.max(1, Number(reqUrl.searchParams.get('page') || '1'));
  const pageSize = Math.max(1, Math.min(10000, Number(reqUrl.searchParams.get('pageSize') || '50')));
  const fieldsParam = reqUrl.searchParams.get('fields') || 'title,artist';
  const fieldsList = fieldsParam.split(',').map(item => item.trim()).filter(Boolean);
  const fields = {
    title: fieldsList.includes('title'),
    artist: fieldsList.includes('artist'),
    collection: fieldsList.includes('collection'),
    source: fieldsList.includes('source'),
    bvid: fieldsList.includes('bvid'),
    pubdate: fieldsList.includes('pubdate')
  };

  let data = getSourceScopedSongs(source).slice();
  const filteredBySourceCount = data.length;
  const filteredBySourceUnique = getUniqueSongCount(data);

  if (query && Object.values(fields).some(Boolean)) {
    const condition = parseSearchQuery(query);
    if (condition) {
      data = data.filter(item => searchItem(item, condition, fields));
    }
  }

  data = sortSongs(data, sort);

  const total = data.length;
  const totalUnique = getUniqueSongCount(data);
  const start = (page - 1) * pageSize;
  const items = data.slice(start, start + pageSize);

  sendJson(res, 200, {
    items,
    page,
    pageSize,
    sort,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    summary: {
      totalSongs: store.songs.length,
      totalUnique: store.totalUnique,
      filteredBySourceCount,
      filteredBySourceUnique,
      searchCount: total,
      searchUnique: totalUnique
    }
  });
}

function handleSongGrowth(res) {
  let collectionRows = [];
  if (fs.existsSync(GROWTH_HISTORY_PATH)) {
    try {
      collectionRows = buildDailyGrowthRows(readJson(GROWTH_HISTORY_PATH));
    } catch (error) {
      sendJson(res, 500, { error: `Failed to read growth history: ${error.message}` });
      return;
    }
  }
  const publishRows = buildPublishGrowthRows(store.songs);
  const publishViewRows = buildPublishViewRows(store.songs);
  sendJson(res, 200, {
    collectionRows,
    publishRows,
    publishViewRows,
    latest: {
      collection: collectionRows[collectionRows.length - 1] || null,
      publish: publishRows[publishRows.length - 1] || null,
      publishViews: publishViewRows[publishViewRows.length - 1] || null
    }
  });
}

function handleSiteMeta(res) {
  sendJson(res, 200, {
    updateSongsLastRun: getUpdateSongsMeta()
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
      ? summary.artistNames.some(name => normalizeString(name) === normalizeString(inputArtist))
      : false;
    return {
      ...summary,
      inputArtist,
      isArtistValid,
      originalLine: String(item?.line || '')
    };
  });

  sendJson(res, 200, { items: results });
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
    res.writeHead(200, { 'Content-Type': getMimeType(targetPath) });
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

function handleDupCheck(req, res, body) {
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
  const result = buildDupCheckResponse(mode, source, items);

  sendJson(res, 200, {
    ...result,
    elapsedMs: Date.now() - startedAt
  });
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
      handleDupCheck(req, res, body);
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
