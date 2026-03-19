const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const REPORT_DIR = path.join(ROOT, 'reports');
const HISTORY_PATH = path.join(REPORT_DIR, 'song-growth-history.json');
const PAGE_PATH = path.join(ROOT, 'song-growth.html');
const README_PATH = path.join(ROOT, 'README.md');

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
  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const files = indexData.files || [];
  let total = 0;

  files.forEach(fileName => {
    const p = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(p)) return;
    const jsContent = fs.readFileSync(p, 'utf8');
    const fakeWindow = { SONG_DATA: [] };
    try {
      const executeCode = new Function('window', jsContent);
      executeCode(fakeWindow);
      total += Array.isArray(fakeWindow.SONG_DATA) ? fakeWindow.SONG_DATA.length : 0;
    } catch (e) {
      console.warn(`skip invalid data file: ${fileName}, err=${e.message}`);
    }
  });

  return total;
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
    .map(([date, item]) => ({ date, total: item.total, ts: item.ts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return rows.map((row, i) => {
    const prevTotal = i > 0 ? rows[i - 1].total : row.total;
    const delta = row.total - prevTotal;
    return { ...row, delta };
  });
}

function deltaHtml(delta) {
  if (delta > 0) return `<span style="color:#28a745;font-weight:600;">+${delta}</span>`;
  if (delta < 0) return `<span style="color:#dc3545;font-weight:600;">${delta}</span>`;
  return `<span style="color:#6c757d;">0</span>`;
}

function generatePage(dailyRows, latestTotal, latestTs) {
  const rowsHtml = dailyRows
    .slice(-60)
    .reverse()
    .map(row => `<tr><td>${row.date}</td><td>${row.total}</td><td>${deltaHtml(row.delta)}</td></tr>`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>歌曲总量日报</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f6f7f9;padding:20px}
    .main{max-width:980px;margin:0 auto;background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,.06)}
    h1{margin-bottom:8px;color:#2c3e50}
    .sub{margin-bottom:18px;color:#6c757d;font-size:14px}
    .nav{margin-bottom:18px}
    .nav a{color:#00a1d6;text-decoration:none}
    .nav a:hover{text-decoration:underline}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #e9ecef;padding:10px 12px;text-align:left}
    th{background:#f8f9fa}
  </style>
</head>
<body>
  <div class="main">
    <h1>歌曲总量日报</h1>
    <div class="sub">最新总曲数：<strong>${latestTotal}</strong>（更新时间：${formatShanghaiDateTime(latestTs)}，上海时间）</div>
    <div class="nav"><a href="index.html">返回首页</a></div>
    <table>
      <thead><tr><th>日期</th><th>总曲数</th><th>较前一日增量</th></tr></thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(PAGE_PATH, html, 'utf8');
}

function updateReadmeSection(dailyRows, latestTotal, latestTs) {
  const markerStart = '<!-- SONG_GROWTH_START -->';
  const markerEnd = '<!-- SONG_GROWTH_END -->';
  const tableRows = dailyRows
    .slice(-14)
    .reverse()
    .map(row => `| ${row.date} | ${row.total} | ${row.delta > 0 ? `<span style="color:#28a745;">+${row.delta}</span>` : (row.delta < 0 ? `<span style="color:#dc3545;">${row.delta}</span>` : '0')} |`)
    .join('\n');

  const block = `${markerStart}
## 歌曲总量日报

- 最新总曲数：**${latestTotal}**
- 更新时间（上海时间）：${formatShanghaiDateTime(latestTs)}
- 完整页面：[\`song-growth.html\`](./song-growth.html)

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
  const total = loadSongCount();
  const now = Date.now();

  const history = loadHistory();
  history.push({ ts: now, total });
  saveHistory(history);

  const dailyRows = buildDailyRows(history);
  generatePage(dailyRows, total, now);
  updateReadmeSection(dailyRows, total, now);

  console.log(`song total=${total}, history=${history.length}`);
}

main();
