const fs = require('fs');
const path = require('path');
const {
  normalizeString,
  normalizeSongIdentityKey
} = require('../artist-match');

const ROOT = path.join(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'docs', `stats-artist-fix-candidates-${new Date().toISOString().slice(0, 10)}.md`);
const DEFAULT_SOURCE_URL = 'https://www.culua.com/api/all-songs';
const EDIT_URL_PREFIX = 'https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=';

const TITLE_FIX_RULES = [
  {
    name: 'ここでキスして -> ここでキスして。',
    match: song => normalizeString(song.artist) === '椎名林檎' && String(song.title || '').trim() === 'ここでキスして',
    fixTitle: 'ここでキスして。',
    fixArtist: '椎名林檎'
  },
  {
    name: '噓月 -> 嘘月',
    match: song => normalizeString(song.artist) === 'ヨルシカ' && String(song.title || '').trim() === '噓月',
    fixTitle: '嘘月',
    fixArtist: 'ヨルシカ'
  },
  {
    name: 'だから僕は音楽を辞めた',
    match: song => normalizeString(song.artist) === 'ヨルシカ'
      && ['だから僕は音楽辞めた', 'だから僕は音楽をやめた'].includes(String(song.title || '').trim()),
    fixTitle: 'だから僕は音楽を辞めた',
    fixArtist: 'ヨルシカ'
  },
  {
    name: '都落ち（落京） -> 都落ち',
    match: song => normalizeString(song.artist) === 'ヨルシカ' && String(song.title || '').trim() === '都落ち（落京）',
    fixTitle: '都落ち',
    fixArtist: 'ヨルシカ'
  },
  {
    name: '火星人（お試し） -> 火星人',
    match: song => normalizeString(song.artist) === 'ヨルシカ' && String(song.title || '').trim() === '火星人（お試し）',
    fixTitle: '火星人',
    fixArtist: 'ヨルシカ'
  },
  {
    name: '晴れ -> 晴る',
    match: song => normalizeString(song.artist) === 'ヨルシカ' && String(song.title || '').trim() === '晴れ',
    fixTitle: '晴る',
    fixArtist: 'ヨルシカ',
    note: '需人工听音或核对分 P；可能是 ただ君に晴れ 的简称。'
  }
];

function parseArgs(argv) {
  const options = {
    source: DEFAULT_SOURCE_URL,
    output: OUTPUT_PATH,
    maxDuplicateGroups: 80,
    maxVariantGroups: 120
  };
  argv.forEach(arg => {
    if (arg.startsWith('--source=')) options.source = arg.slice('--source='.length);
    if (arg.startsWith('--output=')) options.output = path.resolve(arg.slice('--output='.length));
    if (arg.startsWith('--max-duplicate-groups=')) {
      const value = Number(arg.slice('--max-duplicate-groups='.length));
      if (Number.isFinite(value) && value > 0) options.maxDuplicateGroups = value;
    }
    if (arg.startsWith('--max-variant-groups=')) {
      const value = Number(arg.slice('--max-variant-groups='.length));
      if (Number.isFinite(value) && value > 0) options.maxVariantGroups = value;
    }
  });
  return options;
}

function extractPage(song) {
  const direct = Number(song.page || 0);
  if (direct > 0) return direct;
  const match = String(song.link || '').match(/[?&]p=(\d+)/i);
  return match ? Number(match[1]) : 1;
}

function songBvid(song) {
  const direct = String(song.bvid || '').trim();
  if (direct) return direct;
  const match = String(song.link || '').match(/\/video\/(BV[0-9A-Za-z]+)/);
  return match ? match[1] : '';
}

function editUrl(bvid) {
  return `${EDIT_URL_PREFIX}${encodeURIComponent(bvid)}`;
}

function formatRow(song, override) {
  const page = extractPage(song);
  const title = override?.title || song.title || '未知歌曲';
  const artist = override?.artist || song.artist || '';
  return `${String(page).padStart(2, '0')}. ${title}${artist ? ` - ${artist}` : ''}`;
}

function findFix(song) {
  const rule = TITLE_FIX_RULES.find(item => item.match(song));
  if (!rule) return null;
  return {
    rule: rule.name,
    note: rule.note || '',
    suggested: formatRow(song, { title: rule.fixTitle, artist: rule.fixArtist })
  };
}

