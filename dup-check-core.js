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

function extractBV(str) {
  if (!str) return '';
  const match = String(str).match(/BV[a-zA-Z0-9]+/);
  return match ? match[0] : '';
}

function normalizeText(value) {
  return (value || '').toLowerCase().trim();
}

function encodeCopyValue(value) {
  return encodeURIComponent(value == null ? '' : String(value));
}

function getSourceAlias(source) {
  if (!source) return '未知来源';
  const key = source.replace('.js', '');
  return fileAlias[key] || source;
}

function getSourceOptionLabel(source) {
  if (source === 'all') {
    return `全部 | 投稿 ${bootstrapTotalSongs} | 去重 ${bootstrapTotalUnique}`;
  }
  const stat = sourceStats[source];
  const alias = getSourceAlias(source);
  if (!stat) return alias;
  return `${alias} | 投稿 ${stat.totalSongs} | 去重 ${stat.totalUnique}`;
}

function isSameSong(songA, songB) {
  const titleA = normalizeText(songA.title || '');
  const titleB = normalizeText(songB.title || '');
  if (titleA !== titleB) return false;
  const artistA = normalizeText(songA.artist || '');
  const artistB = normalizeText(songB.artist || '');
  return artistA === artistB;
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

async function loadAllData() {
  try {
    try {
      const bootstrapRes = await fetch('/api/bootstrap');
      if (bootstrapRes.ok) {
        const bootstrapData = await bootstrapRes.json();
        fileList = bootstrapData.files || [];
        fileAlias = bootstrapData.fileToAlias || {};
        sourceStats = bootstrapData.sourceStats || {};
        bootstrapTotalSongs = bootstrapData.totalSongs || 0;
        bootstrapTotalUnique = bootstrapData.totalUnique || 0;
        renderSourceTabs();
        updateStat('来源已加载，正在加载数据...');
      }
    } catch (bootstrapError) {
      console.warn('Bootstrap 加载失败：', bootstrapError);
    }

    try {
      const apiRes = await fetch('/api/all-songs');
      if (!apiRes.ok) throw new Error(`API 状态码 ${apiRes.status}`);
      const apiData = await apiRes.json();
      fileList = apiData.files || fileList || [];
      fileAlias = apiData.fileToAlias || fileAlias || {};
      sourceStats = apiData.sourceStats || sourceStats || {};
      allSongs = Array.isArray(apiData.items) ? apiData.items : [];
      if (!bootstrapTotalSongs) bootstrapTotalSongs = apiData.items?.length || 0;
      if (!bootstrapTotalUnique) bootstrapTotalUnique = getUniqueSongCount(allSongs);
    } catch (apiError) {
      console.warn('API 数据加载失败，回退到静态模式：', apiError);
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
    updateStat('数据已加载，请输入内容开始分析');
  } catch (err) {
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

  const allTab = document.createElement('div');
  allTab.className = `source-tab ${currentTab === 'all' ? 'active' : ''}`;
  allTab.textContent = getSourceOptionLabel('all');
  allTab.onclick = () => switchSourceTab('all');
  container.appendChild(allTab);

  const select = document.createElement('select');
  select.className = 'source-select';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '选择来源（右侧含投稿/去重）';
  select.appendChild(placeholder);

  fileList.forEach(fileName => {
    const option = document.createElement('option');
    option.value = fileName;
    option.textContent = getSourceOptionLabel(fileName);
    select.appendChild(option);
  });

  select.value = currentTab === 'all' ? '' : currentTab;
  select.addEventListener('change', () => {
    if (!select.value) return;
    switchSourceTab(select.value);
  });
  container.appendChild(select);
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

  analyzeDuplicates();
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
    titleArtistInputItems.forEach(inputItem => {
      const titleKey = normalizeText(inputItem.title);
      const artistKey = normalizeText(inputItem.artist);
      let dupList = [];

      if (inputItem.type === 'artistOnly') {
        dupList = currentPool.filter(song => normalizeText(song.artist) === artistKey);
      } else {
        dupList = currentPool.filter(song => normalizeText(song.title) === titleKey);
        if (inputItem.artist) {
          dupList = dupList.filter(song => normalizeText(song.artist) === artistKey);
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
  if (currentMode === 'titleArtist') {
    const first = analysisResult.filter(i => !i.isNotFound && i.isFirst).length;
    const exists = total - first;
    updateStat(`总计 ${total} | 已收录 ${exists} | 首次 ${first} | 当前库 ${getSourceAlias(currentTab)}`);
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
    card.className = `song-item ${item.isNotFound ? 'not-found' : (item.isDup ? 'dup' : 'unique')}`;

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

    const statusTag = currentMode === 'titleArtist'
      ? (item.isFirst
        ? '<span class="unique-tag">首次</span>'
        : `<span class="dup-tag">重复 ${item.dupCount}</span>`)
      : (item.isDup
        ? `<span class="dup-tag">重复 ${item.dupCount}</span>`
        : '<span class="unique-tag">唯一</span>');

    card.innerHTML = `
      <div class="song-title">
        ${index + 1}. <span class="copyable" data-copy="${encodeCopyValue(song.title || '')}">${song.title}</span>
        ${statusTag}
      </div>
      <div class="meta-info">
        <div>歌手：<span class="copyable" data-copy="${encodeCopyValue(song.artist || '')}">${song.artist || '未知'}</span></div>
        <div>来源：<span class="copyable" data-copy="${encodeCopyValue(song.source ? getSourceAlias(song.source) : '输入值（库内首次）')}">${song.source ? getSourceAlias(song.source) : '输入值（库内首次）'}</span>${currentMode === 'bv' && song.source ? ` <button type="button" class="jump-tab-btn" data-source="${song.source}" style="margin-left:8px;padding:2px 8px;border:1px solid #00a1d6;border-radius:12px;background:#fff;color:#00a1d6;font-size:12px;cursor:pointer;">跳转来源</button>` : ''}</div>
        <div>链接：${song.link ? `<a href="${song.link}" target="_blank" style="color:#00a1d6;">${song.link}</a>` : '-'}</div>
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
      if (includeSource) parts.push(item.song.source ? getSourceAlias(item.song.source) : '输入值（库内首次）');
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
      const row = [currentMode === 'titleArtist' ? (item.isFirst ? '首次' : `重复${item.dupCount}`) : (item.isDup ? '重复' : '唯一')];
      if (includeTitle) row.push(item.song.title || '未知歌曲');
      if (includeSource) row.push(item.song.source ? getSourceAlias(item.song.source) : '输入值（库内首次）');
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
