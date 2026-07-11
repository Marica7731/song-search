// Shared duplicate-check logic for:
// 1) bv-dup-check.html
// 2) title-artist-dup-check.html

let allSongs = [];
let fileList = [];
let fileAlias = {};
let sourceStats = {};
let sourceProfiles = {};
let bootstrapTotalSongs = 0;
let bootstrapTotalUnique = 0;
let currentTab = 'all';
let analysisResult = [];
let showOnlyUnique = false;
let currentMode = 'bv';
let bvInputItems = [];
let titleArtistInputItems = [];
let dataLoaded = false;
let isApiMode = false;
let dupCopyAiEnabled = false;
let dupCopyAiModel = '';
let dupCopyAiBusy = false;

function extractBV(str) {
  if (!str) return '';
  const match = String(str).match(/BV[a-zA-Z0-9]+/);
  return match ? match[0] : '';
}

function normalizeText(value) {
  if (window.ArtistMatch && typeof window.ArtistMatch.normalizeString === 'function') {
    return window.ArtistMatch.normalizeString(value);
  }
  return (value || '').toLowerCase().trim();
}

function encodeCopyValue(value) {
  return encodeURIComponent(value == null ? '' : String(value));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function getDefaultAvatarText(alias) {
  const picked = Array.from(String(alias || '').trim()).find(ch => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9]/u.test(ch));
  return (picked || '源').toUpperCase();
}

function getSourceAlias(source) {
  if (!source) return '未知来源';
  const key = source.replace('.js', '');
  return fileAlias[key] || source;
}

function getSourceKey(source) {
  return String(source || '').replace(/\.js$/, '');
}

function isCombinedSource(source) {
  return getSourceKey(source) === 'others' || getSourceAlias(source) === '非常驻妹妹';
}

function getSourceProfile(source, fallbackAlias = '') {
  if (source === 'all') {
    return { alias: '全部来源', avatarText: 'ALL', avatarUrl: '', accentColor: '#0f766e' };
  }
  if (!source) {
    return { alias: fallbackAlias || '未收录', avatarText: '未', avatarUrl: '', accentColor: '#dc2626' };
  }
  const key = getSourceKey(source);
  const alias = fallbackAlias || getSourceAlias(source);
  const profile = sourceProfiles[key] || sourceProfiles[source] || {};
  return {
    alias,
    avatarText: String(profile.avatarText || '').trim() || getDefaultAvatarText(alias),
    avatarUrl: String(profile.avatarUrl || '').trim(),
    accentColor: String(profile.accentColor || '').trim() || '#0f766e'
  };
}

function sourceAvatarHtml(source, className = '', fallbackAlias = '') {
  const profile = getSourceProfile(source, fallbackAlias);
  const classes = ['dup-source-avatar', className].filter(Boolean).join(' ');
  const style = profile.accentColor ? ` style="--dup-source-avatar-color:${escapeAttr(profile.accentColor)}"` : '';
  if (profile.avatarUrl) {
    return `<span class="${classes}"${style}><img src="${escapeAttr(profile.avatarUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`;
  }
  return `<span class="${classes}"${style}>${escapeHtml(profile.avatarText)}</span>`;
}

function normalizeMediaUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('//')) return `https:${text}`;
  if (/^http:\/\//i.test(text)) return text.replace(/^http:\/\//i, 'https://');
  if (/^https?:\/\//i.test(text)) return text;
  return '';
}

function buildDisplayThumbUrl(value, width = 160) {
  const url = normalizeMediaUrl(value);
  if (!url) return '';
  const height = Math.round(width * 9 / 16);
  const suffix = `@${width}w_${height}h_1c.webp`;
  const match = url.match(/^([^?#]+)([?#].*)?$/);
  if (!match) return url;
  const path = match[1];
  const query = match[2] || '';
  if (!/\.(?:jpe?g|png|webp)(?:@[^/?#]+)?$/i.test(path)) return url;
  return path.replace(/(\.(?:jpe?g|png|webp))(?:@[^/?#]+)?$/i, `$1${suffix}`) + query;
}

function getSongCover(song, width = 160) {
  return buildDisplayThumbUrl(song?.cover || song?.thumbnail || song?.coverThumb || '', width);
}

function coverHtml(song, className = 'dup-cover') {
  const cover = getSongCover(song);
  const link = String(song?.link || '').trim();
  if (!cover) {
    return `<div class="${className} no-cover" aria-hidden="true">${sourceAvatarHtml(song?.source || '', 'cover-fallback-avatar', song?.source ? getSourceAlias(song.source) : '未收录')}</div>`;
  }
  const img = `<img src="${escapeAttr(cover)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  return link
    ? `<a class="${className}" href="${escapeAttr(link)}" target="_blank" rel="noreferrer">${img}</a>`
    : `<div class="${className}">${img}</div>`;
}

function getSourceOptionLabel(source) {
  if (source === 'all') {
    return '全部来源';
  }
  const stat = sourceStats[source];
  const alias = getSourceAlias(source);
  if (!stat) return alias;
  return alias;
}

function getCurrentSourceDisplayLabel() {
  if (currentTab === 'all') {
    return `全部来源 · 投稿 ${bootstrapTotalSongs} · 去重 ${bootstrapTotalUnique}`;
  }
  const stat = sourceStats[currentTab];
  const alias = getSourceAlias(currentTab);
  if (!stat) return alias;
  return `${alias} · 投稿 ${stat.totalSongs} · 去重 ${stat.totalUnique}`;
}

function getSourceSongCount(source) {
  if (source === 'all') return bootstrapTotalSongs || allSongs.length || 0;
  const stat = sourceStats[source] || {};
  if (Number.isFinite(Number(stat.totalSongs))) return Number(stat.totalSongs);
  if (Number.isFinite(Number(stat.count))) return Number(stat.count);
  return allSongs.filter(song => song.source === source).length;
}

function getSourceUniqueCount(source) {
  if (source === 'all') return bootstrapTotalUnique || getUniqueSongCount(allSongs);
  const stat = sourceStats[source] || {};
  if (Number.isFinite(Number(stat.totalUnique))) return Number(stat.totalUnique);
  const sourceSongs = allSongs.filter(song => song.source === source);
  return sourceSongs.length > 0 ? getUniqueSongCount(sourceSongs) : 0;
}

function buildStaticSourceStats() {
  const nextStats = {};
  fileList.forEach(fileName => {
    const sourceSongs = allSongs.filter(song => song.source === fileName);
    nextStats[fileName] = {
      file: fileName,
      alias: getSourceAlias(fileName),
      totalSongs: sourceSongs.length,
      totalUnique: getUniqueSongCount(sourceSongs)
    };
  });
  return nextStats;
}

function getSortedSourceFiles() {
  return fileList.slice().sort((left, right) => {
    const combinedLeft = isCombinedSource(left);
    const combinedRight = isCombinedSource(right);
    if (combinedLeft !== combinedRight) return combinedLeft ? 1 : -1;
    const diff = getSourceSongCount(right) - getSourceSongCount(left);
    if (diff !== 0) return diff;
    return getSourceAlias(left).localeCompare(getSourceAlias(right), 'zh-CN');
  });
}

function isSameSong(songA, songB) {
  if (window.ArtistMatch && typeof window.ArtistMatch.isSameSong === 'function') {
    return window.ArtistMatch.isSameSong(songA, songB, artist => !!artist && !!String(artist).trim());
  }
  const titleA = normalizeText(songA.title || '');
  const titleB = normalizeText(songB.title || '');
  if (titleA !== titleB) return false;
  return normalizeText(songA.artist || '') === normalizeText(songB.artist || '');
}

function areArtistsCompatible(left, right) {
  if (window.ArtistMatch && typeof window.ArtistMatch.areArtistsCompatible === 'function') {
    return window.ArtistMatch.areArtistsCompatible(left, right);
  }
  return normalizeText(left) === normalizeText(right);
}

function getUniqueSongCount(songs) {
  const uniqueSongs = [];
  songs.forEach(song => {
    const exists = uniqueSongs.some(savedSong => isSameSong(song, savedSong));
    if (!exists) uniqueSongs.push(song);
  });
  return uniqueSongs.length;
}

function getCopyDuplicateIndex() {
  const input = document.getElementById('copyDupIndex');
  if (!input) return null;
  const value = String(input.value || '').trim();
  if (!value) return null;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed === 0) return null;
  return parsed;
}

function getCopyDuplicateOrder() {
  const select = document.getElementById('copyDupOrder');
  if (!select) return 'from-start';
  const value = String(select.value || '').trim();
  return value === 'from-end' ? 'from-end' : 'from-start';
}

function getDuplicateLinkCandidatesForCopy(item) {
  const dupList = Array.isArray(item?.dupList) ? item.dupList : [];
  const links = [];
  const seen = new Set();
  dupList.forEach(entry => {
    const link = String(entry?.link || '').trim();
    if (!link || seen.has(link)) return;
    seen.add(link);
    links.push(link);
  });
  if (links.length === 0) return [];

  if (currentMode === 'titleArtist') return links;

  const currentLink = String(item?.song?.link || '').trim();
  const filtered = currentLink ? links.filter(link => link !== currentLink) : links.slice();
  return filtered.length > 0 ? filtered : links;
}

function getLinkForCopy(item) {
  if (!item || !item.song) return '';
  const links = getDuplicateLinkCandidatesForCopy(item);
  if (links.length === 0) return item.song.link || '';

  const nth = getCopyDuplicateIndex();
  const rank = nth == null ? 1 : nth;
  const order = getCopyDuplicateOrder();
  let index = rank > 0 ? rank - 1 : links.length + rank;
  if (rank > 0 && order === 'from-end') {
    index = links.length - rank;
  }
  index = Math.max(0, Math.min(links.length - 1, index));

  return links[index] || item.song.link || '';
}

function getCopySeparator() {
  let separator = String(document.getElementById('copySeparator')?.value || ' ');
  if (!separator) separator = ' ';
  if (separator === '\\t') return '\t';
  return separator;
}

const DUP_COPY_CHECK_IDS = [
  'copyOnlyUnique',
  'copyOriginal',
  'copyTitle',
  'copyArtist',
  'copySource',
  'copyLink',
  'copyBvid',
  'copyDupCount',
  'copyStatus',
  'copyText',
  'copyTable'
];
const DUP_COPY_VALUE_IDS = ['copySeparator', 'copyDupIndex', 'copyDupOrder'];

function getDupCopyStorageKey() {
  return `culua-dup-copy-${currentMode}-v1`;
}

function readDupCopySettings() {
  try {
    return JSON.parse(localStorage.getItem(getDupCopyStorageKey()) || 'null') || {};
  } catch {
    return {};
  }
}

function saveDupCopySettings() {
  const checks = {};
  DUP_COPY_CHECK_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) checks[id] = !!el.checked;
  });

  const values = {};
  DUP_COPY_VALUE_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) values[id] = el.value;
  });

  try {
    localStorage.setItem(getDupCopyStorageKey(), JSON.stringify({
      checks,
      values,
      advancedOpen: !!document.getElementById('copyAdvancedFields')?.open
    }));
  } catch {
    // Storage is optional; keep the current session usable if it is blocked.
  }
}

function restoreDupCopySettings() {
  const saved = readDupCopySettings();
  const checks = saved.checks || {};
  DUP_COPY_CHECK_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && typeof checks[id] === 'boolean') {
      el.checked = checks[id];
    }
  });

  const values = saved.values || {};
  DUP_COPY_VALUE_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && typeof values[id] === 'string') {
      el.value = values[id];
    }
  });

  const advanced = document.getElementById('copyAdvancedFields');
  if (advanced && typeof saved.advancedOpen === 'boolean') {
    advanced.open = saved.advancedOpen;
  }
}

function bindDupCopySettingsPersistence() {
  const controls = document.querySelector('.copy-controls');
  if (!controls) return;
  controls.addEventListener('change', saveDupCopySettings);
  controls.addEventListener('input', event => {
    if (DUP_COPY_VALUE_IDS.includes(event.target?.id)) {
      saveDupCopySettings();
    }
  });
  document.getElementById('copyAdvancedFields')?.addEventListener('toggle', saveDupCopySettings);
}

function getResultStatusText(item) {
  if (!item) return '';
  if (item.isNotFound) return '未找到';
  if (currentMode === 'titleArtist') {
    if (item.isArtistMismatch) return `歌手疑似不一致（${item.dupCount || 0}）`;
    return item.isFirst ? '未收录' : `已收录（${item.dupCount || 0}）`;
  }
  return item.isDup ? `已收录（${item.dupCount || 0}）` : '未收录';
}

function buildCopyRecord(item) {
  const song = item?.song || {};
  const sourceText = song.source ? getSourceAlias(song.source) : '输入值（未收录）';
  const link = getLinkForCopy(item);
  return {
    original: item?.originalInput || '',
    title: song.title || '',
    artist: song.artist || '',
    source: item?.isNotFound ? '' : sourceText,
    link,
    bvid: extractBV(link || song.bvid || item?.originalInput || ''),
    dupCount: Number(item?.dupCount || 0),
    status: getResultStatusText(item)
  };
}

function getFilteredAnalysisItemsForCopy() {
  const onlyUnique = !!document.getElementById('copyOnlyUnique')?.checked;
  let copyData = analysisResult.slice();
  if (onlyUnique) {
    if (currentMode === 'titleArtist') {
      copyData = copyData.filter(item => !item.isNotFound && !!item.isFirst);
    } else {
      copyData = copyData.filter(item => !item.isNotFound && !item.isDup);
    }
  }
  return copyData;
}

function getLinksForAiCopy(item) {
  const seen = new Set();
  const links = [];
  const pushLink = value => {
    const link = String(value || '').trim();
    if (!link || seen.has(link)) return;
    seen.add(link);
    links.push(link);
  };

  const song = item?.song || {};
  const songBvid = extractBV(song?.bvid || song?.link || '');
  const songCollection = String(song?.collection || '').trim();
  const songSource = String(song?.source || '').trim();

  pushLink(song.link || '');
  const dupList = Array.isArray(item?.dupList) ? item.dupList : [];
  const sameVideoLinks = dupList.filter(entry => extractBV(entry?.bvid || entry?.link || '') === songBvid);
  const sameCollectionLinks = dupList.filter(entry => String(entry?.collection || '').trim() === songCollection && songCollection);
  const pools = [];
  if (sameVideoLinks.length > 0) pools.push(sameVideoLinks);
  if (sameCollectionLinks.length > 0) pools.push(sameCollectionLinks);
  if (pools.length === 0) pools.push(dupList);
  pools.forEach(pool => {
    pool.forEach(entry => pushLink(entry?.link || ''));
  });
  return links.slice(0, 2);
}

function buildAiCopyRequestItems(items) {
  return items.map(item => ({
    originalInput: item?.originalInput || '',
    status: getResultStatusText(item),
    dedupeCount: Number(item?.dupCount || 0),
    links: getLinksForAiCopy(item),
    song: item?.song || null,
    dupList: Array.isArray(item?.dupList) ? item.dupList.slice(0, 8) : []
  }));
}

function getAiCopyButton() {
  return document.getElementById('copyAiBtn');
}

function syncAiCopyButtonState() {
  const button = getAiCopyButton();
  if (!button) return;
  const hasResults = getFilteredAnalysisItemsForCopy().length > 0;
  button.disabled = dupCopyAiBusy || !hasResults;
  button.textContent = dupCopyAiBusy ? 'AI清洗中...' : 'AI清洗复制';
  if (!dupCopyAiEnabled) {
    button.title = dupCopyAiModel
      ? `AI未启用：${dupCopyAiModel}`
      : '服务端尚未配置 AI 清洗复制';
  } else if (dupCopyAiModel) {
    button.title = `当前模型：${dupCopyAiModel}`;
  } else {
    button.title = '将使用服务端 AI 清洗复制文段';
  }
}

function setAiCopyBusy(busy) {
  dupCopyAiBusy = !!busy;
  syncAiCopyButtonState();
}

async function loadDupCopyAiMeta() {
  try {
    const response = await fetch('/api/site-meta', { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    dupCopyAiEnabled = !!payload?.dupCopyAi?.enabled;
    dupCopyAiModel = String(payload?.dupCopyAi?.model || '').trim();
  } catch (_) {
    dupCopyAiEnabled = false;
    dupCopyAiModel = '';
  } finally {
    syncAiCopyButtonState();
  }
}

function showCopyToast() {
  const toast = document.getElementById('copyToast');
  if (!toast) return;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function ensureReadyPlaceholder() {
  let placeholder = document.getElementById('dataReadyPlaceholder');
  if (placeholder) return placeholder;

  const searchBox = document.querySelector('.search-box');
  if (!searchBox || !searchBox.parentNode) return null;

  placeholder = document.createElement('div');
  placeholder.id = 'dataReadyPlaceholder';
  placeholder.style.cssText = [
    'margin-bottom:18px',
    'padding:14px 16px',
    'border:1px dashed #cbd5e1',
    'border-radius:8px',
    'background:#ffffff',
    'color:#495057',
    'box-shadow:0 2px 6px rgba(15,23,42,0.04)'
  ].join(';');
  placeholder.innerHTML = [
    '<div style="font-size:14px;font-weight:700;color:#1f2328;margin-bottom:4px;">歌库准备中</div>',
    '<div data-ready-desc style="font-size:13px;line-height:1.6;">正在连接服务端歌库...</div>'
  ].join('');
  searchBox.parentNode.insertBefore(placeholder, searchBox);
  return placeholder;
}

function setReadyState(ready, message = '') {
  const searchBox = document.querySelector('.search-box');
  const placeholder = ensureReadyPlaceholder();
  if (searchBox) {
    searchBox.style.display = ready ? 'grid' : 'none';
  }
  if (placeholder) {
    placeholder.style.display = ready ? 'none' : 'block';
    const desc = placeholder.querySelector('[data-ready-desc]');
    if (desc) {
      desc.textContent = message || '歌库尚未完成加载，请稍候。';
    }
  }

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.disabled = !ready;
  }
}

function parseTitleArtistInput(input) {
  if (!input.trim()) return [];
  const lines = input
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^\|\s*/, '').replace(/\s*\|$/, '').trim())
    .filter(line => line && !/^[-|]+$/.test(line));
  const numberedTitleArtistRegex = /^(\d+)[\.\)]\s+(.+?)\s*-\s*(.+)$/;
  const titleArtistRegex = /^(.+?)\s*-\s*(.+)$/;
  const numberedSingleRegex = /^(\d+)[\.\)]\s+(.+)$/;
  const result = [];

  lines.forEach(line => {
    const numberedTitleArtist = line.match(numberedTitleArtistRegex);
    if (numberedTitleArtist) {
      result.push({
        type: 'titleArtist',
        title: numberedTitleArtist[2].trim(),
        artist: numberedTitleArtist[3].trim(),
        originalLine: line
      });
      return;
    }

    const normal = line.match(titleArtistRegex);
    if (normal) {
      result.push({
        type: 'titleArtist',
        title: normal[1].trim(),
        artist: normal[2].trim(),
        originalLine: line
      });
      return;
    }

    const numberedSingle = line.match(numberedSingleRegex);
    if (numberedSingle) {
      result.push({
        type: 'artistOnly',
        title: '',
        artist: numberedSingle[2].trim(),
        originalLine: line
      });
      return;
    }

    result.push({
      type: 'artistOnly',
      title: '',
      artist: line.trim(),
      originalLine: line
    });
  });

  return result;
}

async function loadAllData(forceStatic = false) {
  setReadyState(false, '正在连接服务端歌库...');
  try {
    try {
      if (forceStatic) {
        throw new Error('force-static-fallback');
      }
      const bootstrapRes = await fetch('/api/bootstrap');
      if (bootstrapRes.ok) {
        const bootstrapData = await bootstrapRes.json();
        fileList = bootstrapData.files || [];
        fileAlias = bootstrapData.fileToAlias || {};
        sourceStats = bootstrapData.sourceStats || {};
        sourceProfiles = bootstrapData.sourceProfiles || {};
        bootstrapTotalSongs = bootstrapData.totalSongs || 0;
        bootstrapTotalUnique = bootstrapData.totalUnique || 0;
        isApiMode = true;
        renderSourceTabs();
        dataLoaded = true;
        setReadyState(true);
        updateStat('歌库已就绪，请输入内容开始分析');
        loadDupCopyAiMeta();
        return;
      }
      throw new Error(`API 状态码 ${bootstrapRes.status}`);
    } catch (apiError) {
      console.warn('API 数据加载失败，回退到静态模式：', apiError);
      isApiMode = false;
      setReadyState(false, '服务端接口不可用，正在回退到静态歌库...');
      const indexRes = await fetch('data/index.json');
      const indexData = await indexRes.json();
      fileList = indexData.files || fileList || [];
      fileAlias = indexData.fileToAlias || fileAlias || {};
      sourceProfiles = indexData.sourceProfiles || {};
      sourceStats = {};
      bootstrapTotalSongs = 0;
      bootstrapTotalUnique = 0;
      renderSourceTabs();

      const loadTasks = fileList.map(fileName =>
        fetch(`data/${fileName}`)
          .then(res => res.text())
          .then(jsContent => {
            const fakeWindow = { SONG_DATA: [] };
            try {
              const run = new Function('window', jsContent);
              run(fakeWindow);
            } catch (e) {
              console.warn(`执行 ${fileName} 出错:`, e.message);
            }
            return fakeWindow.SONG_DATA.map(song => ({
              ...song,
              source: fileName
            }));
          })
          .catch(() => [])
      );

      const songArrays = await Promise.all(loadTasks);
      allSongs = songArrays.flat();
      bootstrapTotalSongs = allSongs.length;
      bootstrapTotalUnique = getUniqueSongCount(allSongs);
      sourceStats = buildStaticSourceStats();
    }

    dataLoaded = true;
    renderSourceTabs();
    setReadyState(true);
    updateStat('数据已加载，请输入内容开始分析');
    loadDupCopyAiMeta();
  } catch (err) {
    setReadyState(false, `歌库加载失败：${err.message}`);
    updateStat(`数据加载失败: ${err.message}`);
  }
}

function updateStat(text) {
  const stat = document.getElementById('statInfo');
  if (stat) stat.textContent = text;
}

function normalizeDupStatsText(text) {
  return String(text || '').split(' | ').map((part) => {
    if (/^非重复\s+/.test(part)) return part.replace(/^非重复/, '未收录');
    if (/^首次\s+/.test(part)) return part.replace(/^首次/, '未收录');
    if (/^重复\s+/.test(part)) return part.replace(/^重复/, '已收录');
    return part;
  }).join(' | ');
}

function getBvInputSummary() {
  const input = document.getElementById('bvInput');
  const lines = String(input?.value || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const validCount = lines.filter(line => extractBV(line)).length;
  return {
    lineCount: lines.length,
    validCount
  };
}

function updateBvInputMeta() {
  const meta = document.getElementById('bvInputMeta');
  if (!meta) return;
  const inputSummary = getBvInputSummary();
  const scopeLabel = currentTab === 'all' ? '全部来源' : getSourceAlias(currentTab);
  meta.textContent = `${inputSummary.validCount.toLocaleString()} 个 BV · ${scopeLabel}`;
}

function getDupSummaryStats() {
  const total = analysisResult.length;
  const notFound = analysisResult.filter(item => item.isNotFound).length;
  const found = total - notFound;
  const duplicate = analysisResult.filter(item => !item.isNotFound && item.isDup).length;
  const unique = found - duplicate;
  return { total, found, duplicate, unique, notFound };
}

function renderBvSummary() {
  const container = document.getElementById('bvResultSummary');
  if (!container) return;
  updateBvInputMeta();

  const scopeLabel = currentTab === 'all' ? '全部来源' : getSourceAlias(currentTab);
  if (analysisResult.length === 0) {
    const totalSongs = getSourceSongCount(currentTab);
    const totalUnique = getSourceUniqueCount(currentTab);
    container.innerHTML = `
      <div class="bv-summary-card scope">
        <span>当前库</span>
        <strong>${escapeHtml(scopeLabel)}</strong>
        <em>投稿 ${totalSongs.toLocaleString()} · 去重 ${totalUnique.toLocaleString()}</em>
      </div>
      <div class="bv-summary-card">
        <span>输入</span>
        <strong>${getBvInputSummary().validCount.toLocaleString()}</strong>
        <em>等待分析</em>
      </div>
      <div class="bv-summary-card">
        <span>结果</span>
        <strong>-</strong>
        <em>尚未生成</em>
      </div>
    `;
    return;
  }

  const stats = getDupSummaryStats();
  container.innerHTML = `
    <div class="bv-summary-card scope">
      <span>当前库</span>
      <strong>${escapeHtml(scopeLabel)}</strong>
      <em>总计 ${stats.total.toLocaleString()}</em>
    </div>
    <div class="bv-summary-card danger">
      <span>已收录</span>
      <strong>${stats.duplicate.toLocaleString()}</strong>
      <em>库内已有</em>
    </div>
    <div class="bv-summary-card success">
      <span>未收录</span>
      <strong>${stats.unique.toLocaleString()}</strong>
      <em>库内未见</em>
    </div>
    <div class="bv-summary-card warn">
      <span>未找到</span>
      <strong>${stats.notFound.toLocaleString()}</strong>
      <em>需复核</em>
    </div>
  `;
}

function renderSourceTabs() {
  const container = document.getElementById('tabContainer');
  if (!container) return;
  container.className = 'source-tabs dup-source-tabs';
  const isCompact = window.matchMedia?.('(max-width: 980px)').matches;
  const sourceItems = ['all', ...getSortedSourceFiles()];
  const currentLabel = currentTab === 'all' ? '全部来源' : getSourceAlias(currentTab);
  const currentCount = getSourceSongCount(currentTab);

  container.innerHTML = `
    <details class="dup-source-panel"${isCompact ? '' : ' open'}>
      <summary class="dup-source-summary">
        ${sourceAvatarHtml(currentTab, 'summary-avatar', currentLabel)}
        <span class="dup-source-summary-text">
          <span>来源</span>
          <strong>${escapeHtml(currentLabel)}</strong>
        </span>
        <span class="dup-source-summary-count">${currentCount.toLocaleString()}</span>
      </summary>
      <div class="dup-source-panel-body">
        <input type="search" class="dup-source-search" placeholder="筛选来源" aria-label="筛选来源">
        <div class="dup-source-meta">${escapeHtml(getCurrentSourceDisplayLabel())}</div>
        <div class="dup-source-list" role="listbox" aria-label="来源列表">
          ${sourceItems.map(source => {
            const label = source === 'all' ? '全部来源' : getSourceAlias(source);
            const count = getSourceSongCount(source);
            const unique = getSourceUniqueCount(source);
            const active = source === currentTab ? ' active' : '';
            return `
              <button type="button" class="source-option${active}" data-source="${escapeAttr(source)}" data-filter-text="${escapeAttr(label)}" role="option" aria-selected="${source === currentTab ? 'true' : 'false'}">
                ${sourceAvatarHtml(source, 'option-avatar', label)}
                <span class="source-option-text">
                  <span class="source-option-name">${escapeHtml(label)}</span>
                  <span class="source-option-sub">去重 ${unique.toLocaleString()}</span>
                </span>
                <span class="source-count">${count.toLocaleString()}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </details>
  `;

  container.querySelectorAll('.source-option').forEach(button => {
    button.addEventListener('click', () => {
      const source = button.getAttribute('data-source');
      if (!source || source === currentTab) return;
      switchSourceTab(source);
    });
  });

  const searchInput = container.querySelector('.dup-source-search');
  searchInput?.addEventListener('input', () => {
    const keyword = normalizeText(searchInput.value);
    container.querySelectorAll('.source-option').forEach(option => {
      const text = normalizeText(option.getAttribute('data-filter-text') || option.textContent || '');
      option.hidden = !!keyword && !text.includes(keyword);
    });
  });
  updateBvInputMeta();
  renderBvSummary();
}

async function switchSourceTab(tab) {
  currentTab = tab;
  renderSourceTabs();
  if (analysisResult.length > 0 || bvInputItems.length > 0 || titleArtistInputItems.length > 0) {
    await analyzeDuplicates();
  } else {
    updateStat(`当前库 ${getCurrentSourceDisplayLabel()}，请开始分析`);
    renderBvSummary();
  }
}

function getCurrentPool() {
  if (currentTab === 'all') return allSongs;
  return allSongs.filter(song => song.source === currentTab);
}

async function search() {
  if (!dataLoaded) {
    alert('歌库尚未加载完成，请稍后再试');
    return;
  }
  toggleShowMode(false);
  analysisResult = [];
  syncAiCopyButtonState();

  if (currentMode === 'bv') {
    const input = (document.getElementById('bvInput')?.value || '').trim();
    if (!input) {
      alert('请输入 BV 号或链接');
      return;
    }
    const lines = input.split('\n').map(line => line.trim()).filter(Boolean);
    bvInputItems = lines.map(line => ({
      raw: line,
      bv: extractBV(line)
    }));
    if (!bvInputItems.some(item => item.bv)) {
      alert('未识别到有效 BV 号');
      return;
    }
    titleArtistInputItems = [];
  } else {
    const input = (document.getElementById('titleArtistInput')?.value || '').trim();
    if (!input) {
      alert('请输入歌名 - 歌手，或只输入歌手名（可批量）');
      return;
    }
    titleArtistInputItems = parseTitleArtistInput(input);
    if (titleArtistInputItems.length === 0) {
      alert('输入为空或格式无效');
      return;
    }
    bvInputItems = [];
  }

  await analyzeDuplicates();
}

async function requestDupCheckFromApi() {
  const items = currentMode === 'bv' ? bvInputItems : titleArtistInputItems;
  const res = await fetch('/api/dup-check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mode: currentMode,
      source: currentTab,
      items
    })
  });
  if (!res.ok) {
    throw new Error(`分析失败（状态码：${res.status}）`);
  }
  return res.json();
}

async function analyzeDuplicates() {
  if (isApiMode) {
    try {
      updateStat('正在从服务端分析...');
      const payload = await requestDupCheckFromApi();
      analysisResult = Array.isArray(payload.items) ? payload.items : [];
      const elapsedText = Number.isFinite(Number(payload.elapsedMs))
        ? ` | 接口 ${payload.elapsedMs}ms`
        : '';
      updateStat(`${normalizeDupStatsText(payload.statsText || '分析完成')}${elapsedText}`);
      renderBvSummary();
      renderSongList();
      return;
    } catch (error) {
      console.warn('服务端分析失败，回退到本地模式：', error);
      isApiMode = false;
      setReadyState(false, '服务端分析失败，正在回退到静态歌库...');
      await loadAllData(true);
      if (!dataLoaded) return;
    }
  }

  const currentPool = getCurrentPool();
  analysisResult = [];

  if (currentMode === 'bv') {
    bvInputItems.forEach(item => {
      if (!item.bv) {
        analysisResult.push({
          isNotFound: true,
          originalInput: item.raw,
          dupCount: 0,
          isDup: false,
          dupList: [],
          song: null
        });
        return;
      }

      const matchedSongs = allSongs.filter(song => extractBV(song.link) === item.bv);
      if (matchedSongs.length === 0) {
        analysisResult.push({
          isNotFound: true,
          originalInput: item.raw,
          dupCount: 0,
          isDup: false,
          dupList: [],
          song: null
        });
        return;
      }

      matchedSongs.forEach(song => {
        const titleKey = normalizeText(song.title);
        const dupList = currentPool.filter(it => normalizeText(it.title) === titleKey);
        analysisResult.push({
          isNotFound: false,
          originalInput: item.raw,
          song,
          dupList,
          dupCount: dupList.length,
          isDup: dupList.length > 1
        });
      });
    });
  } else {
    titleArtistInputItems.forEach(inputItem => {
      const titleKey = normalizeText(inputItem.title);
      let dupList = [];

      if (inputItem.type === 'artistOnly') {
        dupList = currentPool.filter(song => areArtistsCompatible(song.artist || '', inputItem.artist || ''));
      } else {
        dupList = currentPool.filter(song => normalizeText(song.title) === titleKey);
        if (inputItem.artist) {
          dupList = dupList.filter(song => areArtistsCompatible(song.artist || '', inputItem.artist || ''));
        }
      }

      if (dupList.length === 0) {
        analysisResult.push({
          isNotFound: false,
          originalInput: inputItem.originalLine,
          song: {
            title: inputItem.title || '（按歌手名查询）',
            artist: inputItem.artist || '',
            source: '',
            link: ''
          },
          dupList: [],
          dupCount: 0,
          isDup: false,
          isFirst: true,
          queryType: inputItem.type || 'titleArtist'
        });
      } else {
        analysisResult.push({
          isNotFound: false,
          originalInput: inputItem.originalLine,
          song: dupList[0],
          dupList,
          dupCount: dupList.length,
          isDup: true,
          isFirst: false,
          queryType: inputItem.type || 'titleArtist'
        });
      }
    });
  }

  const total = analysisResult.length;
  const currentScopeLabel = currentTab === 'all' ? '全部来源' : getSourceAlias(currentTab);
  if (currentMode === 'titleArtist') {
    const first = analysisResult.filter(i => !i.isNotFound && i.isFirst).length;
    const exists = total - first;
    updateStat(`总计 ${total} | 已收录 ${exists} | 未收录 ${first} | 当前库 ${currentScopeLabel}`);
  } else {
    const notFound = analysisResult.filter(i => i.isNotFound).length;
    const found = total - notFound;
    const dup = analysisResult.filter(i => !i.isNotFound && i.isDup).length;
    const unique = found - dup;
    updateStat(`总计 ${total} | 找到 ${found} | 未找到 ${notFound} | 已收录 ${dup} | 未收录 ${unique} | 当前库 ${currentScopeLabel}`);
  }

  renderBvSummary();
  renderSongList();
}

function toggleShowMode(onlyUnique) {
  showOnlyUnique = onlyUnique;
  const allBtn = document.getElementById('showAllBtn');
  const uniqueBtn = document.getElementById('showUniqueBtn');
  if (allBtn) allBtn.classList.toggle('active', !onlyUnique);
  if (uniqueBtn) uniqueBtn.classList.toggle('active', onlyUnique);
  renderSongList();
}

function getResultCardClass(item) {
  const classes = ['song-item'];
  if (item.isNotFound) {
    classes.push('not-found');
  } else if (item.isArtistMismatch) {
    classes.push('mismatch', 'dup');
  } else if (currentMode === 'titleArtist' && item.isFirst) {
    classes.push('first', 'unique');
  } else if (item.isDup) {
    classes.push('dup');
  } else {
    classes.push('unique');
  }
  return classes.join(' ');
}

function resultStatusHtml(item) {
  if (item.isNotFound) {
    return '<span class="dup-status-chip status-not-found">未找到</span>';
  }
  if (currentMode === 'titleArtist') {
    if (item.isArtistMismatch) {
      return `<span class="dup-status-chip status-mismatch">歌手疑似不一致 ${item.dupCount || 0}</span>`;
    }
    if (item.isFirst) {
      return '<span class="dup-status-chip status-first">未收录</span>';
    }
    return `<span class="dup-status-chip status-dup">已收录 ${item.dupCount || 0}</span>`;
  }
  return item.isDup
    ? `<span class="dup-status-chip status-dup">已收录 ${item.dupCount || 0}</span>`
    : '<span class="dup-status-chip status-unique">未收录</span>';
}

function resultSourceHtml(song) {
  const sourceText = song?.source ? getSourceAlias(song.source) : '输入值（未收录）';
  const jumpButton = currentMode === 'bv' && song?.source
    ? `<button type="button" class="jump-tab-btn" data-source="${escapeAttr(song.source)}">跳转来源</button>`
    : '';
  return `
    <div class="dup-source-line">
      ${sourceAvatarHtml(song?.source || '', 'result-source-avatar', sourceText)}
      <span>来源：</span>
      <span class="copyable" data-copy="${encodeCopyValue(sourceText)}">${escapeHtml(sourceText)}</span>
      ${jumpButton}
    </div>
  `;
}

function resultLinkHtml(song) {
  const link = String(song?.link || '').trim();
  if (!link) return '<div class="dup-link-line">链接：-</div>';
  return `
    <div class="dup-link-line">
      <span>链接：</span>
      <a class="dup-bili-link" href="${escapeAttr(link)}" target="_blank" rel="noreferrer">${escapeHtml(link)}</a>
    </div>
  `;
}

function renderDupEntry(dup) {
  const dupTitle = dup.title || '';
  const dupArtist = dup.artist || '未知';
  const dupSource = getSourceAlias(dup.source);
  const dupBvid = extractBV(dup.bvid || dup.link || '');
  const dupLink = String(dup.link || '').trim();
  return `
    <div class="dup-item">
      ${coverHtml(dup, 'dup-link-cover')}
      <div class="dup-link-body">
        <div class="dup-link-title">
          ${dupBvid ? `<span class="bv-tag">${escapeHtml(dupBvid)}</span>` : ''}
          <span class="copyable" data-copy="${encodeCopyValue(dupTitle)}">${escapeHtml(dupTitle)}</span>
        </div>
        <div class="dup-link-meta">
          <span class="copyable" data-copy="${encodeCopyValue(dupArtist)}">${escapeHtml(dupArtist)}</span>
          <span class="dup-dot">·</span>
          ${sourceAvatarHtml(dup.source || '', 'dup-inline-avatar', dupSource)}
          <span class="copyable" data-copy="${encodeCopyValue(dupSource)}">${escapeHtml(dupSource)}</span>
        </div>
      </div>
      ${dupLink ? `<a class="dup-open-link" href="${escapeAttr(dupLink)}" target="_blank" rel="noreferrer">打开</a>` : ''}
    </div>
  `;
}

function renderSongList() {
  const container = document.getElementById('resultList');
  if (!container) return;
  container.innerHTML = '';

  let viewItems = analysisResult.slice();
  if (showOnlyUnique) {
    if (currentMode === 'titleArtist') {
      viewItems = viewItems.filter(item => !item.isNotFound && !!item.isFirst);
    } else {
      viewItems = viewItems.filter(item => !item.isNotFound && !item.isDup);
    }
  }

  if (viewItems.length === 0) {
    container.innerHTML = '<div class="dup-empty">暂无结果</div>';
    syncAiCopyButtonState();
    return;
  }

  viewItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = getResultCardClass(item);

    if (item.isNotFound) {
      card.innerHTML = `
        <div class="dup-result-main">
          <div class="dup-cover no-cover" aria-hidden="true">?</div>
          <div class="dup-result-body">
            <div class="dup-title-line">
              <span class="result-index">${index + 1}.</span>
              <span class="song-title">${escapeHtml(item.originalInput || '未识别输入')}</span>
              ${resultStatusHtml(item)}
            </div>
            <div class="meta-info">请尝试切换来源或修正输入格式。</div>
          </div>
        </div>
      `;
      container.appendChild(card);
      return;
    }

    const song = item.song;
    const dupPreviewLimit = currentMode === 'bv' ? 2 : 5;
    const previewItems = item.dupList.slice(0, dupPreviewLimit);
    const hiddenDupCount = Math.max(0, item.dupList.length - previewItems.length);
    const dupPreview = previewItems
      .map(renderDupEntry)
      .join('');
    const dupMore = hiddenDupCount > 0
      ? `<div class="dup-more-note">还有 ${hiddenDupCount.toLocaleString()} 条已收录记录，复制 TSV 可查看完整列表</div>`
      : '';

    card.innerHTML = `
      <div class="dup-result-main">
        ${coverHtml(song)}
        <div class="dup-result-body">
          <div class="dup-title-line">
            <span class="result-index">${index + 1}.</span>
            <span class="song-title"><span class="copyable" data-copy="${encodeCopyValue(song.title || '')}">${escapeHtml(song.title || '')}</span></span>
            ${resultStatusHtml(item)}
          </div>
          <div class="dup-artist-line">
            <span>歌手：</span>
            <span class="copyable" data-copy="${encodeCopyValue(song.artist || '')}">${escapeHtml(song.artist || '未知')}</span>
          </div>
          ${resultSourceHtml(song)}
          ${resultLinkHtml(song)}
        </div>
      </div>
      <div class="dup-list">${dupPreview ? `${dupPreview}${dupMore}` : '<div class="dup-empty inline">当前库未收录</div>'}</div>
    `;

    card.querySelectorAll('.copyable').forEach(copyEl => {
      copyEl.title = '点击复制';
      copyEl.addEventListener('click', () => {
        const encoded = copyEl.getAttribute('data-copy') || '';
        const text = encoded ? decodeURIComponent(encoded) : (copyEl.textContent || '');
        navigator.clipboard.writeText((text || '').trim())
          .then(showCopyToast)
          .catch(() => alert('复制失败，请手动复制'));
      });
    });

    card.querySelectorAll('.jump-tab-btn').forEach(jumpBtn => {
      jumpBtn.addEventListener('click', () => {
        const source = jumpBtn.getAttribute('data-source');
        if (!source) return;
        currentTab = source;
        renderSourceTabs();
        analyzeDuplicates();
      });
    });

    container.appendChild(card);
  });
  syncAiCopyButtonState();
  renderBvSummary();
}

function copyResults() {
  if (analysisResult.length === 0) {
    alert('暂无可复制结果');
    return;
  }

  const fields = [
    { key: 'status', label: '状态', enabled: !!document.getElementById('copyStatus')?.checked },
    { key: 'original', label: '输入值', enabled: !!document.getElementById('copyOriginal')?.checked },
    { key: 'title', label: '歌名', enabled: !!document.getElementById('copyTitle')?.checked },
    { key: 'artist', label: '歌手', enabled: !!document.getElementById('copyArtist')?.checked },
    { key: 'source', label: '来源', enabled: !!document.getElementById('copySource')?.checked },
    { key: 'link', label: '链接', enabled: !!document.getElementById('copyLink')?.checked },
    { key: 'bvid', label: 'BV号', enabled: !!document.getElementById('copyBvid')?.checked },
    { key: 'dupCount', label: '已收录数', enabled: !!document.getElementById('copyDupCount')?.checked }
  ].filter(field => field.enabled);
  const isTextFormat = !!document.getElementById('copyText')?.checked;
  const separator = getCopySeparator();

  const copyData = getFilteredAnalysisItemsForCopy();
  if (copyData.length === 0) {
    alert('筛选后无可复制项');
    return;
  }
  if (fields.length === 0) {
    alert('请至少选择一个复制字段');
    return;
  }

  const rows = copyData.map(item => buildCopyRecord(item));
  let content = '';
  if (isTextFormat) {
    content = rows.map(row => fields.map(field => row[field.key] ?? '').join(separator)).join('\n');
  } else {
    const header = fields.map(field => field.label).join('\t');
    const body = rows.map(row => fields.map(field => row[field.key] ?? '').join('\t')).join('\n');
    content = `${header}\n${body}`;
  }

  navigator.clipboard.writeText(content.trim())
    .then(showCopyToast)
    .catch(() => alert('复制失败，请手动复制'));
}

function setChecked(id, checked) {
  const el = document.getElementById(id);
  if (el) el.checked = !!checked;
}

function applyCopyPreset(preset) {
  const normalized = String(preset || '').trim();
  setChecked('copyOriginal', false);
  setChecked('copyTitle', true);
  setChecked('copyArtist', true);
  setChecked('copySource', false);
  setChecked('copyLink', false);
  setChecked('copyBvid', false);
  setChecked('copyDupCount', false);
  setChecked('copyStatus', false);
  setChecked('copyText', true);
  setChecked('copyTable', false);

  const separator = document.getElementById('copySeparator');
  if (separator) separator.value = ' - ';

  if (normalized === 'titleArtistLink') {
    setChecked('copyLink', true);
    if (separator) separator.value = ' ';
  } else if (normalized === 'tsv') {
    setChecked('copyStatus', true);
    setChecked('copySource', true);
    setChecked('copyLink', true);
    setChecked('copyBvid', true);
    setChecked('copyText', false);
    setChecked('copyTable', true);
    if (separator) separator.value = '\\t';
  }

  saveDupCopySettings();
  copyResults();
}

async function copyResultsWithAi() {
  if (analysisResult.length === 0) {
    alert('暂无可复制结果');
    return;
  }

  const copyData = getFilteredAnalysisItemsForCopy();
  if (copyData.length === 0) {
    alert('筛选后无可复制项');
    return;
  }

  setAiCopyBusy(true);
  try {
    const response = await fetch('/api/dup-copy-clean', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: currentMode,
        items: buildAiCopyRequestItems(copyData)
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (payload?.fallbackText) {
        await navigator.clipboard.writeText(String(payload.fallbackText || '').trim());
        showCopyToast();
        alert(`AI 清洗暂不可用，已回退普通整理文段。\n${payload.error || 'unknown error'}`);
        return;
      }
      throw new Error(payload?.error || `请求失败（${response.status}）`);
    }
    const text = String(payload?.text || '').trim();
    if (!text) {
      throw new Error('AI 未返回可复制内容');
    }
    await navigator.clipboard.writeText(text);
    showCopyToast();
  } catch (error) {
    console.error('AI 清洗复制失败:', error);
    alert(`AI 清洗复制失败：${error.message}`);
  } finally {
    setAiCopyBusy(false);
  }
}

function initDupCheckPage(mode) {
  currentMode = mode;
  restoreDupCopySettings();
  bindDupCopySettingsPersistence();
  loadAllData();

  document.getElementById('searchBtn')?.addEventListener('click', () => {
    search();
  });
  document.getElementById('showAllBtn')?.addEventListener('click', () => toggleShowMode(false));
  document.getElementById('showUniqueBtn')?.addEventListener('click', () => toggleShowMode(true));
  document.getElementById('copyBtn')?.addEventListener('click', copyResults);
  document.getElementById('copyAiBtn')?.addEventListener('click', copyResultsWithAi);
  document.getElementById('copyOnlyUnique')?.addEventListener('change', syncAiCopyButtonState);
  document.querySelectorAll('[data-copy-preset]').forEach(button => {
    button.addEventListener('click', () => applyCopyPreset(button.getAttribute('data-copy-preset')));
  });

  document.getElementById('bvInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && currentMode === 'bv') search();
  });
  document.getElementById('bvInput')?.addEventListener('input', updateBvInputMeta);
  document.getElementById('titleArtistInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && currentMode === 'titleArtist' && !e.shiftKey) {
      e.preventDefault();
      search();
    }
  });
  syncAiCopyButtonState();
  renderBvSummary();
}
