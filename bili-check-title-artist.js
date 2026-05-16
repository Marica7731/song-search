// title-artist query/validation module

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function parseInputContent() {
  const input = document.getElementById('titleInput').value.trim();
  if (!input) {
    alert('请输入要查询的歌名！');
    return [];
  }

  const lines = input.split('\n').map(line => line.trim()).filter(Boolean);
  const result = [];
  const fullFormatRegex = /^(\d+)\.\s*(.+?)\s+-\s+(.+)$/;
  const normalFormatRegex = /^(.+?)\s+-\s+(.+)$/;
  let hasFullFormat = false;

  lines.forEach(line => {
    const fullMatch = line.match(fullFormatRegex);
    if (fullMatch) {
      hasFullFormat = true;
      result.push({
        title: fullMatch[2].trim(),
        inputArtist: fullMatch[3].trim(),
        line
      });
    } else if (normalFormatRegex.test(line)) {
      const normalMatch = line.match(normalFormatRegex);
      hasFullFormat = true;
      result.push({
        title: normalMatch[1].trim(),
        inputArtist: normalMatch[2].trim(),
        line
      });
    } else {
      result.push({
        title: line.trim(),
        inputArtist: '',
        line
      });
    }
  });

  inputFormatType = hasFullFormat ? 'full' : 'pure';
  return result;
}

function normalizeText(value) {
  if (window.ArtistMatch && typeof window.ArtistMatch.normalizeString === 'function') {
    return window.ArtistMatch.normalizeString(value);
  }
  return (value || '').toLowerCase().trim();
}

function artistsCompatible(left, right) {
  if (window.ArtistMatch && typeof window.ArtistMatch.areArtistsCompatible === 'function') {
    return window.ArtistMatch.areArtistsCompatible(left, right);
  }
  return normalizeText(left) === normalizeText(right);
}

async function fetchTitleLookup(items) {
  const res = await fetch('/api/title-artist/lookup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items })
  });
  if (!res.ok) {
    throw new Error(`查询失败（状态码：${res.status}）`);
  }
  return res.json();
}

async function fetchTitleSuggestions(keyword) {
  const res = await fetch(`/api/title-artist/suggest?q=${encodeURIComponent(keyword)}`);
  if (!res.ok) {
    throw new Error(`建议加载失败（状态码：${res.status}）`);
  }
  return res.json();
}