async function loadSongs(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(`${source}${source.includes('?') ? '&' : '?'}t=${Date.now()}`, {
      headers: { 'cache-control': 'no-cache' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${source}`);
    const payload = await response.json();
    return Array.isArray(payload.items) ? payload.items : [];
  }
  const text = fs.readFileSync(source, 'utf8');
  const payload = JSON.parse(text);
  return Array.isArray(payload.items) ? payload.items : payload;
}

async function loadAliasMap(source) {
  if (!/^https?:\/\//i.test(source)) return {};
  const url = new URL(source);
  url.pathname = '/api/bootstrap';
  url.search = `?t=${Date.now()}`;
  const response = await fetch(url.toString(), {
    headers: { 'cache-control': 'no-cache' }
  });
  if (!response.ok) return {};
  const payload = await response.json();
  return payload.fileToAlias || {};
}

function sourceAlias(song, aliasMap) {
  const key = String(song.source || '').replace(/\.js$/, '');
  return aliasMap[key] || song.sourceAlias || song.source || '';
}

function buildFixCandidates(songs) {
  return songs
    .map(song => ({ song, fix: findFix(song) }))
    .filter(item => item.fix);
}

function buildDuplicateGroups(songs, limit) {
  const map = new Map();
  songs.forEach(song => {
    const bvid = songBvid(song);
    if (!bvid) return;
    const key = `${bvid}|${normalizeSongIdentityKey(song)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(song);
  });
  return Array.from(map.values())
    .filter(group => new Set(group.map(extractPage).filter(Boolean)).size > 1)
    .sort((a, b) => b.length - a.length || String(songBvid(a[0])).localeCompare(songBvid(b[0])))
    .slice(0, limit);
}

function toHiragana(value) {
  return String(value || '').replace(/[\u30A1-\u30F6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

function looseTitleVariantKey(title) {
  return toHiragana(normalizeString(title || ''))
    .replace(/噓/g, '嘘')
    .replace(/[＃#♯]/g, '#')
    .replace(/[（(【［\[].*?[）)】］\]]/g, '')
    .replace(/\s+feat\s*\.?\s+.*$/i, '')
    .replace(/\s+(?:short|movie|piano|acoustic|arrange)\s*ver\.?$/i, '')
    .replace(/[!！?？。．・･,，、:：;；'"“”‘’`´~〜～\-ー_\s]/g, '');
}

function classifyVariantGroup(titles) {
  const joined = titles.join(' / ');
  if (/[（(].*(?:short|movie|piano|acoustic|arrange|ver\.?|remix|solo|cv|声優|アレンジ).*?[）)]/i.test(joined)
    || /\b(?:short|movie|piano|acoustic|arrange|remix|solo|ver\.?)\b/i.test(joined)) {
    return '版本/编曲/声优风险，需人工确认';
  }
  if (/[噓嘘]/.test(joined)) return '形近字/异体字候选';
  if (/[のノ]/.test(joined)) return '假名表记差异，建议归一化不建议改稿';
  if (/[＃#♯]/.test(joined)) return '符号表记差异，建议归一化';
  return '标题表记差异，需人工确认';
}

function buildVariantGroups(songs, limit) {
  const map = new Map();
  songs.forEach(song => {
    const artist = normalizeString(song.artist || '');
    const looseTitle = looseTitleVariantKey(song.title || '');
    if (!artist || !looseTitle) return;
    const key = `${artist}|${looseTitle}`;
    if (!map.has(key)) {
      map.set(key, {
        artist: song.artist || '',
        looseTitle,
        songs: [],
        identities: new Map(),
        titles: new Set()
      });
    }
    const group = map.get(key);
    const identity = normalizeSongIdentityKey(song);
    group.songs.push(song);
    group.titles.add(song.title || '');
    if (!group.identities.has(identity)) group.identities.set(identity, []);
    group.identities.get(identity).push(song);
  });

  return Array.from(map.values())
    .filter(group => group.identities.size > 1)
    .map(group => ({
      ...group,
      titles: Array.from(group.titles).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ja')),
      identityCount: group.identities.size,
      count: group.songs.length,
      category: classifyVariantGroup(Array.from(group.titles))
    }))
    .sort((a, b) => b.count - a.count || b.identityCount - a.identityCount || String(a.artist).localeCompare(String(b.artist), 'ja'))
    .slice(0, limit);
}

function groupSongsByBvid(songs) {
  const map = new Map();
  songs.forEach(song => {
    const bvid = songBvid(song);
    if (!bvid) return;
    if (!map.has(bvid)) map.set(bvid, []);
    map.get(bvid).push(song);
  });
  map.forEach(list => list.sort((a, b) => extractPage(a) - extractPage(b)));
  return map;
}

function renderFullListForBvid(bvid, songs, fixByBvidPage) {
  return songs.map(song => {
    const fixed = fixByBvidPage.get(`${bvid}:${extractPage(song)}`);
    if (!fixed) return formatRow(song);
    return fixed.suggested;
  }).join('\n');
}

function renderMarkdown(songs, fixes, duplicateGroups, variantGroups, source, aliasMap) {
  const byBvid = groupSongsByBvid(songs);
  const fixByBvidPage = new Map();
  fixes.forEach(({ song, fix }) => {
    fixByBvidPage.set(`${songBvid(song)}:${extractPage(song)}`, fix);
  });

  const lines = [];
  lines.push(`# /stats 歌手聚合页错名与重复候选 ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push('## 命名规则');
  lines.push('');
  lines.push('- 分 P 标题统一使用：`序号. 歌名 - 歌手`');
  lines.push('- 编辑入口格式：`https://member.bilibili.com/platform/upload/video/frame/?type=edit&version=new&bvid=<BV>`');
  lines.push('- 本文件由 `node scripts/scan-stats-artist-issues.js` 生成，默认读取线上 `/api/all-songs`。');
  lines.push('');
  lines.push('## 数据源');
  lines.push('');
  lines.push(`- source: \`${source}\``);
  lines.push(`- songs: ${songs.length}`);
  lines.push(`- high confidence fixes: ${fixes.length}`);
  lines.push(`- duplicate groups listed: ${duplicateGroups.length}`);
  lines.push(`- variant groups listed: ${variantGroups.length}`);
  lines.push('');
  lines.push('## 高置信待编辑');
  lines.push('');
  lines.push('| BV | P | 来源 | 当前 | 建议修改 | 编辑链接 |');
  lines.push('|---|---:|---|---|---|---|');
  fixes.forEach(({ song, fix }) => {
    const bvid = songBvid(song);
    const page = extractPage(song);
    const current = formatRow(song);
    const sourceName = sourceAlias(song, aliasMap);
    lines.push(`| \`${bvid}\` | ${page} | ${sourceName} | \`${current}\` | \`${fix.suggested}\`${fix.note ? `<br>${fix.note}` : ''} | ${editUrl(bvid)} |`);
  });
  lines.push('');

  lines.push('## 同一 BV 内同歌名歌手多 P 候选');
  lines.push('');
  lines.push('这些不一定都是错误，耐久回可能重复演唱；但它们最容易在歌手聚合页里暴露错切或错名。');
  lines.push('');
  lines.push('| BV | 页码 | 歌曲 | 来源 | 编辑链接 |');
  lines.push('|---|---|---|---|---|');
  duplicateGroups.forEach(group => {
    const first = group[0];
    const bvid = songBvid(first);
    const pages = Array.from(new Set(group.map(extractPage).filter(Boolean))).sort((a, b) => a - b).join(', ');
    const title = `${first.title || ''}${first.artist ? ` - ${first.artist}` : ''}`;
    const sourceName = sourceAlias(first, aliasMap);
    lines.push(`| \`${bvid}\` | ${pages} | \`${title}\` | ${sourceName} | ${editUrl(bvid)} |`);
  });
  lines.push('');

  lines.push('## 同歌手标题表记变体候选');
  lines.push('');
  lines.push('这些只用于发现可能需要补归一化或人工确认的候选，不等同于需要编辑 B 站标题。');
  lines.push('');
  lines.push('| 歌手 | 分类 | 标题变体 | 计数 | 示例编辑链接 |');
  lines.push('|---|---|---|---:|---|');
  variantGroups.forEach(group => {
    const sample = group.songs[0] || {};
    const bvid = songBvid(sample);
    const titles = group.titles.slice(0, 8).map(title => `\`${title}\``).join('<br>');
    const more = group.titles.length > 8 ? `<br>... 另 ${group.titles.length - 8} 个` : '';
    lines.push(`| ${group.artist || ''} | ${group.category} | ${titles}${more} | ${group.count} | ${bvid ? editUrl(bvid) : ''} |`);
  });
  lines.push('');

  lines.push('## 整稿可复制歌单');
  lines.push('');
  Array.from(new Set(fixes.map(({ song }) => songBvid(song)))).forEach(bvid => {
    const list = byBvid.get(bvid) || [];
    if (!list.length) return;
    lines.push(`### ${bvid}`);
    lines.push('');
    lines.push(`编辑链接：${editUrl(bvid)}`);
    lines.push('');
    lines.push('```text');
    lines.push(renderFullListForBvid(bvid, list, fixByBvidPage));
    lines.push('```');
    lines.push('');
  });

  return `${lines.join('\n').trim()}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const songs = await loadSongs(options.source);
  const aliasMap = await loadAliasMap(options.source);
  const fixes = buildFixCandidates(songs);
  const duplicates = buildDuplicateGroups(songs, options.maxDuplicateGroups);
  const variants = buildVariantGroups(songs, options.maxVariantGroups);
  const markdown = renderMarkdown(songs, fixes, duplicates, variants, options.source, aliasMap);
  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, markdown, 'utf8');
  console.log(JSON.stringify({
    output: options.output,
    songs: songs.length,
    fixes: fixes.length,
    duplicateGroups: duplicates.length,
    variantGroups: variants.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
