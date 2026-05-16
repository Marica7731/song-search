// Shared duplicate-check logic for:
// 1) bv-dup-check.html
// 2) title-artist-dup-check.html

let allSongs = [];
let fileList = [];
let fileAlias = {};
let sourceStats = {};
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

function getSourceAlias(source) {
  if (!source) return '未知来源';
  const key = source.replace('.js', '');
  return fileAlias[key] || source;
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
  if (Number.isNaN(parsed) || parsed < 1) return null;
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

  const currentLink = String(item?.song?.link || '').trim();
  const filtered = currentLink ? links.filter(link => link !== currentLink) : links.slice();
  return filtered.length > 0 ? filtered : links;
}

function getLinkForCopy(item) {
  if (!item || !item.song) return '';
  if (currentMode !== 'bv') return item.song.link || '';
  const links = getDuplicateLinkCandidatesForCopy(item);
  if (links.length === 0) return item.song.link || '';

  const nth = getCopyDuplicateIndex();
  const rank = nth == null ? 1 : nth;
  const order = getCopyDuplicateOrder();
  let index = rank - 1;
  if (order === 'from-end') {
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

function getResultStatusText(item) {
  if (!item) return '';
  if (item.isNotFound) return '未找到';
  if (currentMode === 'titleArtist') {
    if (item.isArtistMismatch) return `歌手疑似不一致（${item.dupCount || 0}）`;
    return item.isFirst ? '首次' : `已收录（${item.dupCount || 0}）`;
  }
  return item.isDup ? `重复（${item.dupCount || 0}）` : '唯一';
}

function buildCopyRecord(item) {
  const song = item?.song || {};
  const sourceText = song.source ? getSourceAlias(song.source) : '输入值（库内首次）';
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

function renderSourceTabs() {
  const container = document.getElementById('tabContainer');
  if (!container) return;
  container.innerHTML = '';

  const select = document.createElement('select');
  select.className = 'source-select';

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = getSourceOptionLabel('all');
  select.appendChild(allOption);

  fileList.forEach(fileName => {
    const option = document.createElement('option');
    option.value = fileName;
    option.textContent = getSourceOptionLabel(fileName);
    select.appendChild(option);
  });

  select.value = currentTab;
  select.addEventListener('change', () => {
    if (!select.value) return;
    switchSourceTab(select.value);
  });

  const meta = document.createElement('span');
  meta.className = 'source-meta';
  meta.textContent = getCurrentSourceDisplayLabel();

  container.appendChild(select);
  container.appendChild(meta);
}

async function switchSourceTab(tab) {
  currentTab = tab;
  renderSourceTabs();
  if (analysisResult.length > 0 || bvInputItems.length > 0 || titleArtistInputItems.length > 0) {
    await analyzeDuplicates();
  } else {
    updateStat(`当前库 ${getCurrentSourceDisplayLabel()}，请开始分析`);
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
      alert('请输入歌手或 歌名 - 歌手 格式（可批量）');
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
      updateStat(`${payload.statsText || '分析完成'}${elapsedText}`);
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
            title: inputItem.title || '（仅歌手查询）',
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
    updateStat(`总计 ${total} | 已收录 ${exists} | 首次 ${first} | 当前库 ${currentScopeLabel}`);
  } else {
    const notFound = analysisResult.filter(i => i.isNotFound).length;
    const found = total - notFound;
    const dup = analysisResult.filter(i => !i.isNotFound && i.isDup).length;
    const unique = found - dup;
    updateStat(`总计 ${total} | 找到 ${found} | 未找到 ${notFound} | 重复 ${dup} | 非重复 ${unique} | 当前库 ${currentScopeLabel}`);
  }

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
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#6c757d;">暂无结果</div>';
    syncAiCopyButtonState();
    return;
  }

  viewItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `song-item ${item.isNotFound ? 'not-found' : (item.isDup ? 'dup' : 'unique')}`;

    if (item.isNotFound) {
      card.innerHTML = `
        <div class="song-title">${index + 1}. ${escapeHtml(item.originalInput || '未识别输入')} <span class="not-found-tag">未找到</span></div>
        <div class="meta-info">请尝试切换来源或修正输入格式。</div>
      `;
      container.appendChild(card);
      return;
    }

    const song = item.song;
    const dupPreview = item.dupList
      .slice(0, 5)
      .map(dup => {
        const dupTitle = dup.title || '';
        const dupArtist = dup.artist || '未知';
        const dupSource = getSourceAlias(dup.source);
        return `<div class="dup-item"><span class="bv-tag">${escapeHtml(extractBV(dup.link))}</span><span class="copyable" data-copy="${encodeCopyValue(dupTitle)}">${escapeHtml(dupTitle)}</span> - <span class="copyable" data-copy="${encodeCopyValue(dupArtist)}">${escapeHtml(dupArtist)}</span> | <span class="copyable" data-copy="${encodeCopyValue(dupSource)}">${escapeHtml(dupSource)}</span></div>`;
      })
      .join('');

    const statusTag = currentMode === 'titleArtist'
      ? (item.isArtistMismatch
        ? `<span class="dup-tag">歌手疑似不一致 ${item.dupCount}</span>`
        : item.isFirst
        ? '<span class="unique-tag">首次</span>'
        : `<span class="dup-tag">重复 ${item.dupCount}</span>`)
      : (item.isDup
        ? `<span class="dup-tag">重复 ${item.dupCount}</span>`
        : '<span class="unique-tag">唯一</span>');

    card.innerHTML = `
      <div class="song-title">
        ${index + 1}. <span class="copyable" data-copy="${encodeCopyValue(song.title || '')}">${escapeHtml(song.title || '')}</span>
        ${statusTag}
      </div>
      <div class="meta-info">
        <div>歌手：<span class="copyable" data-copy="${encodeCopyValue(song.artist || '')}">${escapeHtml(song.artist || '未知')}</span></div>
        <div>来源：<span class="copyable" data-copy="${encodeCopyValue(song.source ? getSourceAlias(song.source) : '输入值（库内首次）')}">${escapeHtml(song.source ? getSourceAlias(song.source) : '输入值（库内首次）')}</span>${currentMode === 'bv' && song.source ? ` <button type="button" class="jump-tab-btn" data-source="${escapeHtml(song.source)}" style="margin-left:8px;padding:2px 8px;border:1px solid #00a1d6;border-radius:12px;background:#fff;color:#00a1d6;font-size:12px;cursor:pointer;">跳转来源</button>` : ''}</div>
        <div>链接：${song.link ? `<a href="${escapeHtml(song.link)}" target="_blank" rel="noreferrer" style="color:#00a1d6;">${escapeHtml(song.link)}</a>` : '-'}</div>
      </div>
      <div class="dup-list">${dupPreview || '<div style="color:#28a745;">当前库未收录，记为首次</div>'}</div>
    `;

    card.querySelectorAll('.copyable').forEach(copyEl => {
      copyEl.style.cursor = 'pointer';
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
    { key: 'dupCount', label: '重复数', enabled: !!document.getElementById('copyDupCount')?.checked }
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
  document.getElementById('titleArtistInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && currentMode === 'titleArtist' && !e.shiftKey) {
      e.preventDefault();
      search();
    }
  });
  syncAiCopyButtonState();
}
