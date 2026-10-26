// Shared duplicate-check logic for:
// 1) bv-dup-check.html
// 2) title-artist-dup-check.html

let allSongs = [];
let fileList = [];
let fileAlias = {};
let currentTab = 'all';
let analysisResult = [];
let showOnlyUnique = false;
let currentMode = 'bv';
let bvInputItems = [];
let titleArtistInputItems = [];
let sourceLoadStates = [];
let dataLoadSummary = { expected: 0, loaded: 0, failed: [], attempted: false, indexError: '' };

function extractBV(str) {
  if (!str) return '';
  const match = String(str).match(/BV[a-zA-Z0-9]+/);
  return match ? match[0] : '';
}

function normalizeText(value) {
  return String(value == null ? '' : value)
    .normalize('NFC')
    .replace(/[\uFF61-\uFF9F]+/g, value => value.normalize('NFKC'))
    .replace(/[\uFF01-\uFF5E]/g, value => String.fromCharCode(value.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function encodeCopyValue(value) {
  return encodeURIComponent(value == null ? '' : String(value));
}

function getSourceAlias(source) {
  if (!source) return '未知来源';
  const key = source.replace('.js', '');
  return fileAlias[key] || source;
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

function getLinkForCopy(item) {
  if (!item || !item.song) return '';
  if (currentMode !== 'bv') return item.song.link || '';
  const dupList = Array.isArray(item.dupList) ? item.dupList : [];
  if (dupList.length === 0) return item.song.link || '';

  const nth = getCopyDuplicateIndex();
  if (nth == null) {
    return dupList[dupList.length - 1]?.link || item.song.link || '';
  }

  const index = Math.max(0, Math.min(dupList.length - 1, nth - 1));
  return dupList[index]?.link || item.song.link || '';
}

function showCopyToast() {
  const toast = document.getElementById('copyToast');
  if (!toast) return;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function parseTitleArtistInput(input) {
  if (!input.trim()) return [];
  const lines = input
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^\|\s*/, '').replace(/\s*\|$/, '').trim())
    .filter(line => line && !/^[-|]+$/.test(line));
  const fullFormatRegex = /^(\d+)[\.\)]\s*(.+?)\s*-\s*(.+)$/;
  const normalRegex = /^(.+?)\s*-\s*(.+)$/;
  const result = [];

  lines.forEach(line => {
    const full = line.match(fullFormatRegex);
    if (full) {
      result.push({
        title: full[2].trim(),
        artist: full[3].trim(),
        originalLine: line
      });
      return;
    }
    const normal = line.match(normalRegex);
    if (normal) {
      result.push({
        title: normal[1].trim(),
        artist: normal[2].trim(),
        originalLine: line
      });
      return;
    }
    result.push({
      title: line.trim(),
      artist: '',
      originalLine: line
    });
  });

  return result;
}

function getResponseError(response) {
  const statusText = String(response.statusText || '').trim();
  return 'HTTP ' + response.status + (statusText ? ' ' + statusText : '');
}

async function loadSongSources(fetchImpl = (...args) => fetch(...args)) {
  const indexResponse = await fetchImpl('data/index.json');
  if (!indexResponse.ok) throw new Error('data/index.json ' + getResponseError(indexResponse));

  const indexData = await indexResponse.json();
  if (!indexData || !Array.isArray(indexData.files) || indexData.files.length === 0) {
    throw new Error('data/index.json 格式错误：files 必须是非空数组');
  }
  if (indexData.files.some(fileName =>
    typeof fileName !== 'string' || !fileName.endsWith('.js') || fileName.includes('/') || fileName.includes('\\')
  )) {
    throw new Error('data/index.json 格式错误：来源文件名无效');
  }
  if (new Set(indexData.files).size !== indexData.files.length) {
    throw new Error('data/index.json 格式错误：来源文件名重复');
  }

  const sourceStates = await Promise.all(indexData.files.map(async fileName => {
    try {
      const response = await fetchImpl('data/' + fileName);
      if (!response.ok) throw new Error(getResponseError(response));

      const jsContent = await response.text();
      const fakeWindow = {};
      new Function('window', jsContent)(fakeWindow);
      if (!Array.isArray(fakeWindow.SONG_DATA)) {
        throw new Error('SONG_DATA 缺失或不是数组');
      }
      for (let index = 0; index < fakeWindow.SONG_DATA.length; index += 1) {
        const song = fakeWindow.SONG_DATA[index];
        if (!song || typeof song !== 'object' || Array.isArray(song)) {
          throw new Error('SONG_DATA 第 ' + (index + 1) + ' 条不是对象');
        }
        if (typeof song.title !== 'string' || typeof song.artist !== 'string' || typeof song.link !== 'string') {
          throw new Error('SONG_DATA 第 ' + (index + 1) + ' 条缺少有效的 title、artist 或 link');
        }
      }

      return {
        fileName,
        success: true,
        error: '',
        songs: fakeWindow.SONG_DATA.map(song => ({ ...song, source: fileName }))
      };
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      console.warn('加载 ' + fileName + ' 失败:', message);
      return { fileName, success: false, error: message, songs: [] };
    }
  }));

  const failed = sourceStates.filter(source => !source.success);
  const songs = sourceStates.filter(source => source.success).flatMap(source => source.songs);
  return {
    files: indexData.files,
    aliases: indexData.fileToAlias && typeof indexData.fileToAlias === 'object' && !Array.isArray(indexData.fileToAlias)
      ? indexData.fileToAlias
      : {},
    sourceStates,
    songs,
    summary: {
      expected: indexData.files.length,
      loaded: sourceStates.length - failed.length,
      failed,
      attempted: true,
      indexError: ''
    }
  };
}

function updateLoadStatus() {
  const element = document.getElementById('loadStatus');
  if (!element) return;

  if (!dataLoadSummary.attempted) {
    element.className = 'load-status';
    element.textContent = '正在加载来源库……';
    return;
  }
  if (dataLoadSummary.indexError) {
    element.className = 'load-status load-status-error';
    element.textContent = '查重库不可用：来源索引加载失败。' + dataLoadSummary.indexError + '。未命中结果无法判为全新歌名。';
    return;
  }

  const total = dataLoadSummary.expected;
  const loaded = dataLoadSummary.loaded;
  const failed = dataLoadSummary.failed;
  const coverage = '来源覆盖：' + loaded + '/' + total + ' 成功，' + failed.length + ' 个失败。';
  element.className = failed.length ? 'load-status load-status-error' : 'load-status load-status-ok';
  if (failed.length === 0) {
    element.textContent = '来源加载完整：' + loaded + '/' + total + ' 成功，0 个失败。';
    return;
  }

  const failures = failed.map(source => source.fileName + '：' + source.error).join('；');
  element.textContent = coverage + '未命中不能判为全新歌名。失败来源：' + failures;
}

function isCurrentPoolComplete() {
  if (!dataLoadSummary.attempted || dataLoadSummary.indexError) return false;
  if (currentTab === 'all') return dataLoadSummary.failed.length === 0;
  const source = sourceLoadStates.find(item => item.fileName === currentTab);
  return !!source && source.success;
}

async function loadAllData() {
  dataLoadSummary = { expected: 0, loaded: 0, failed: [], attempted: false, indexError: '' };
  fileList = [];
  fileAlias = {};
  sourceLoadStates = [];
  allSongs = [];
  updateLoadStatus();

  try {
    const loadedData = await loadSongSources();
    fileList = loadedData.files;
    fileAlias = loadedData.aliases;
    sourceLoadStates = loadedData.sourceStates;
    allSongs = loadedData.songs;
    dataLoadSummary = loadedData.summary;
    renderSourceTabs();
    updateLoadStatus();
    if (analysisResult.length > 0) {
      analyzeDuplicates();
    } else if (dataLoadSummary.failed.length > 0) {
      updateStat('数据加载不完整：' + dataLoadSummary.loaded + '/' + dataLoadSummary.expected + ' 个来源成功；请查看失败来源和原因。');
    } else {
      updateStat('数据加载完整，请输入内容开始分析');
    }
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    dataLoadSummary = { expected: 0, loaded: 0, failed: [], attempted: true, indexError: message };
    renderSourceTabs();
    updateLoadStatus();
    updateStat('数据索引加载失败: ' + message);
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

  const allTab = document.createElement('div');
  allTab.className = `source-tab ${currentTab === 'all' ? 'active' : ''}`;
  allTab.textContent = '全部';
  allTab.onclick = () => switchSourceTab('all');
  container.appendChild(allTab);

  const select = document.createElement('select');
  select.className = 'source-select';

  const placeholder = document.createElement('option');
  placeholder.value = 'all';
  placeholder.textContent = '选择来源';
  select.appendChild(placeholder);

  fileList.forEach(fileName => {
    const option = document.createElement('option');
    option.value = fileName;
    const sourceState = sourceLoadStates.find(item => item.fileName === fileName);
    option.textContent = getSourceAlias(fileName) + (sourceState && !sourceState.success ? '（加载失败）' : '');
    select.appendChild(option);
  });

  select.value = currentTab === 'all' ? 'all' : currentTab;
  select.addEventListener('change', () => switchSourceTab(select.value || 'all'));
  container.appendChild(select);
  updateScopeLabels();
}

function updateScopeLabels() {
  if (currentMode !== 'titleArtist') return;
  const scopeLabel = currentTab === 'all' ? '全新歌名' : '当前来源未收录';
  const uniqueButton = document.getElementById('showUniqueBtn');
  if (uniqueButton) uniqueButton.textContent = '只看' + scopeLabel;
  const onlyUniqueCheckbox = document.getElementById('copyOnlyUnique');
  const checkboxLabel = onlyUniqueCheckbox && onlyUniqueCheckbox.closest('label');
  if (checkboxLabel) checkboxLabel.lastChild.textContent = '仅复制' + scopeLabel;
}

function switchSourceTab(tab) {
  currentTab = tab;
  renderSourceTabs();
  if (analysisResult.length > 0) analyzeDuplicates();
}

function getCurrentPool() {
  if (currentTab === 'all') return allSongs;
  return allSongs.filter(song => song.source === currentTab);
}

function search() {
  toggleShowMode(false);
  analysisResult = [];

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
      alert('请输入 歌名 - 歌手 格式（可批量）');
      return;
    }
    titleArtistInputItems = parseTitleArtistInput(input);
    if (titleArtistInputItems.length === 0) {
      alert('输入为空或格式无效');
      return;
    }
    bvInputItems = [];
  }

  analyzeDuplicates();
}

function analyzeTitleArtistInput(inputItem, currentPool, poolComplete) {
  const titleKey = normalizeText(inputItem.title);
  const artistKey = normalizeText(inputItem.artist);
  const titleMatches = currentPool.filter(song => normalizeText(song.title) === titleKey);
  const pairMatches = inputItem.artist
    ? titleMatches.filter(song => normalizeText(song.artist) === artistKey)
    : [];

  let status;
  if (pairMatches.length > 0) {
    status = 'exact';
  } else if (titleMatches.length > 0 && inputItem.artist) {
    status = 'title-artist-mismatch';
  } else if (titleMatches.length > 0) {
    status = 'title-without-artist';
  } else if (poolComplete) {
    status = 'new-title';
  } else {
    status = 'unknown';
  }

  const isFirst = status === 'new-title';
  return {
    isNotFound: false,
    originalInput: inputItem.originalLine,
    song: pairMatches[0] || {
      title: inputItem.title || '未知歌曲',
      artist: inputItem.artist || '',
      source: '',
      link: ''
    },
    dupList: pairMatches.length > 0 ? pairMatches : titleMatches,
    titleDupList: titleMatches,
    pairDupList: pairMatches,
    titleMatchCount: titleMatches.length,
    artistMatchCount: inputItem.artist ? pairMatches.length : null,
    dupCount: pairMatches.length,
    isDup: pairMatches.length > 0,
    titleExists: titleMatches.length > 0,
    isFirst,
    isIndeterminate: status === 'unknown',
    status
  };
}

function analyzeDuplicates() {
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
    const poolComplete = isCurrentPoolComplete();
    analysisResult = titleArtistInputItems.map(inputItem =>
      analyzeTitleArtistInput(inputItem, currentPool, poolComplete)
    );
  }

  const total = analysisResult.length;
  if (currentMode === 'titleArtist') {
    const newTitles = analysisResult.filter(item => item.isFirst).length;
    const knownTitles = analysisResult.filter(item => item.titleExists).length;
    const pairMatched = analysisResult.filter(item => item.artistMatchCount > 0).length;
    const indeterminate = analysisResult.filter(item => item.isIndeterminate).length;
    const newTitleLabel = currentTab === 'all' ? '全新歌名' : '当前来源未收录';
    updateStat(`总计 ${total} | ${newTitleLabel} ${newTitles} | 歌名已收录 ${knownTitles} | 歌手组合命中 ${pairMatched} | 无法判定 ${indeterminate} | 当前库 ${getSourceAlias(currentTab)}`);
  } else {
    const notFound = analysisResult.filter(i => i.isNotFound).length;
    const found = total - notFound;
    const dup = analysisResult.filter(i => !i.isNotFound && i.isDup).length;
    const unique = found - dup;
    updateStat(`总计 ${total} | 找到 ${found} | 未找到 ${notFound} | 重复 ${dup} | 非重复 ${unique} | 当前库 ${getSourceAlias(currentTab)}`);
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

function getTitleArtistStatusLabel(item) {
  if (item.status === 'new-title') return currentTab === 'all' ? '全新歌名' : '当前来源未收录';
  if (item.status === 'title-artist-mismatch') return '同名已收录，歌手组合未命中';
  if (item.status === 'title-without-artist') return '歌名已收录，未填写歌手';
  if (item.status === 'exact') return '歌名与歌手均已收录';
  return '未检出，无法判定';
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
    return;
  }

  viewItems.forEach((item, index) => {
    const card = document.createElement('div');
    let cardStatus = item.isNotFound ? 'not-found' : (item.isDup ? 'dup' : 'unique');
    if (currentMode === 'titleArtist') {
      if (item.status === 'unknown') cardStatus = 'indeterminate';
      else if (item.status === 'title-artist-mismatch' || item.status === 'title-without-artist') cardStatus = 'same-title';
    }
    card.className = `song-item ${cardStatus}`;

    if (item.isNotFound) {
      card.innerHTML = `
        <div class="song-title">${index + 1}. ${item.originalInput || '未识别输入'} <span class="not-found-tag">未找到</span></div>
        <div class="meta-info">请尝试切换来源或修正输入格式。</div>
      `;
      container.appendChild(card);
      return;
    }

    const song = item.song;
    const dupPreview = item.dupList
      .slice(0, 5)
      .map(dup => `<div class="dup-item"><span class="bv-tag">${extractBV(dup.link)}</span><span class="copyable" data-copy="${encodeCopyValue(dup.title || '')}">${dup.title}</span> - <span class="copyable" data-copy="${encodeCopyValue(dup.artist || '')}">${dup.artist || '未知'}</span> | <span class="copyable" data-copy="${encodeCopyValue(getSourceAlias(dup.source))}">${getSourceAlias(dup.source)}</span></div>`)
      .join('');

    const poolComplete = isCurrentPoolComplete();
    const pairMatchCountLabel = item.dupCount > 1
      ? (poolComplete ? '（' + item.dupCount + ' 条）' : '（已发现 ' + item.dupCount + ' 条）')
      : '';
    const statusTag = currentMode === 'titleArtist'
      ? (item.status === 'new-title'
        ? '<span class="unique-tag">' + getTitleArtistStatusLabel(item) + '</span>'
        : (item.status === 'exact'
          ? `<span class="dup-tag">歌名与歌手均已收录${pairMatchCountLabel}</span>`
          : (item.status === 'unknown'
            ? '<span class="uncertain-tag">未检出，无法判定</span>'
            : '<span class="same-title-tag">' + getTitleArtistStatusLabel(item) + '</span>')))
      : (item.isDup
        ? `<span class="dup-tag">重复 ${item.dupCount}</span>`
        : '<span class="unique-tag">唯一</span>');

    const sourceLabel = song.source ? getSourceAlias(song.source) : (currentMode === 'titleArtist' ? '输入值' : '输入值（库内首次）');
    const titleArtistDetails = currentMode === 'titleArtist'
      ? '<div>歌名命中：' + item.titleMatchCount + ' 条' + (poolComplete ? '' : '（已加载来源）') + '；歌名＋歌手命中：'
        + (item.artistMatchCount === null ? '未查询（未填写歌手）' : item.artistMatchCount + ' 条' + (poolComplete ? '' : '（已加载来源）')) + '</div>'
      : '';
    let emptyDupMessage = '<div style="color:#28a745;">当前库未收录，记为首次</div>';
    if (currentMode === 'titleArtist') {
      if (item.status === 'new-title') emptyDupMessage = '<div style="color:#28a745;">当前' + (currentTab === 'all' ? '所有来源' : '来源') + '已完整加载，歌名未收录。</div>';
      else if (item.status === 'unknown') emptyDupMessage = '<div style="color:#6c757d;">当前查询范围数据不完整，未检出不能判为全新歌名。</div>';
      else if (item.status === 'exact') emptyDupMessage = '<div style="color:#6c757d;">已找到歌名与歌手均匹配的记录。</div>';
    }

    card.innerHTML = `
      <div class="song-title">
        ${index + 1}. <span class="copyable" data-copy="${encodeCopyValue(song.title || '')}">${song.title}</span>
        ${statusTag}
      </div>
      <div class="meta-info">
        <div>歌手：<span class="copyable" data-copy="${encodeCopyValue(song.artist || '')}">${song.artist || '未知'}</span></div>
        <div>来源：<span class="copyable" data-copy="${encodeCopyValue(sourceLabel)}">${sourceLabel}</span>${currentMode === 'bv' && song.source ? ` <button type="button" class="jump-tab-btn" data-source="${song.source}" style="margin-left:8px;padding:2px 8px;border:1px solid #00a1d6;border-radius:12px;background:#fff;color:#00a1d6;font-size:12px;cursor:pointer;">跳转来源</button>` : ''}</div>
        ${titleArtistDetails}
        <div>链接：${song.link ? `<a href="${song.link}" target="_blank" style="color:#00a1d6;">${song.link}</a>` : '-'}</div>
      </div>
      <div class="dup-list">${dupPreview || emptyDupMessage}</div>
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
}

function copyResults() {
  if (analysisResult.length === 0) {
    alert('暂无可复制结果');
    return;
  }

  const onlyUnique = !!document.getElementById('copyOnlyUnique')?.checked;
  const includeTitle = !!document.getElementById('copyTitle')?.checked;
  const includeLink = !!document.getElementById('copyLink')?.checked;
  const includeSource = !!document.getElementById('copySource')?.checked;
  const isTextFormat = !!document.getElementById('copyText')?.checked;

  let copyData = analysisResult.slice();
  if (onlyUnique) {
    if (currentMode === 'titleArtist') {
      copyData = copyData.filter(item => !item.isNotFound && !!item.isFirst);
    } else {
      copyData = copyData.filter(item => !item.isNotFound && !item.isDup);
    }
  }
  if (copyData.length === 0) {
    alert('筛选后无可复制项');
    return;
  }

  let content = '';
  if (isTextFormat) {
    copyData.forEach(item => {
      if (item.isNotFound) {
        content += `[未找到] ${item.originalInput || '未知输入'}\n`;
        return;
      }
      const parts = [];
      if (includeTitle) parts.push(item.song.title || '未知歌曲');
      if (includeSource) parts.push(item.song.source ? getSourceAlias(item.song.source) : (currentMode === 'titleArtist' ? '输入值' : '输入值（库内首次）'));
      if (includeLink) parts.push(getLinkForCopy(item));
      content += parts.join(' | ') + '\n';
    });
  } else {
    const headers = ['状态'];
    if (includeTitle) headers.push('歌名');
    if (includeSource) headers.push('来源');
    if (includeLink) headers.push('链接');
    content += headers.join('\t') + '\n';

    copyData.forEach(item => {
      if (item.isNotFound) {
        content += ['未找到', item.originalInput || '未知输入', '', ''].join('\t') + '\n';
        return;
      }
      const row = [currentMode === 'titleArtist' ? getTitleArtistStatusLabel(item) : (item.isDup ? '重复' : '唯一')];
      if (includeTitle) row.push(item.song.title || '未知歌曲');
      if (includeSource) row.push(item.song.source ? getSourceAlias(item.song.source) : (currentMode === 'titleArtist' ? '输入值' : '输入值（库内首次）'));
      if (includeLink) row.push(getLinkForCopy(item));
      content += row.join('\t') + '\n';
    });
  }

  navigator.clipboard.writeText(content.trim())
    .then(showCopyToast)
    .catch(() => alert('复制失败，请手动复制'));
}

function initDupCheckPage(mode) {
  currentMode = mode;
  loadAllData();

  document.getElementById('searchBtn')?.addEventListener('click', search);
  document.getElementById('showAllBtn')?.addEventListener('click', () => toggleShowMode(false));
  document.getElementById('showUniqueBtn')?.addEventListener('click', () => toggleShowMode(true));
  document.getElementById('copyBtn')?.addEventListener('click', copyResults);

  document.getElementById('bvInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && currentMode === 'bv') search();
  });
  document.getElementById('titleArtistInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && currentMode === 'titleArtist' && !e.shiftKey) {
      e.preventDefault();
      search();
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normalizeText, loadSongSources, analyzeTitleArtistInput };
}
