const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RULES_PATH = path.join(__dirname, 'vocaloid-rules.json');
const DEFAULT_BASE_URL = 'https://www.culua.com';
const DEFAULT_OUT_DIR = path.join(ROOT, 'vocaloid-songs-latest');
const ONE_DAY_MS = 86400000;

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.CULUA_BASE_URL || DEFAULT_BASE_URL,
    outDir: process.env.VOCALOID_OUT_DIR || DEFAULT_OUT_DIR,
    pageSize: Number(process.env.VOCALOID_PAGE_SIZE || 10000),
    source: process.env.VOCALOID_SOURCE || 'remote',
    date: process.env.VOCALOID_SNAPSHOT_DATE || '',
    dryRun: false
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--base-url') {
      args.baseUrl = argv[++i];
    } else if (arg === '--out-dir') {
      args.outDir = path.resolve(ROOT, argv[++i]);
    } else if (arg === '--page-size') {
      args.pageSize = Number(argv[++i]);
    } else if (arg === '--source') {
      args.source = String(argv[++i] || '').trim();
    } else if (arg === '--date') {
      args.date = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!Number.isFinite(args.pageSize) || args.pageSize < 1 || args.pageSize > 10000) {
    throw new Error('--page-size must be between 1 and 10000');
  }
  args.baseUrl = String(args.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  if (!['remote', 'local'].includes(args.source)) {
    throw new Error('--source must be remote or local');
  }
  return args;
}

function readRules() {
  return JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase();
}

