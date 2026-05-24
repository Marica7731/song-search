const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const SOURCE_PROFILE_PATH = path.join(__dirname, 'source-profiles.json');
const REPORT_PATH = path.join(ROOT_DIR, 'reports', 'source-avatar-scan.json');
const BILI_VIEW_API = 'https://api.bilibili.com/x/web-interface/view?bvid=';

const SHOULD_WRITE = process.argv.includes('--write');
const SHOULD_UPDATE_INDEX = process.argv.includes('--update-index');
const SHOULD_REPORT = process.argv.includes('--report');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function defaultAvatarText(name) {
  const picked = Array.from(String(name || '').trim()).find(ch => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9]/u.test(ch));
  return (picked || '源').toUpperCase();
}

function stringHash(value) {
  let hash = 0;
  String(value || '').split('').forEach(ch => {
    hash = ((hash << 5) - hash) + ch.charCodeAt(0);
    hash |= 0;
  });
  return Math.abs(hash);
}

function defaultAccentColor(key) {
  return `hsl(${stringHash(key) % 360} 55% 36%)`;
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sourceKeyFromFile(fileName) {
  return String(fileName || '').replace(/\.js$/, '');
}

function pickByFlexibleKey(object, keys) {
  if (!object || typeof object !== 'object') return null;
  const candidates = keys
    .map(key => String(key || ''))
    .filter(Boolean);
  for (const key of candidates) {
    if (object[key]) return object[key];
  }
  const normalized = new Set(candidates.map(key => key.trim()).filter(Boolean));
  for (const [key, value] of Object.entries(object)) {
    if (normalized.has(String(key || '').trim())) return value;
  }
  return null;
}

function loadSongs(fileName) {
  const code = fs.readFileSync(path.join(DATA_DIR, fileName), 'utf8');
  const sandbox = { window: { SONG_DATA: [] } };
  vm.runInNewContext(code, sandbox, { filename: fileName });
  return Array.isArray(sandbox.window.SONG_DATA) ? sandbox.window.SONG_DATA : [];
}

function latestSongForSource(fileName) {
  return loadSongs(fileName)
    .filter(song => song && song.bvid && Number(song.pubdate || 0) > 0)
    .sort((a, b) => Number(b.pubdate || 0) - Number(a.pubdate || 0))[0] || null;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
        'Referer': 'https://www.bilibili.com/'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { url: response.url, text: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBiliView(bvid) {
  const json = await fetchJson(`${BILI_VIEW_API}${encodeURIComponent(bvid)}`);
  if (!json || json.code !== 0 || !json.data) {
    throw new Error(`Bili API code=${json?.code}`);
  }
  return json.data;
}

function trimUrl(url) {
  return String(url || '')
    .trim()
    .replace(/[),，。！？!?:：；;、\]\u300d\u300f\u3011\u3015\u3017\u3019\u301e]+$/u, '');
}

function extractUrls(text) {
  const normalized = String(text || '').replace(/\u00a0/g, ' ');
  const urls = [];
  const seen = new Set();
  for (const match of normalized.matchAll(/https?:\/\/[^\s<>"']+/g)) {
    const url = trimUrl(match[0]);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

function isYouTubeHost(hostname) {
  return /(^|\.)youtube\.com$/i.test(hostname)
    || /(^|\.)youtu\.be$/i.test(hostname)
    || /(^|\.)youtube-nocookie\.com$/i.test(hostname);
}

function normalizeYouTubeUrl(url) {
  try {
    const parsed = new URL(url);
    if (!isYouTubeHost(parsed.hostname)) return null;
    parsed.protocol = 'https:';
    parsed.hostname = parsed.hostname.replace(/^m\./i, 'www.');
    return parsed.toString();
  } catch {
    return null;
  }
}

function youtubeChannelFromUrl(url) {
  const normalized = normalizeYouTubeUrl(url);
  if (!normalized) return null;
  const parsed = new URL(normalized);
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts[0]?.startsWith('@')) return `https://www.youtube.com/${parts[0]}`;
  if (['channel', 'c', 'user'].includes(parts[0]) && parts[1]) {
    return `https://www.youtube.com/${parts[0]}/${parts[1]}`;
  }
  return null;
}

function youtubeVideoUrlFromUrl(url) {
  const normalized = normalizeYouTubeUrl(url);
  if (!normalized) return null;
  const parsed = new URL(normalized);
  const parts = parsed.pathname.split('/').filter(Boolean);
  const videoId = /youtu\.be$/i.test(parsed.hostname)
    ? parts[0]
    : (parts[0] === 'watch' ? parsed.searchParams.get('v') : (['live', 'shorts', 'embed'].includes(parts[0]) ? parts[1] : ''));
  if (!/^[A-Za-z0-9_-]{11}$/.test(String(videoId || ''))) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function extractHandleCandidates(text) {
  const out = [];
  const seen = new Set();
  const lines = String(text || '').split(/\r?\n/);
  for (const line of lines) {
    const normalized = line.replace(/\u00a0/g, ' ');
    const looksRelevant = /youtube|youtu\.be|主播|主页|ホーム|channel|ch\.|チャンネル|メンバー登録|登録/i.test(normalized);
    if (!looksRelevant) continue;
    for (const match of normalized.matchAll(/(?:^|[\s/：:])@([A-Za-z0-9._-]{3,})/g)) {
      const handle = match[1].replace(/[._-]+$/g, '');
      if (!handle || seen.has(handle.toLowerCase())) continue;
      seen.add(handle.toLowerCase());
      out.push(`https://www.youtube.com/@${handle}`);
    }
  }
  return out;
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractFirstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return '';
}

function normalizeAvatarUrl(url) {
  const text = decodeHtml(url).trim();
  if (!text) return '';
  return text.replace(/=s\d+[^"'\\<>\s]*/i, '=s176-c-k-c0x00ffffff-no-rj');
}

function parseChannelFromHtml(html) {
  const ogUrl = extractFirstMatch(html, [
    /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
    /"ownerProfileUrl":"([^"]+)"/i,
    /"canonicalBaseUrl":"(\/@[^"]+)"/i,
    /"channelId":"(UC[0-9A-Za-z_-]{20,})"/i
  ]);
  if (!ogUrl) return '';
  if (ogUrl.startsWith('/@')) return `https://www.youtube.com${ogUrl}`;
  if (ogUrl.startsWith('UC')) return `https://www.youtube.com/channel/${ogUrl}`;
  return youtubeChannelFromUrl(ogUrl) || '';
}

function parseAvatarFromChannelHtml(html) {
  const ogImage = extractFirstMatch(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/i
  ]);
  if (ogImage) return normalizeAvatarUrl(ogImage);
  const yt3 = (html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[^"\\<>\s]+/g) || [])
    .map(normalizeAvatarUrl)
    .find(Boolean);
  return yt3 || '';
}

async function resolveYouTubeChannelAndAvatar(candidates) {
  const tried = [];
  for (const rawUrl of candidates) {
    const directChannel = youtubeChannelFromUrl(rawUrl);
    const videoUrl = youtubeVideoUrlFromUrl(rawUrl);
    const channelUrl = directChannel || '';
    try {
      let resolvedChannel = channelUrl;
      if (!resolvedChannel && videoUrl) {
        tried.push(videoUrl);
        const videoPage = await fetchText(videoUrl);
        resolvedChannel = parseChannelFromHtml(videoPage.text);
      }
      if (!resolvedChannel) continue;
      tried.push(resolvedChannel);
      const channelPage = await fetchText(resolvedChannel);
      const avatarUrl = parseAvatarFromChannelHtml(channelPage.text);
      const canonicalChannel = parseChannelFromHtml(channelPage.text) || resolvedChannel;
      if (avatarUrl) {
        return {
          youtubeUrl: canonicalChannel,
          avatarUrl,
          tried
        };
      }
      await sleep(300);
    } catch (error) {
      tried.push(`${rawUrl} (${error.message})`);
    }
  }
  return { youtubeUrl: '', avatarUrl: '', tried };
}

function buildCandidates(desc) {
  const urls = extractUrls(desc);
  const channels = urls.map(youtubeChannelFromUrl).filter(Boolean);
  const videos = urls.map(youtubeVideoUrlFromUrl).filter(Boolean);
  const handles = extractHandleCandidates(desc);
  const out = [];
  const seen = new Set();
  for (const url of [...channels, ...handles, ...videos]) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function loadProfileFile() {
  const parsed = readJson(SOURCE_PROFILE_PATH, { profiles: {} });
  const profiles = parsed.profiles && typeof parsed.profiles === 'object' ? parsed.profiles : parsed;
  return {
    root: parsed.profiles ? parsed : { profiles },
    profiles
  };
}

function mergeProfile(existing, sourceKey, alias, resolved) {
  return {
    ...existing,
    avatarUrl: resolved.avatarUrl || existing.avatarUrl || '',
    youtubeUrl: resolved.youtubeUrl || existing.youtubeUrl || '',
    avatarText: existing.avatarText || defaultAvatarText(alias),
    accentColor: defaultAccentColor(sourceKey)
  };
}

function updateIndexProfiles(indexData, profileOverrides) {
  const sourceProfiles = indexData.sourceProfiles && typeof indexData.sourceProfiles === 'object'
    ? indexData.sourceProfiles
    : {};
  for (const file of indexData.files || []) {
    const key = sourceKeyFromFile(file);
    const alias = indexData.fileToAlias?.[key] || key;
    const existing = sourceProfiles[key] || {};
    const override = pickByFlexibleKey(profileOverrides, [key, alias]) || {};
    sourceProfiles[key] = {
      alias,
      avatarText: override.avatarText || existing.avatarText || defaultAvatarText(alias),
      avatarUrl: override.avatarUrl || existing.avatarUrl || '',
      youtubeUrl: override.youtubeUrl || existing.youtubeUrl || '',
      accentColor: override.accentColor || existing.accentColor || defaultAccentColor(key)
    };
  }
  indexData.sourceProfiles = sourceProfiles;
}

async function main() {
  const indexData = readJson(INDEX_PATH, null);
  if (!indexData) throw new Error(`missing ${INDEX_PATH}`);
  const profileFile = loadProfileFile();
  const report = [];
  const foundProfiles = {};

  for (const file of indexData.files || []) {
    const key = sourceKeyFromFile(file);
    const alias = indexData.fileToAlias?.[key] || key;
    const latest = latestSongForSource(file);
    if (!latest) {
      report.push({ key, alias, status: 'no-song' });
      continue;
    }

    process.stdout.write(`[${alias}] ${latest.bvid} ... `);
    try {
      const bili = await fetchBiliView(latest.bvid);
      const desc = String(bili.desc || '');
      const candidates = buildCandidates(desc);
      const resolved = await resolveYouTubeChannelAndAvatar(candidates);
      const item = {
        key,
        alias,
        latestBvid: latest.bvid,
        latestTitle: latest.videoTitle || latest.collection || '',
        descUrlCount: extractUrls(desc).length,
        candidates,
        youtubeUrl: resolved.youtubeUrl,
        avatarUrl: resolved.avatarUrl,
        status: resolved.avatarUrl ? 'ok' : (candidates.length ? 'no-avatar' : 'no-youtube-link')
      };
      report.push(item);
      if (resolved.avatarUrl || resolved.youtubeUrl) {
        foundProfiles[key] = mergeProfile(profileFile.profiles[key] || {}, key, alias, resolved);
      }
      console.log(item.status);
      await sleep(650);
    } catch (error) {
      report.push({ key, alias, latestBvid: latest.bvid, status: 'error', error: error.message });
      console.log(`error: ${error.message}`);
    }
  }

  const mergedProfiles = {};
  for (const file of indexData.files || []) {
    const key = sourceKeyFromFile(file);
    const existingProfile = pickByFlexibleKey(profileFile.profiles, [key, indexData.fileToAlias?.[key]]);
    if (existingProfile) mergedProfiles[key] = existingProfile;
    if (foundProfiles[key]) mergedProfiles[key] = foundProfiles[key];
  }
  profileFile.root.profiles = mergedProfiles;

  if (SHOULD_WRITE) {
    writeJson(SOURCE_PROFILE_PATH, profileFile.root);
  }
  if (SHOULD_UPDATE_INDEX) {
    updateIndexProfiles(indexData, mergedProfiles);
    writeJson(INDEX_PATH, indexData);
  }
  if (SHOULD_REPORT) {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    writeJson(REPORT_PATH, {
      generatedAt: new Date().toISOString(),
      total: report.length,
      ok: report.filter(item => item.status === 'ok').length,
      report
    });
  }

  console.log(JSON.stringify({
    total: report.length,
    ok: report.filter(item => item.status === 'ok').length,
    noYoutubeLink: report.filter(item => item.status === 'no-youtube-link').length,
    noAvatar: report.filter(item => item.status === 'no-avatar').length,
    error: report.filter(item => item.status === 'error').length,
    wroteSourceProfiles: SHOULD_WRITE,
    updatedIndex: SHOULD_UPDATE_INDEX,
    wroteReport: SHOULD_REPORT
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