function getArtistSummaryByTitle(title) {
  const normalizedTitle = normalizeText(title);
  const matchedSongs = allSongs.filter(song => normalizeText(song.title) === normalizedTitle);

  const artistMap = new Map();
  matchedSongs.forEach((song, index) => {
    const artistName = (song.artist || '未知歌手').trim();
    const sourceAlias = getSourceAlias(song.source);
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

  const maxSourceArtist = artists.length > 0 ? artists[0].name : '';
  const artistNames = artists.map(artist => artist.name);
  return { artists, artistNames, maxSourceArtist };
}

function buildTitleArtistResultItem(item) {
  const { artists, artistNames, maxSourceArtist } = getArtistSummaryByTitle(item.title);
  let isArtistValid = false;
  if (item.inputArtist && artistNames.length > 0) {
    isArtistValid = artistNames.some(name => artistsCompatible(name, item.inputArtist));
  }

  return {
    title: item.title,
    inputArtist: item.inputArtist || '',
    artists,
    artistNames,
    maxSourceArtist,
    hasResult: artists.length > 0,
    isArtistValid,
    originalLine: item.line || ''
  };
}

async function buildTitleArtistResultItemViaApi(item) {
  const payload = await fetchTitleLookup([item]);
  return Array.isArray(payload.items) && payload.items.length > 0 ? payload.items[0] : buildTitleArtistResultItem(item);
}

function assignTitleResultKeys() {
  titleSearchResults.forEach((item, index) => {
    if (!item) return;
    item.resultKey = `${index}|${item.title || ''}|${item.inputArtist || ''}|${item.originalLine || ''}`;
  });
}

function getTitleSelectionKey(item) {
  return item?.resultKey || item?.title || '';
}

function setDefaultSelectedArtist(item, previousSelected = '') {
  const key = getTitleSelectionKey(item);
  if (item.hasResult) {
    const fallback = item.maxSourceArtist || item.artistNames[0] || '';
    const canReusePrevious = previousSelected && item.artistNames.includes(previousSelected);
    selectedArtists[key] = canReusePrevious ? previousSelected : fallback;
    return;
  }

  if (item.inputArtist && item.inputArtist.trim()) {
    selectedArtists[key] = item.inputArtist.trim();
    return;
  }

  selectedArtists[key] = '';
}

function getNeteaseSearchUrl(keyword) {
  return `https://music.163.com/#/search/m/?s=${encodeURIComponent(keyword)}&type=1`;
}

function hasUserProvidedArtist(item) {
  return !!String(item?.inputArtist || '').trim();
}

function getNeteaseSearchKeyword(item, { titleOnly = false } = {}) {
  const title = String(item?.title || '').trim();
  if (!title) return '';
  const artist = titleOnly ? '' : String(selectedArtists[getTitleSelectionKey(item)] || item.inputArtist || '').trim();
  return artist ? `${title} - ${artist}` : title;
}

function parseTitleArtistText(text) {
  const value = (text || '').trim();
  if (!value) return { title: '', artist: '' };
  const matched = value.match(/^(.+?)\s+-\s+(.+)$/);
  if (matched) {
    return {
      title: matched[1].trim(),
      artist: matched[2].trim()
    };
  }
  return { title: value, artist: '' };
}

function notifyNamingToolDirectoryRefresh() {
  if (typeof window.refreshNamingToolDirectory === 'function') {
    window.refreshNamingToolDirectory();
  }
}

function setSelectItemDirectoryMeta(selectItem, item) {
  if (!selectItem) return;
  const title = String(item?.title || '').trim();
  const artist = String(selectedArtists[getTitleSelectionKey(item)] || '').trim();
  const label = artist ? `${title} - ${artist}` : title;
  selectItem.dataset.dirTitle = title;
  selectItem.dataset.dirArtist = artist;
  selectItem.dataset.dirLabel = label;
}

function getTitleSuggestions(keyword) {
  const key = normalizeText(keyword);
  if (!key) return [];
  const titleMap = new Map();
  allSongs.forEach(song => {
    const title = (song.title || '').trim();
    if (!title) return;
    const norm = normalizeText(title);
    if (!norm.includes(key)) return;
    if (!titleMap.has(title)) {
      titleMap.set(title, true);
    }
  });
  return Array.from(titleMap.keys()).slice(0, 16);
}

function createRetitleTools(item, index) {
  const tools = document.createElement('div');
  tools.className = 'retitle-tools';
  tools.style.marginTop = '8px';
  tools.style.display = 'flex';
  tools.style.gap = '8px';
  tools.style.flexWrap = 'wrap';
  tools.style.alignItems = 'center';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = item.title;
  titleInput.placeholder = '可修改歌名，支持粘贴“歌名 - 歌手”';
  titleInput.style.flex = '1';
  titleInput.style.minWidth = '220px';
  titleInput.style.padding = '6px 10px';
  titleInput.style.border = '1px solid #ddd';
  titleInput.style.borderRadius = '6px';
  titleInput.style.fontSize = '13px';
  titleInput.style.minHeight = '34px';

  const artistInput = document.createElement('input');
  artistInput.type = 'text';
  artistInput.value = selectedArtists[getTitleSelectionKey(item)] || item.inputArtist || '';
  artistInput.placeholder = '可修改歌手，或粘贴“歌名 - 歌手”';
  artistInput.style.flex = '1';
  artistInput.style.minWidth = '180px';
  artistInput.style.padding = '6px 10px';
  artistInput.style.border = '1px solid #ddd';
  artistInput.style.borderRadius = '6px';
  artistInput.style.fontSize = '13px';
  artistInput.style.minHeight = '34px';

  const suggestionList = document.createElement('datalist');
  const datalistId = `titleSuggestion-${index}-${Date.now()}`;
  suggestionList.id = datalistId;
  titleInput.setAttribute('list', datalistId);

  const renderTitleSuggestions = async () => {
    const currentTitle = parseTitleArtistText(titleInput.value).title || titleInput.value;
    let suggestions = [];
    if (isApiMode) {
      try {
        const payload = await fetchTitleSuggestions(currentTitle);
        suggestions = Array.isArray(payload.items) ? payload.items : [];
      } catch (error) {
        console.warn('标题建议加载失败：', error);
      }
    } else {
      suggestions = getTitleSuggestions(currentTitle);
    }
    suggestionList.innerHTML = suggestions.map(name => `<option value="${escapeHtml(name)}"></option>`).join('');
  };

  const retryBtn = document.createElement('button');
  retryBtn.type = 'button';
  retryBtn.textContent = '按修改值重查';
  retryBtn.style.padding = '6px 12px';
  retryBtn.style.border = '0';
  retryBtn.style.borderRadius = '6px';
  retryBtn.style.background = '#00a1d6';
  retryBtn.style.color = '#fff';
  retryBtn.style.fontSize = '12px';
  retryBtn.style.cursor = 'pointer';

  const applyArtistBtn = document.createElement('button');
  applyArtistBtn.type = 'button';
  applyArtistBtn.textContent = '仅应用歌手';
  applyArtistBtn.style.padding = '6px 12px';
  applyArtistBtn.style.border = '0';
  applyArtistBtn.style.borderRadius = '6px';
  applyArtistBtn.style.background = '#28a745';
  applyArtistBtn.style.color = '#fff';
  applyArtistBtn.style.fontSize = '12px';
  applyArtistBtn.style.cursor = 'pointer';

  const titleOnlyLabel = document.createElement('label');
  titleOnlyLabel.className = 'net-ease-option';
  const titleOnlyInput = document.createElement('input');
  titleOnlyInput.type = 'checkbox';
  titleOnlyInput.disabled = !hasUserProvidedArtist(item);
  if (titleOnlyInput.disabled) {
    titleOnlyLabel.classList.add('disabled');
    titleOnlyLabel.title = '用户没有提供歌手时，该项不可勾选';
  }
  titleOnlyLabel.appendChild(titleOnlyInput);
  titleOnlyLabel.appendChild(document.createTextNode('不带歌手'));

  const link = document.createElement('a');
  const applyCombinedInputFields = () => {
    const parsedFromTitle = parseTitleArtistText(titleInput.value);
    const parsedFromArtist = parseTitleArtistText(artistInput.value);
    let changed = false;

    if (parsedFromTitle.artist) {
      if (titleInput.value.trim() !== parsedFromTitle.title) {
        titleInput.value = parsedFromTitle.title;
        changed = true;
      }
      if (artistInput.value.trim() !== parsedFromTitle.artist) {
        artistInput.value = parsedFromTitle.artist;
        changed = true;
      }
    } else if (parsedFromArtist.artist) {
      if (titleInput.value.trim() !== parsedFromArtist.title) {
        titleInput.value = parsedFromArtist.title;
        changed = true;
      }
      if (artistInput.value.trim() !== parsedFromArtist.artist) {
        artistInput.value = parsedFromArtist.artist;
        changed = true;
      }
    }

    if (changed) {
      refreshSearchLink();
      renderTitleSuggestions();
    }
    return changed;
  };

  const refreshSearchLink = () => {
    const parsedTitle = parseTitleArtistText(titleInput.value);
    const parsedArtist = parseTitleArtistText(artistInput.value);
    const t = (parsedTitle.title || item.title || '').trim();
    const a = (parsedTitle.artist || parsedArtist.artist || artistInput.value || '').trim();
    const keyword = titleOnlyInput.checked ? t : (a ? `${t} - ${a}` : t);
    link.href = getNeteaseSearchUrl(keyword);
  };
  refreshSearchLink();
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = '网易云搜索';
  link.style.display = 'inline-flex';
  link.style.alignItems = 'center';
  link.style.minHeight = '34px';
  link.style.color = '#00a1d6';
  link.style.fontSize = '12px';
  link.style.textDecoration = 'none';

  titleInput.addEventListener('input', () => {
    renderTitleSuggestions();
    refreshSearchLink();
  });
  titleInput.addEventListener('blur', applyCombinedInputFields);
  titleInput.addEventListener('paste', () => setTimeout(applyCombinedInputFields, 0));
  titleInput.addEventListener('focus', renderTitleSuggestions);
  titleInput.addEventListener('change', refreshSearchLink);
  titleInput.addEventListener('change', applyCombinedInputFields);
  artistInput.addEventListener('input', refreshSearchLink);
  artistInput.addEventListener('blur', applyCombinedInputFields);
  artistInput.addEventListener('paste', () => setTimeout(applyCombinedInputFields, 0));
  artistInput.addEventListener('change', refreshSearchLink);
  artistInput.addEventListener('change', applyCombinedInputFields);
  titleOnlyInput.addEventListener('change', refreshSearchLink);

  retryBtn.textContent = '按输入歌名重查';
  applyArtistBtn.textContent = '应用输入歌手到结果';

  retryBtn.onclick = async () => {
    applyCombinedInputFields();
    const newTitle = (titleInput.value || '').trim();
    const manualArtist = (artistInput.value || '').trim();
    if (!newTitle) {
      alert('请输入要重查的歌名');
      return;
    }

    const rowKey = getTitleSelectionKey(item);
    const previousSelected = selectedArtists[rowKey] || '';

    const queryItem = {
      title: newTitle,
      inputArtist: manualArtist || item.inputArtist,
      line: item.originalLine
    };
    const refreshed = isApiMode
      ? await buildTitleArtistResultItemViaApi(queryItem)
      : buildTitleArtistResultItem(queryItem);

    refreshed.resultKey = rowKey;
    titleSearchResults[index] = refreshed;
    setDefaultSelectedArtist(refreshed, previousSelected);
    if (manualArtist) {
      selectedArtists[rowKey] = manualArtist;
      refreshed.inputArtist = manualArtist;
      refreshed.isArtistValid = refreshed.artistNames.some(name => artistsCompatible(name, manualArtist));
    }
    renderArtistSelectWithValidation();
    generateResultText();
  };

  applyArtistBtn.onclick = () => {
    applyCombinedInputFields();
    const parsedTitle = parseTitleArtistText(artistInput.value);
    const newArtist = (parsedTitle.artist || artistInput.value || '').trim();
    if (!newArtist) {
      alert('请输入要应用的歌手');
      return;
    }
    selectedArtists[getTitleSelectionKey(item)] = newArtist;
    item.inputArtist = newArtist;
    item.isArtistValid = item.artistNames.some(name => artistsCompatible(name, newArtist));
    renderArtistSelectWithValidation();
    generateResultText();
  };

  tools.appendChild(titleInput);
  tools.appendChild(artistInput);
  tools.appendChild(suggestionList);
  tools.appendChild(retryBtn);
  tools.appendChild(applyArtistBtn);
  tools.appendChild(titleOnlyLabel);
  tools.appendChild(link);
  return tools;
}

async function searchAndValidateArtists() {
  if (typeof dataReady !== 'undefined' && !dataReady) {
    alert('歌库尚未加载完成，请稍后再试');
    return;
  }

  const inputItems = parseInputContent();
  if (inputItems.length === 0) return;

  titleSearchResults = [];
  selectedArtists = {};
  titleFilterMode = 'all';

  if (isApiMode) {
    try {
      const payload = await fetchTitleLookup(inputItems);
      titleSearchResults = Array.isArray(payload.items) ? payload.items : [];
    } catch (error) {
      console.error('批量查询失败：', error);
      alert(`查询失败：${error.message}`);
      return;
    }
  } else {
    inputItems.forEach(item => {
      const resultItem = buildTitleArtistResultItem(item);
      titleSearchResults.push(resultItem);
    });
  }

  assignTitleResultKeys();
  titleSearchResults.forEach(item => {
    setDefaultSelectedArtist(item);
  });

  renderArtistSelectWithValidation();
  document.getElementById('artistSelectArea').classList.add('active');
  document.getElementById('resultGenerateArea').classList.add('active');
  generateResultText();
}

function getTitleItemStatusKind(item) {
  if (!item?.hasResult) return 'missing';
  if (!hasUserProvidedArtist(item)) return 'review';
  if (!item.isArtistValid) return 'review';
  return 'ok';
}

function isTitleItemNeedsReview(item) {
  return getTitleItemStatusKind(item) === 'review';
}

function getTitleItemStatus(item) {
  const kind = getTitleItemStatusKind(item);
  if (kind === 'missing') return '未找到';
  if (kind === 'review') return '需要确认';
  return '已确认';
}

function getTitleItemStatusReason(item) {
  const kind = getTitleItemStatusKind(item);
  if (kind === 'missing') return '需要用户自行找到歌手';
  if (!hasUserProvidedArtist(item)) return '用户没有提供歌手';
  if (!item.isArtistValid) return `输入歌手与库中候选不一致：${(item.artistNames || []).join(' / ') || '无候选'}`;
  return '用户提供的歌手已验证通过';
}

function matchesTitleFilter(item) {
  const mode = typeof titleFilterMode === 'string' ? titleFilterMode : 'all';
  if (mode === 'missing') return !item?.hasResult;
  if (mode === 'review') return isTitleItemNeedsReview(item);
  return true;
}

function getTitleResultEntries({ visibleOnly = true } = {}) {
  return titleSearchResults
    .map((item, index) => ({ item, index }))
    .filter(entry => !visibleOnly || matchesTitleFilter(entry.item));
}

function renderTitleFilterBar() {
  const bar = document.getElementById('titleFilterBar');
  if (!bar) return;
  const total = titleSearchResults.length;
  const reviewCount = titleSearchResults.filter(isTitleItemNeedsReview).length;
  const missingCount = titleSearchResults.filter(item => !item.hasResult).length;
  const visibleCount = getTitleResultEntries().length;
  bar.classList.toggle('active', total > 0);
  bar.querySelectorAll('[data-title-filter]').forEach(button => {
    button.classList.toggle('active', button.dataset.titleFilter === titleFilterMode);
    if (button.dataset.titleFilter === 'all') button.textContent = `全部 ${total}`;
    if (button.dataset.titleFilter === 'review') button.textContent = `需要确认 ${reviewCount}`;
    if (button.dataset.titleFilter === 'missing') button.textContent = `未找到 ${missingCount}`;
  });
  const summary = document.getElementById('titleFilterSummary');
  if (summary) {
    summary.textContent = `当前 ${visibleCount} / ${total} 条 · 需确认 ${reviewCount} · 未找到 ${missingCount}`;
  }
}

function setTitleFilterMode(mode) {
  titleFilterMode = ['all', 'review', 'missing'].includes(mode) ? mode : 'all';
  renderArtistSelectWithValidation();
  generateResultText();
}

function updateNeteaseBatchState() {
  const entries = getTitleResultEntries();
  const checkbox = document.getElementById('neteaseTitleOnly');
  const label = document.getElementById('neteaseTitleOnlyLabel');
  const button = document.getElementById('openNeteaseBatchBtn');
  const hasProvidedArtist = entries.some(({ item }) => hasUserProvidedArtist(item));
  if (checkbox) {
    checkbox.disabled = !hasProvidedArtist;
    if (!hasProvidedArtist) checkbox.checked = false;
  }
  if (label) {
    label.classList.toggle('disabled', !hasProvidedArtist);
    label.title = hasProvidedArtist ? '' : '当前筛选结果里没有用户提供的歌手，该项不可勾选';
  }
  if (button) {
    button.disabled = entries.length === 0;
    button.textContent = entries.length > 0 ? `逐个打开网易云搜索（${entries.length}）` : '逐个打开网易云搜索';
  }
}

function openVisibleNeteaseSearches() {
  const entries = getTitleResultEntries();
  if (entries.length === 0) {
    alert('当前筛选下没有可搜索的结果');
    return;
  }
  const titleOnly = !!document.getElementById('neteaseTitleOnly')?.checked;
  let opened = 0;
  entries.forEach(({ item }) => {
    const keyword = getNeteaseSearchKeyword(item, { titleOnly });
    if (!keyword) return;
    const win = window.open(getNeteaseSearchUrl(keyword), '_blank', 'noopener,noreferrer');
    if (win) opened += 1;
  });
  if (opened > 0) {
    showCopyToast(`已打开 ${opened} 个网易云搜索`);
  } else {
    alert('浏览器拦截了弹窗，请允许本站打开新标签页后重试。');
  }
}

function renderArtistSelectWithValidation() {
  const container = document.getElementById('artistSelectContainer');
  container.innerHTML = '';
  renderTitleFilterBar();

  const entries = getTitleResultEntries();
  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'select-item';
    empty.textContent = '当前筛选下没有需要展示的结果';
    container.appendChild(empty);
    updateNeteaseBatchState();
    notifyNamingToolDirectoryRefresh();
    return;
  }

  entries.forEach(({ item, index }) => {
    const selectItem = document.createElement('div');
    const selectionKey = getTitleSelectionKey(item);
    const statusKind = getTitleItemStatusKind(item);
    selectItem.className = `select-item status-${statusKind}`;

    const statusText = getTitleItemStatus(item);
    const statusReason = getTitleItemStatusReason(item);
    const statusClass = statusKind === 'ok' ? 'valid-tag' : 'invalid-tag';
    const titleHtml = `<h4><span class="title-main-text">${escapeHtml(item.title)}</span><span class="title-status-badge status-${statusKind}">${escapeHtml(statusText)}</span><span class="${statusClass}">${escapeHtml(statusReason)}</span></h4>`;
    selectItem.innerHTML = titleHtml;

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'artist-options';

    if (item.hasResult) {
      if (hasUserProvidedArtist(item)) {
        const isUserArtistMaxSource = artistsCompatible(item.inputArtist, item.maxSourceArtist);
        const userBtn = document.createElement('div');
        const isUserSelected = selectedArtists[selectionKey] === item.inputArtist;
        userBtn.className = `artist-option ${isUserArtistMaxSource ? 'max-source' : 'user-provided'} ${isUserSelected ? 'selected' : ''}`;
        userBtn.innerHTML = `${escapeHtml(item.inputArtist)} (用户输入) <span class="source-label">来源：用户输入</span>`;
        userBtn.onclick = () => {
          selectedArtists[selectionKey] = item.inputArtist;
          optionsDiv.querySelectorAll('.artist-option').forEach(btn => btn.classList.remove('selected'));
          userBtn.classList.add('selected');
          setSelectItemDirectoryMeta(selectItem, item);
          notifyNamingToolDirectoryRefresh();
          generateResultText();
        };
        optionsDiv.appendChild(userBtn);

        const divider = document.createElement('div');
        divider.style.width = '100%';
        divider.style.height = '1px';
        divider.style.backgroundColor = '#eee';
        divider.style.margin = '4px 0';
        optionsDiv.appendChild(divider);
      }

      item.artists.forEach(artist => {
        const optionBtn = document.createElement('div');
        const isMaxSource = artist.name === item.maxSourceArtist;
        const isSelected = selectedArtists[selectionKey] === artist.name;

        let className = 'artist-option';
        if (isMaxSource) className += ' max-source';
        if (isSelected) className += ' selected';
        optionBtn.className = className;

        optionBtn.innerHTML = `${escapeHtml(artist.name)} (库中值) <span class="source-label">来源(${escapeHtml(artist.sourceCount)})：${escapeHtml(artist.sources)}</span>`;
        optionBtn.onclick = () => {
          selectedArtists[selectionKey] = artist.name;
          optionsDiv.querySelectorAll('.artist-option').forEach(btn => btn.classList.remove('selected'));
          optionBtn.classList.add('selected');
          setSelectItemDirectoryMeta(selectItem, item);
          notifyNamingToolDirectoryRefresh();
          generateResultText();
        };
        optionsDiv.appendChild(optionBtn);
      });
    } else {
      if (item.inputArtist.trim()) {
        const errorBtn = document.createElement('div');
        if (!selectedArtists[selectionKey]) {
          selectedArtists[selectionKey] = item.inputArtist;
        }
        const isSelected = selectedArtists[selectionKey] === item.inputArtist;
        errorBtn.className = `artist-option error ${isSelected ? 'selected' : ''}`;
        errorBtn.innerHTML = `${escapeHtml(item.inputArtist)} (输入值) <span class="source-label">无匹配来源</span>`;
        errorBtn.onclick = () => {
          selectedArtists[selectionKey] = item.inputArtist;
          optionsDiv.querySelectorAll('.artist-option').forEach(btn => btn.classList.remove('selected'));
          errorBtn.classList.add('selected');
          setSelectItemDirectoryMeta(selectItem, item);
          notifyNamingToolDirectoryRefresh();
          generateResultText();
        };
        optionsDiv.appendChild(errorBtn);
      } else {
        const noResult = document.createElement('div');
        noResult.className = 'no-result';
        noResult.textContent = '❌ 未找到匹配的歌曲信息';
        optionsDiv.appendChild(noResult);
      }
    }

    selectItem.appendChild(optionsDiv);

    selectItem.appendChild(createRetitleTools(item, index));
    setSelectItemDirectoryMeta(selectItem, item);

    container.appendChild(selectItem);
  });

  updateNeteaseBatchState();
  notifyNamingToolDirectoryRefresh();
}

function generateResultText() {
  document.getElementById('resultText').value = buildResultText(getTitleResultEntries()).trim();
}

function buildResultText(entries) {
  return entries.map(({ item, index }) => {
    const num = (index + 1).toString().padStart(2, '0');
    const artist = selectedArtists[getTitleSelectionKey(item)] || '';
    return `${num}. ${item.title} ${artist ? '- ' + artist : ''}`;
  }).join('\n');
}

function buildResultTable(entries) {
  const header = ['序号', '歌名', '选择歌手', '输入歌手', '状态', '库中候选'];
  const body = entries.map(({ item, index }) => {
    const selectedArtist = selectedArtists[getTitleSelectionKey(item)] || '';
    return [
      String(index + 1).padStart(2, '0'),
      item.title || '',
      selectedArtist,
      item.inputArtist || '',
      getTitleItemStatus(item),
      Array.isArray(item.artistNames) ? item.artistNames.join(' / ') : ''
    ].map(value => String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ')).join('\t');
  });
  return [header.join('\t')].concat(body).join('\n');
}

async function writeTitleClipboard(text) {
  const content = String(text || '').trim();
  if (!content) {
    alert('暂无结果可复制！');
    return;
  }

  try {
    await navigator.clipboard.writeText(content);
  } catch (err) {
    console.error('复制失败:', err);
    const area = document.createElement('textarea');
    area.value = content;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  showCopyToast();
}

function copyResultText() {
  writeTitleClipboard(buildResultText(getTitleResultEntries({ visibleOnly: false })));
}

function copyVisibleResultText() {
  writeTitleClipboard(buildResultText(getTitleResultEntries()));
}

function copyTitleResultTable() {
  writeTitleClipboard(buildResultTable(getTitleResultEntries()));
}