function normalizeCompact(value) {
  return normalizeText(value)
    .replace(/[\s\u3000"'`´“”‘’［］\[\]（）(){}【】<>《》〈〉「」『』:：;；,，.。!！?？~〜～_/／\\|・･★☆◎♪♫♬◆◇■□●○▲△※…\-‐‑–—―]+/g, '');
}

function normalizeTitle(value) {
  return normalizeCompact(value)
    .replace(/[ーｰ]/g, '')
    .replace(/[ぁぃぅぇぉゃゅょっ]/g, ch => ({
      'ぁ': 'あ',
      'ぃ': 'い',
      'ぅ': 'う',
      'ぇ': 'え',
      'ぉ': 'お',
      'ゃ': 'や',
      'ゅ': 'ゆ',
      'ょ': 'よ',
      'っ': 'つ'
    }[ch] || ch));
}

function isAsciiTerm(term) {
  return /^[a-z0-9][a-z0-9 ._+\-']*$/i.test(String(term || '').trim());
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasTerm(text, term) {
  const rawTerm = String(term || '').trim();
  if (!rawTerm) return false;
  const rawText = String(text || '').normalize('NFKC');
  if (isAsciiTerm(rawTerm)) {
    const pattern = new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(rawTerm.normalize('NFKC'))}(?=$|[^A-Za-z0-9])`, 'i');
    return pattern.test(rawText);
  }
  return normalizeCompact(rawText).includes(normalizeCompact(rawTerm));
}

function startsWithArtistTerm(artist, term) {
  const rawArtist = String(artist || '').trim().normalize('NFKC');
  const rawTerm = String(term || '').trim().normalize('NFKC');
  if (!rawArtist || !rawTerm) return false;
  if (isAsciiTerm(rawTerm)) {
    const pattern = new RegExp(`^\\s*${escapeRegExp(rawTerm)}(?=$|[^A-Za-z0-9])`, 'i');
    return pattern.test(rawArtist);
  }
  const artistKey = normalizeCompact(rawArtist);
  const termKey = normalizeCompact(rawTerm);
  return artistKey === termKey || artistKey.startsWith(termKey);
}

function formatShanghaiDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const get = type => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function formatShanghaiDateTimeFromSeconds(value) {
  const seconds = Number(value || 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(new Date(seconds * 1000));
  const get = type => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

function buildRuleIndex(rules) {
  const knownTitleMap = new Map();
  for (const title of rules.knownTitles || []) {
    const key = normalizeTitle(title);
    if (key) knownTitleMap.set(key, title);
  }
  const titleNeedsEvidence = new Set((rules.titleRequiresAdditionalEvidence || []).map(normalizeTitle));
  const titleNeedsVoicebank = new Set((rules.titleRequiresVoicebankEvidence || []).map(normalizeTitle));
  const titleBlacklist = new Set((rules.titleBlacklist || []).map(normalizeTitle));
  return { knownTitleMap, titleNeedsEvidence, titleNeedsVoicebank, titleBlacklist };
}

function classifySong(song, rules, ruleIndex) {
  const title = String(song.title || '');
  const artist = String(song.artist || '');
  const directText = `${title}\n${artist}`;
  const voiceReasons = [];
  const producerReasons = [];
  const titleReasons = [];
  const pendingTitleReasons = [];

  for (const group of rules.voicebanks || []) {
    if ((group.aliases || []).some(alias => hasTerm(directText, alias))) {
      voiceReasons.push(`音源/术力口词:${group.label}`);
    }
  }

  for (const producer of rules.producers || []) {
    if ((producer.aliases || []).some(alias => startsWithArtistTerm(artist, alias))) {
      producerReasons.push(`P主/术力口作者:${producer.label}`);
    }
  }

  const titleKey = normalizeTitle(title);
  const knownTitle = ruleIndex.knownTitleMap.get(titleKey);
  if (knownTitle && !ruleIndex.titleBlacklist.has(titleKey)) {
    const titleReason = `已知术力口曲名:${knownTitle}`;
    if (ruleIndex.titleNeedsEvidence.has(titleKey) && voiceReasons.length === 0 && producerReasons.length === 0) {
      pendingTitleReasons.push(titleReason);
    } else {
      titleReasons.push(titleReason);
    }
  }

  const auditReasons = [];
  let reasons = voiceReasons.concat(producerReasons, titleReasons);
  if (ruleIndex.titleNeedsVoicebank.has(titleKey) && voiceReasons.length === 0) {
    if (producerReasons.length || titleReasons.length || pendingTitleReasons.length) {
      auditReasons.push('高重名标题需要显式音源证据');
    }
    reasons = [];
  }

  if (pendingTitleReasons.length && reasons.length > 0) {
    reasons = reasons.concat(pendingTitleReasons);
  }

  const uniqueReasons = Array.from(new Set(reasons));
  if (pendingTitleReasons.length && uniqueReasons.length === 0) {
    auditReasons.push(`曲名需额外证据:${pendingTitleReasons.map(reason => reason.replace('已知术力口曲名:', '')).join('/')}`);
  }
  const collectionText = `${song.collection || ''}\n${song.videoTitle || ''}`;
  if (uniqueReasons.length === 0 && (rules.collectionAuditKeywords || []).some(keyword => hasTerm(collectionText, keyword))) {
    auditReasons.push('合集/视频标题含术力口关键词但歌名/歌手无直接证据');
  }

  return {
    isVocaloid: uniqueReasons.length > 0,
    reasons: uniqueReasons,
    pendingTitleReasons,
    auditReasons,
    checkedFields: ['title', 'artist']
  };
}

function withDerivedFields(song, check) {
  const normalized = song.normalizedTitle || normalizeTitle(song.title);
  const pubdateFormatted = song.pubdateFormatted || formatShanghaiDateTimeFromSeconds(song.pubdate);
  const ctimeFormatted = song.ctimeFormatted || formatShanghaiDateTimeFromSeconds(song.ctime);
  return {
    ...song,
    pubdateFormatted,
    ctimeFormatted,
    normalizedTitle: normalized,
    vocaloidReasons: check.reasons.join(' | '),
    vocaloidCheck: {
      isVocaloid: true,
      reasons: check.reasons,
      mode: 'direct',
      checkedFields: check.checkedFields
    }
  };
}

async function fetchJson(url, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function fetchAllSongs(baseUrl, pageSize) {
  const fetchStartedAt = new Date();
  const fields = 'title,artist,collection,source,bvid,pubdate';
  const firstUrl = `${baseUrl}/api/search?page=1&pageSize=${pageSize}&sort=pubdate_desc&fields=${encodeURIComponent(fields)}`;
  const first = await fetchJson(firstUrl);
  const total = Number(first.total || first.summary?.totalSongs || 0);
  const totalUnique = Number(first.summary?.totalUnique || first.summary?.searchUnique || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = Array.isArray(first.items) ? first.items.slice() : [];
  for (let page = 2; page <= totalPages; page += 1) {
    const url = `${baseUrl}/api/search?page=${page}&pageSize=${pageSize}&sort=pubdate_desc&fields=${encodeURIComponent(fields)}`;
    const payload = await fetchJson(url);
    if (Array.isArray(payload.items)) items.push(...payload.items);
  }
  return {
    items,
    total,
    totalUnique,
    fetchStartedAt: fetchStartedAt.toISOString(),
    fields
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadLocalSongFile(filePath) {
  const jsContent = fs.readFileSync(filePath, 'utf8');
  const fakeWindow = { SONG_DATA: [] };
  const run = new Function('window', jsContent);
  run(fakeWindow);
  return Array.isArray(fakeWindow.SONG_DATA) ? fakeWindow.SONG_DATA : [];
}

function sourceKeyFromFile(fileName) {
  return String(fileName || '').replace(/\.js$/, '');
}

function enrichSongStats(items) {
  const uniqueByTitle = new Map();
  const sourceSetByTitle = new Map();
  for (const song of items) {
    const key = normalizeTitle(song.title);
    if (!key) continue;
    uniqueByTitle.set(key, (uniqueByTitle.get(key) || 0) + 1);
    if (!sourceSetByTitle.has(key)) sourceSetByTitle.set(key, new Set());
    sourceSetByTitle.get(key).add(song.source || '');
  }
  return items.map(song => {
    const key = normalizeTitle(song.title);
    return {
      ...song,
      normalizedTitle: song.normalizedTitle || key,
      uniqueOccurrenceCount: song.uniqueOccurrenceCount || uniqueByTitle.get(key) || 1,
      uniqueSourceCount: song.uniqueSourceCount || sourceSetByTitle.get(key)?.size || 1,
      isUniqueSong: typeof song.isUniqueSong === 'boolean' ? song.isUniqueSong : (uniqueByTitle.get(key) || 0) === 1
    };
  });
}

function loadLocalSongs() {
  const startedAt = new Date();
  const indexPath = path.join(ROOT, 'data', 'index.json');
  const indexData = readJson(indexPath);
  const fileToAlias = indexData.fileToAlias || {};
  const files = Array.isArray(indexData.files) ? indexData.files : [];
  const items = [];
  for (const fileName of files) {
    const filePath = path.join(ROOT, 'data', fileName);
    const sourceKey = sourceKeyFromFile(fileName);
    const sourceAlias = fileToAlias[sourceKey] || sourceKey;
    const rows = loadLocalSongFile(filePath);
    for (const song of rows) {
      items.push({
        ...song,
        source: song.source || fileName,
        sourceAlias: song.sourceAlias || sourceAlias
      });
    }
  }
  const enriched = enrichSongStats(items);
  return {
    items: enriched,
    total: enriched.length,
    totalUnique: new Set(enriched.map(song => song.normalizedTitle).filter(Boolean)).size,
    fetchStartedAt: startedAt.toISOString(),
    fields: 'local data/index.json + data/*.js'
  };
}

function dedupSongs(songs) {
  const groups = new Map();
  for (const song of songs) {
    const key = song.normalizedTitle || normalizeTitle(song.title);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(song);
  }

  const rows = [];
  for (const [normalizedTitleValue, group] of groups) {
    group.sort((a, b) => Number(b.pubdate || 0) - Number(a.pubdate || 0));
    const latest = group[0] || {};
    const artistVariants = Array.from(new Set(group.map(song => String(song.artist || '').trim()).filter(Boolean)));
    const sources = Array.from(new Set(group.map(song => String(song.sourceAlias || song.source || '').trim()).filter(Boolean)));
    const bvids = Array.from(new Set(group.map(song => String(song.bvid || '').trim()).filter(Boolean)));
    const reasons = Array.from(new Set(group.flatMap(song => song.vocaloidCheck?.reasons || [])));
    const linksNewestFirst = group.map(song => {
      const when = song.pubdateFormatted || formatShanghaiDateTimeFromSeconds(song.pubdate);
      const source = song.sourceAlias || song.source || '';
      const bvid = song.page ? `${song.bvid}?p=${song.page}` : song.bvid || '';
      return `${when} | ${source} | ${bvid} | ${song.artist || ''} | ${song.link || ''}`;
    }).join('\n');
    rows.push({
      title: latest.title || group[0]?.title || '',
      artist_variants: artistVariants.join('\n'),
      occurrence_count: group.length,
      source_count: sources.length,
      latest_upload_time: latest.pubdateFormatted || formatShanghaiDateTimeFromSeconds(latest.pubdate),
      latest_source: latest.sourceAlias || latest.source || '',
      latest_link: latest.link || '',
      links_newest_first: linksNewestFirst,
      sources: sources.join('\n'),
      bvids: bvids.join('\n'),
      reasons: reasons.join('\n'),
      normalized_title: normalizedTitleValue
    });
  }
  rows.sort((a, b) => {
    const latestA = Date.parse((a.latest_upload_time || '').replace(' ', 'T') + '+08:00');
    const latestB = Date.parse((b.latest_upload_time || '').replace(' ', 'T') + '+08:00');
    return (Number.isFinite(latestB) ? latestB : 0) - (Number.isFinite(latestA) ? latestA : 0);
  });
  return rows;
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows, columns) {
  return [
    columns.join(','),
    ...rows.map(row => columns.map(col => csvEscape(row[col])).join(','))
  ].join('\n') + '\n';
}

function buildSourceSummary(songs, allSongs) {
  const totalBySource = new Map();
  const uniqueBySource = new Map();
  for (const song of allSongs) {
    const source = song.source || '';
    totalBySource.set(source, (totalBySource.get(source) || 0) + 1);
    const key = `${source}\u0000${normalizeTitle(song.title)}`;
    if (!uniqueBySource.has(source)) uniqueBySource.set(source, new Set());
    if (normalizeTitle(song.title)) uniqueBySource.get(source).add(key);
  }
  const map = new Map();
  for (const song of songs) {
    const source = song.source || '';
    const row = map.get(source) || {
      source,
      sourceAlias: song.sourceAlias || '',
      matchedSongs: 0,
      matchedUniqueTitles: new Set(),
      totalSongs: totalBySource.get(source) || 0,
      totalUniqueTitles: uniqueBySource.get(source)?.size || 0
    };
    row.matchedSongs += 1;
    if (song.normalizedTitle) row.matchedUniqueTitles.add(song.normalizedTitle);
    map.set(source, row);
  }
  return Array.from(map.values())
    .map(row => ({
      source: row.source,
      sourceAlias: row.sourceAlias,
      matchedSongs: row.matchedSongs,
      matchedUniqueTitles: row.matchedUniqueTitles.size,
      totalSongs: row.totalSongs,
      totalUniqueTitles: row.totalUniqueTitles,
      matchedUniqueRatio: row.totalUniqueTitles ? Number((row.matchedUniqueTitles.size / row.totalUniqueTitles * 100).toFixed(2)) : ''
    }))
    .sort((a, b) => b.matchedSongs - a.matchedSongs);
}

function ensureSafeOutDir(outDir) {
  const resolved = path.resolve(outDir);
  if (!resolved.startsWith(ROOT + path.sep)) {
    throw new Error(`Output directory must stay inside repo root: ${resolved}`);
  }
  if (!path.basename(resolved).startsWith('vocaloid-songs-')) {
    throw new Error(`Output directory must be named vocaloid-songs-*: ${resolved}`);
  }
  return resolved;
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeOutputs(outDir, files) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  for (const [fileName, content] of Object.entries(files)) {
    const filePath = path.join(outDir, fileName);
    if (typeof content === 'string') {
      fs.writeFileSync(filePath, content, 'utf8');
    } else {
      writeJson(filePath, content);
    }
  }
}

function buildAuditRows(auditRows) {
  return auditRows.map(({ song, auditReasons, pendingTitleReasons }) => ({
    title: song.title || '',
    artist: song.artist || '',
    source: song.source || '',
    sourceAlias: song.sourceAlias || '',
    collection: song.collection || '',
    bvid: song.bvid || '',
    page: song.page || '',
    pubdateFormatted: song.pubdateFormatted || formatShanghaiDateTimeFromSeconds(song.pubdate),
    link: song.link || '',
    auditReasons: auditReasons.join(' | '),
    pendingTitleReasons: pendingTitleReasons.join(' | ')
  }));
}

async function main() {
  const args = parseArgs(process.argv);
  const outDir = ensureSafeOutDir(args.outDir);
  const rules = readRules();
  const ruleIndex = buildRuleIndex(rules);
  const fetched = args.source === 'local'
    ? loadLocalSongs()
    : await fetchAllSongs(args.baseUrl, args.pageSize);
  const generatedAt = new Date();
  const generatedDate = args.date || formatShanghaiDate(generatedAt);
  const allMatched = [];
  const audit = [];

  for (const song of fetched.items) {
    const check = classifySong(song, rules, ruleIndex);
    if (check.isVocaloid) {
      allMatched.push(withDerivedFields(song, check));
    } else if (check.auditReasons.length) {
      audit.push({
        song: {
          ...song,
          pubdateFormatted: song.pubdateFormatted || formatShanghaiDateTimeFromSeconds(song.pubdate)
        },
        auditReasons: check.auditReasons,
        pendingTitleReasons: check.pendingTitleReasons
      });
    }
  }

  allMatched.sort((a, b) => Number(b.pubdate || 0) - Number(a.pubdate || 0));
  const dedupRows = dedupSongs(allMatched);
  const sourceSummary = buildSourceSummary(allMatched, fetched.items);
  const auditRows = buildAuditRows(audit);
  const allJsonName = `all-vocaloid-songs-${generatedDate}.json`;
  const allCsvName = `all-vocaloid-songs-${generatedDate}.csv`;
  const dedupJsonName = `dedup-vocaloid-songs-${generatedDate}.json`;
  const dedupCsvName = `dedup-vocaloid-songs-${generatedDate}.csv`;
  const auditCsvName = 'audit-ambiguous-excluded.csv';
  const sourceSummaryName = 'source-summary.csv';

  const reasonCounts = {};
  for (const song of allMatched) {
    for (const reason of song.vocaloidCheck.reasons) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
  }

  const manifest = {
    generatedAt: generatedAt.toISOString(),
    generatedDate,
    dataSource: args.source === 'local' ? 'data/index.json + data/*.js' : `${args.baseUrl}/api/search`,
    sourceMode: args.source,
    fetchStartedAt: fetched.fetchStartedAt,
    fetchParams: {
      pageSize: args.pageSize,
      sort: 'pubdate_desc',
      fields: fetched.fields
    },
    cloudTotalSongs: fetched.total,
    cloudTotalUnique: fetched.totalUnique,
    fetchedSongs: fetched.items.length,
    matchedSongs: allMatched.length,
    matchedUniqueTitles: dedupRows.length,
    matchedSources: new Set(allMatched.map(song => song.source)).size,
    auditExcludedRows: auditRows.length,
    classifier: {
      version: rules.version,
      rules: rules.rules,
      voicebankGroups: (rules.voicebanks || []).length,
      producerGroups: (rules.producers || []).length,
      knownTitles: (rules.knownTitles || []).length,
      titleRequiresAdditionalEvidence: rules.titleRequiresAdditionalEvidence || [],
      titleBlacklist: rules.titleBlacklist || [],
      topReasons: Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 24)
        .map(([reason, count]) => ({ reason, count }))
    },
    files: {
      allJson: allJsonName,
      allCsv: allCsvName,
      sourceSummary: sourceSummaryName,
      ambiguousExcluded: auditCsvName
    },
    dedup: {
      groupBy: 'normalizedTitle',
      dedupRows: dedupRows.length,
      sort: 'latest_upload_time desc',
      files: {
        csv: dedupCsvName,
        json: dedupJsonName
      }
    }
  };

  const files = {
    'manifest.json': manifest,
    [allJsonName]: allMatched,
    [dedupJsonName]: dedupRows,
    [allCsvName]: toCsv(allMatched, [
      'title', 'artist', 'sourceAlias', 'source', 'collection', 'link', 'bvid', 'page',
      'pubdate', 'pubdateFormatted', 'viewCount', 'cover', 'normalizedTitle', 'vocaloidReasons'
    ]),
    [dedupCsvName]: toCsv(dedupRows, [
      'title', 'artist_variants', 'occurrence_count', 'source_count', 'latest_upload_time',
      'latest_source', 'latest_link', 'sources', 'bvids', 'reasons', 'normalized_title'
    ]),
    [sourceSummaryName]: toCsv(sourceSummary, [
      'source', 'sourceAlias', 'matchedSongs', 'matchedUniqueTitles', 'totalSongs',
      'totalUniqueTitles', 'matchedUniqueRatio'
    ]),
    [auditCsvName]: toCsv(auditRows, [
      'title', 'artist', 'source', 'sourceAlias', 'collection', 'bvid', 'page',
      'pubdateFormatted', 'link', 'auditReasons', 'pendingTitleReasons'
    ])
  };

  if (!args.dryRun) {
    writeOutputs(outDir, files);
  }

  const newest = allMatched[0]?.pubdateFormatted || '';
  const oldest = allMatched[allMatched.length - 1]?.pubdateFormatted || '';
  console.log(JSON.stringify({
    generatedDate,
    fetchedSongs: fetched.items.length,
    cloudTotalSongs: fetched.total,
    cloudTotalUnique: fetched.totalUnique,
    matchedSongs: allMatched.length,
    matchedUniqueTitles: dedupRows.length,
    matchedSources: manifest.matchedSources,
    auditExcludedRows: auditRows.length,
    newest,
    oldest,
    outDir: args.dryRun ? '(dry-run)' : path.relative(ROOT, outDir),
    topReasons: manifest.classifier.topReasons.slice(0, 10)
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
