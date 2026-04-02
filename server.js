const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const REPORT_DIR = path.join(ROOT, 'reports');
const GROWTH_HISTORY_PATH = path.join(REPORT_DIR, 'song-growth-history.json');
const PORT = Number(process.env.PORT || 8080);

let store = {
  songs: [],
  files: [],
  fileToAlias: {},
  totalUnique: 0,
  titleEntries: [],
  titleMap: new Map()
};

function isValidArtist(artist) {
  if (!artist || !artist.trim()) return false;
  return !artist.includes('来源处未提供标准格式歌手');
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
  const fieldTexts = {
    title: item.title || '',
    artist: item.artist || '',
    collection: item.collection || '',
    source: sourceAlias
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
  songs.forEach((song, index) => {
    const title = String(song.title || '').trim();
    if (!title) return;
    const key = normalizeString(title);
    if (!titleMap.has(key)) {
      titleMap.set(key, {
        title,
        songs: [],
        firstSeen: index
      });
    }
    titleMap.get(key).songs.push(song);
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
    totalUnique: getUniqueSongCount(songs),
    titleEntries,
    titleMap
  };
}

function buildArtistSummaryByTitle(title) {
  const normalizedTitle = normalizeString(title);
  const entry = store.titleMap.get(normalizedTitle);
  const matchedSongs = entry ? entry.songs : [];
  const artistMap = new Map();

  matchedSongs.forEach((song, index) => {
    const artistName = (song.artist || '未知歌手').trim();
    const sourceAlias = store.fileToAlias[String(song.source || '').replace('.js', '')] || song.source || '未知来源';
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
    totalSongs: store.songs.length,
    totalUnique: store.totalUnique
  });
}

function handleSources(res) {
  const sources = store.files.map(fileName => {
    const key = fileName.replace('.js', '');
    return {
      file: fileName,
      alias: store.fileToAlias[key] || fileName
    };
  });
  sendJson(res, 200, { sources });
}

function handleAllSongs(reqUrl, res) {
  const source = reqUrl.searchParams.get('source') || 'all';
  let data = store.songs.slice();
  if (source === 'missing-artist') {
    data = data.filter(item => !isValidArtist(item.artist));
  } else if (source !== 'all') {
    data = data.filter(item => item.source === source);
  }

  sendJson(res, 200, {
    items: data,
    total: data.length,
    totalUnique: getUniqueSongCount(data),
    files: store.files,
    fileToAlias: store.fileToAlias
  });
}

function filterSongs(source, keyword) {
  let data = store.songs.slice();
  if (source === 'missing-artist') {
    data = data.filter(item => !isValidArtist(item.artist));
  } else if (source && source !== 'all') {
    data = data.filter(item => item.source === source);
  }

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

function aggregateBySong(data) {
  const map = new Map();
  data.forEach(item => {
    const artist = item.artist || '';
    const title = item.title || '未知歌曲';
    const key = `${normalizeString(title)}|${normalizeString(artist)}`;
    if (!map.has(key)) {
      map.set(key, {
        title,
        artist,
        originalArtist: item.originalArtist || '',
        count: 0,
        performances: []
      });
    }
    const entry = map.get(key);
    entry.count += 1;
    entry.performances.push({
      link: item.link || '',
      collection: item.collection || '未知合集',
      source: store.fileToAlias[String(item.source || '').replace('.js', '')] || item.source || ''
    });
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function aggregateByVtuberSource(data) {
  const map = new Map();
  data.forEach(item => {
    const sourceFile = item.source || '未知来源';
    const sourceKey = sourceFile.replace('.js', '');
    const vtuberName = store.fileToAlias[sourceKey] || sourceKey;
    if (!map.has(sourceKey)) {
      map.set(sourceKey, {
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
        links: []
      });
    }
    const songEntry = vtuberEntry.songs.get(songKey);
    songEntry.count += 1;
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
        source: store.fileToAlias[String(item.source || '').replace('.js', '')] || item.source || ''
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

function handleStatsView(reqUrl, res) {
  const tab = reqUrl.searchParams.get('tab') || 'vtuber-source';
  const source = reqUrl.searchParams.get('source') || 'all';
  const keyword = reqUrl.searchParams.get('q') || '';
  const page = Math.max(1, Number(reqUrl.searchParams.get('page') || '1'));
  const pageSize = Math.max(1, Math.min(100, Number(reqUrl.searchParams.get('pageSize') || '30')));

  const data = filterSongs(source, keyword);
  let groups = [];
  let summaryText = '';

  if (tab === 'rank') {
    groups = aggregateBySong(data);
    summaryText = `📊 共统计 ${groups.length} 首不同的“歌曲+歌手”组合`;
  } else if (tab === 'artist') {
    groups = aggregateByArtist(data);
    summaryText = `🎙️ 共收录 ${groups.length} 位歌手的歌单`;
  } else {
    groups = aggregateByVtuberSource(data);
    summaryText = `🎤 共收录 ${groups.length} 位VTuber的合集歌单`;
  }

  const total = groups.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const items = groups.slice(start, start + pageSize);

  sendJson(res, 200, {
    tab,
    items,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    summaryText,
    hasData: data.length > 0,
    source,
    q: keyword
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
    source: fieldsList.includes('source')
  };

  let data = store.songs.slice();
  if (source === 'missing-artist') {
    data = data.filter(item => !isValidArtist(item.artist));
  } else if (source !== 'all') {
    data = data.filter(item => item.source === source);
  }
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
  let rows = [];
  if (fs.existsSync(GROWTH_HISTORY_PATH)) {
    try {
      rows = buildDailyGrowthRows(readJson(GROWTH_HISTORY_PATH));
    } catch (error) {
      sendJson(res, 500, { error: `Failed to read growth history: ${error.message}` });
      return;
    }
  }
  sendJson(res, 200, { rows });
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
  if (pathname === '/') pathname = '/index.html';
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
  if (reqUrl.pathname === '/api/song-growth') {
    handleSongGrowth(res);
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
