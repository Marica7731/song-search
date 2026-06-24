const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const REPORT_DIR = path.join(ROOT, 'reports');
const HISTORY_PATH = path.join(REPORT_DIR, 'song-growth-history.json');
const README_PATH = path.join(ROOT, 'README.md');
const {
  normalizeSongIdentityKey,
  isSameSong
} = require('../artist-match');

const SH_TZ = 'Asia/Shanghai';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatShanghaiDate(ts) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: SH_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return dtf.format(new Date(ts));
}

function formatShanghaiDateTime(ts) {
  const dtf = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SH_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return dtf.format(new Date(ts));
}

function loadSongCount() {
  return loadAllSongs().length;
}

function isValidArtist(artist) {
  if (!artist || !String(artist).trim()) return false;
  return !String(artist).includes('来源处未提供标准格式歌手');
}

function getUniqueSongCount(songs) {
  const titleGroup = new Map();
  (Array.isArray(songs) ? songs : []).forEach(song => {
    const titleKey = normalizeSongIdentityKey(song);
    if (!titleGroup.has(titleKey)) titleGroup.set(titleKey, []);
    titleGroup.get(titleKey).push(song);
  });

  let totalUnique = 0;
  titleGroup.forEach(group => {
    if (group.length === 1) {
      totalUnique += 1;
      return;
    }
    const uniqueSongs = [];
    group.forEach(currentSong => {
      const isDuplicate = uniqueSongs.some(savedSong => isSameSong(currentSong, savedSong, isValidArtist));
      if (!isDuplicate) uniqueSongs.push(currentSong);
    });
    totalUnique += uniqueSongs.length;
  });
  return totalUnique;
}

function loadAllSongs() {
  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const files = indexData.files || [];
  const songs = [];

  files.forEach(fileName => {
    const p = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(p)) return;
    const jsContent = fs.readFileSync(p, 'utf8');
    const fakeWindow = { SONG_DATA: [] };
    try {
      const executeCode = new Function('window', jsContent);
      executeCode(fakeWindow);
      if (Array.isArray(fakeWindow.SONG_DATA)) {
        songs.push(...fakeWindow.SONG_DATA);
      }
    } catch (e) {
      console.warn(`skip invalid data file: ${fileName}, err=${e.message}`);
    }
  });

  return songs;
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_PATH)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf8');
}

function buildDailyRows(history) {
  const sorted = [...history].sort((a, b) => a.ts - b.ts);
  const byDate = new Map();
  sorted.forEach(item => {
    const date = formatShanghaiDate(item.ts);
    byDate.set(date, item);
  });

  const rows = Array.from(byDate.entries())
    .map(([date, item]) => ({
      date,
      total: item.total,
      uniqueTotal: Number.isFinite(Number(item.uniqueTotal)) ? Number(item.uniqueTotal) : null,
      ts: item.ts
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return rows.map((row, i) => {
    const prevTotal = i > 0 ? rows[i - 1].total : row.total;
    const prevUniqueTotal = i > 0 ? rows[i - 1].uniqueTotal : row.uniqueTotal;
    const delta = row.total - prevTotal;
    const uniqueDelta = row.uniqueTotal == null || prevUniqueTotal == null
      ? null
      : row.uniqueTotal - prevUniqueTotal;
    return { ...row, delta, uniqueDelta };
  });
}

function buildPublishDailyRows(songs) {
  const byDate = new Map();
  songs.forEach(song => {
    const pubdate = Number(song.pubdate || 0);
    if (!pubdate) return;
    const date = formatShanghaiDate(pubdate * 1000);
    const current = byDate.get(date) || { date, ts: pubdate * 1000, delta: 0 };
    current.delta += 1;
    if (pubdate * 1000 > current.ts) current.ts = pubdate * 1000;
    byDate.set(date, current);
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

function deltaHtml(delta) {
  if (delta > 0) return `<span style="color:#28a745;font-weight:600;">+${delta}</span>`;
  if (delta < 0) return `<span style="color:#dc3545;font-weight:600;">${delta}</span>`;
  return `<span style="color:#6c757d;">0</span>`;
}

function updateReadmeSection(collectionRows, publishRows, latestTotal, latestUniqueTotal, latestTs) {
  const markerStart = '<!-- SONG_GROWTH_START -->';
  const markerEnd = '<!-- SONG_GROWTH_END -->';
  const latestCollection = collectionRows[collectionRows.length - 1] || { delta: 0 };
  const latestPublish = publishRows[publishRows.length - 1] || { delta: 0 };
  const tableRows = collectionRows
    .slice(-14)
    .reverse()
    .map(row => `| ${row.date} | ${row.total} | ${row.delta > 0 ? `<span style="color:#28a745;">+${row.delta}</span>` : (row.delta < 0 ? `<span style="color:#dc3545;">${row.delta}</span>` : '0')} |`)
    .join('\n');

  const block = `${markerStart}
## 歌曲总量日报

- 最新总曲数：**${latestTotal}**
- 最新去重歌曲数：**${latestUniqueTotal}**
- 更新时间（上海时间）：${formatShanghaiDateTime(latestTs)}
- 最新库收录日增：**${latestCollection.delta > 0 ? `+${latestCollection.delta}` : latestCollection.delta || 0}**
- 最新按投稿时间日增：**${latestPublish.delta > 0 ? `+${latestPublish.delta}` : latestPublish.delta || 0}**
- 完整页面：[\`song-growth.html\`](./song-growth.html)

口径说明：
- \`库收录增长\`：按你的站点实际抓取入库时间统计
- \`按投稿时间增长\`：按歌曲 \`pubdate\` 统计真实投稿时间增长

库收录增长近 14 天：

| 日期 | 总曲数 | 较前一日增量 |
|---|---:|---:|
${tableRows}
${markerEnd}`;

  let readme = fs.readFileSync(README_PATH, 'utf8');
  if (readme.includes(markerStart) && readme.includes(markerEnd)) {
    const reg = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`, 'm');
    readme = readme.replace(reg, block);
  } else {
    readme += `\n\n${block}\n`;
  }
  fs.writeFileSync(README_PATH, readme, 'utf8');
}

function main() {
  ensureDir(REPORT_DIR);
  const songs = loadAllSongs();
  const total = songs.length;
  const uniqueTotal = getUniqueSongCount(songs);
  const now = Date.now();

  const history = loadHistory();
  history.push({ ts: now, total, uniqueTotal });
  saveHistory(history);

  const collectionRows = buildDailyRows(history);
  const publishRows = buildPublishDailyRows(songs);
  updateReadmeSection(collectionRows, publishRows, total, uniqueTotal, now);

  console.log(`song total=${total}, unique=${uniqueTotal}, history=${history.length}`);
}

main();
