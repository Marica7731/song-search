// title-artist query/validation module

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
  return (value || '').toLowerCase().trim();
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
    isArtistValid = artistNames.some(name => normalizeText(name) === normalizeText(item.inputArtist));
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

function setDefaultSelectedArtist(item, previousSelected = '') {
  if (item.hasResult) {
    const fallback = item.maxSourceArtist || item.artistNames[0] || '';
    const canReusePrevious = previousSelected && item.artistNames.includes(previousSelected);
    selectedArtists[item.title] = canReusePrevious ? previousSelected : fallback;
    return;
  }

  if (item.inputArtist && item.inputArtist.trim()) {
    selectedArtists[item.title] = item.inputArtist.trim();
    return;
  }

  selectedArtists[item.title] = '';
}

function getNeteaseSearchUrl(keyword) {
  return `https://music.163.com/#/search/m/?s=${encodeURIComponent(keyword)}&type=1`;
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

  const artistInput = document.createElement('input');
  artistInput.type = 'text';
  artistInput.value = selectedArtists[item.title] || item.inputArtist || '';
  artistInput.placeholder = '可修改歌手，或粘贴“歌名 - 歌手”';
  artistInput.style.flex = '1';
  artistInput.style.minWidth = '180px';
  artistInput.style.padding = '6px 10px';
  artistInput.style.border = '1px solid #ddd';
  artistInput.style.borderRadius = '6px';
  artistInput.style.fontSize = '13px';

  const suggestionList = document.createElement('datalist');
  const datalistId = `titleSuggestion-${index}-${Date.now()}`;
  suggestionList.id = datalistId;
  titleInput.setAttribute('list', datalistId);

  const renderTitleSuggestions = () => {
    const currentTitle = parseTitleArtistText(titleInput.value).title || titleInput.value;
    const suggestions = getTitleSuggestions(currentTitle);
    suggestionList.innerHTML = suggestions.map(name => `<option value="${name.replace(/"/g, '&quot;')}"></option>`).join('');
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

  const link = document.createElement('a');
  const refreshSearchLink = () => {
    const parsedTitle = parseTitleArtistText(titleInput.value);
    const parsedArtist = parseTitleArtistText(artistInput.value);
    const t = (parsedTitle.title || item.title || '').trim();
    const a = (parsedTitle.artist || parsedArtist.artist || artistInput.value || '').trim();
    const keyword = a ? `${t} - ${a}` : t;
    link.href = getNeteaseSearchUrl(keyword);
  };
  refreshSearchLink();
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = '网易云搜索';
  link.style.color = '#00a1d6';
  link.style.fontSize = '12px';
  link.style.textDecoration = 'none';

  titleInput.addEventListener('input', () => {
    renderTitleSuggestions();
    refreshSearchLink();
  });
  titleInput.addEventListener('focus', renderTitleSuggestions);
  titleInput.addEventListener('change', refreshSearchLink);
  artistInput.addEventListener('input', refreshSearchLink);
  artistInput.addEventListener('change', refreshSearchLink);

  retryBtn.onclick = () => {
    const parsedTitle = parseTitleArtistText(titleInput.value);
    const parsedArtist = parseTitleArtistText(artistInput.value);
    const newTitle = (parsedTitle.title || '').trim();
    const manualArtist = (parsedTitle.artist || parsedArtist.artist || artistInput.value || '').trim();
    if (!newTitle) {
      alert('请输入要重查的歌名');
      return;
    }

    const oldTitle = item.title;
    const previousSelected = selectedArtists[oldTitle] || '';
    if (oldTitle !== newTitle) {
      delete selectedArtists[oldTitle];
    }

    const refreshed = buildTitleArtistResultItem({
      title: newTitle,
      inputArtist: manualArtist || item.inputArtist,
      line: item.originalLine
    });

    titleSearchResults[index] = refreshed;
    setDefaultSelectedArtist(refreshed, previousSelected);
    if (manualArtist) {
      selectedArtists[newTitle] = manualArtist;
      refreshed.inputArtist = manualArtist;
      refreshed.isArtistValid = refreshed.artistNames.some(name => normalizeText(name) === normalizeText(manualArtist));
    }
    renderArtistSelectWithValidation();
    generateResultText();
  };

  applyArtistBtn.onclick = () => {
    const parsedTitle = parseTitleArtistText(artistInput.value);
    const newArtist = (parsedTitle.artist || artistInput.value || '').trim();
    if (!newArtist) {
      alert('请输入要应用的歌手');
      return;
    }
    selectedArtists[item.title] = newArtist;
    item.inputArtist = newArtist;
    item.isArtistValid = item.artistNames.some(name => normalizeText(name) === normalizeText(newArtist));
    renderArtistSelectWithValidation();
    generateResultText();
  };

  tools.appendChild(titleInput);
  tools.appendChild(artistInput);
  tools.appendChild(suggestionList);
  tools.appendChild(retryBtn);
  tools.appendChild(applyArtistBtn);
  tools.appendChild(link);
  return tools;
}

function searchAndValidateArtists() {
  const inputItems = parseInputContent();
  if (inputItems.length === 0) return;

  titleSearchResults = [];
  selectedArtists = {};

  inputItems.forEach(item => {
    const resultItem = buildTitleArtistResultItem(item);
    titleSearchResults.push(resultItem);
    setDefaultSelectedArtist(resultItem);
  });

  renderArtistSelectWithValidation();
  document.getElementById('artistSelectArea').classList.add('active');
  document.getElementById('resultGenerateArea').classList.add('active');
  generateResultText();
}

function renderArtistSelectWithValidation() {
  const container = document.getElementById('artistSelectContainer');
  container.innerHTML = '';

  titleSearchResults.forEach((item, index) => {
    const selectItem = document.createElement('div');
    selectItem.className = 'select-item';

    let titleHtml = `<h4>${item.title}`;
    if (inputFormatType === 'full' && item.inputArtist.trim()) {
      if (item.hasResult) {
        titleHtml += item.isArtistValid
          ? `<span class="valid-tag">✅ 歌手 "${item.inputArtist}" 验证通过</span>`
          : `<span class="invalid-tag">❌ 歌手 "${item.inputArtist}" 与库中不符，库中歌手：${item.artistNames.join(' / ')}</span>`;
      } else {
        titleHtml += `<span class="invalid-tag">❌ 未找到该歌曲信息</span>`;
      }
    } else if (!item.hasResult) {
      titleHtml += `<span class="invalid-tag">❌ 未找到该歌曲信息</span>`;
    } else if (item.artistNames.length > 1) {
      titleHtml += `<span class="valid-tag">已默认选择来源最多项（并列取靠前）</span>`;
    }
    titleHtml += `</h4>`;
    selectItem.innerHTML = titleHtml;

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'artist-options';

    if (item.hasResult) {
      if (inputFormatType === 'full' && item.inputArtist.trim()) {
        const isUserArtistMaxSource = normalizeText(item.inputArtist) === normalizeText(item.maxSourceArtist);
        const userBtn = document.createElement('div');
        const isUserSelected = selectedArtists[item.title] === item.inputArtist;
        userBtn.className = `artist-option ${isUserArtistMaxSource ? 'max-source' : 'user-provided'} ${isUserSelected ? 'selected' : ''}`;
        userBtn.innerHTML = `${item.inputArtist} (用户输入) <span class="source-label">来源：用户输入</span>`;
        userBtn.onclick = () => {
          selectedArtists[item.title] = item.inputArtist;
          optionsDiv.querySelectorAll('.artist-option').forEach(btn => btn.classList.remove('selected'));
          userBtn.classList.add('selected');
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
        const isSelected = selectedArtists[item.title] === artist.name;

        let className = 'artist-option';
        if (isMaxSource) className += ' max-source';
        if (isSelected) className += ' selected';
        optionBtn.className = className;

        optionBtn.innerHTML = `${artist.name} (库中值) <span class="source-label">来源(${artist.sourceCount})：${artist.sources}</span>`;
        optionBtn.onclick = () => {
          selectedArtists[item.title] = artist.name;
          optionsDiv.querySelectorAll('.artist-option').forEach(btn => btn.classList.remove('selected'));
          optionBtn.classList.add('selected');
          generateResultText();
        };
        optionsDiv.appendChild(optionBtn);
      });
    } else {
      if (item.inputArtist.trim()) {
        const errorBtn = document.createElement('div');
        if (!selectedArtists[item.title]) {
          selectedArtists[item.title] = item.inputArtist;
        }
        const isSelected = selectedArtists[item.title] === item.inputArtist;
        errorBtn.className = `artist-option error ${isSelected ? 'selected' : ''}`;
        errorBtn.innerHTML = `${item.inputArtist} (输入值) <span class="source-label">无匹配来源</span>`;
        errorBtn.onclick = () => {
          selectedArtists[item.title] = item.inputArtist;
          optionsDiv.querySelectorAll('.artist-option').forEach(btn => btn.classList.remove('selected'));
          errorBtn.classList.add('selected');
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

    container.appendChild(selectItem);
  });
}

function generateResultText() {
  let result = '';
  titleSearchResults.forEach((item, index) => {
    const num = (index + 1).toString().padStart(2, '0');
    const artist = selectedArtists[item.title] || '';
    result += `${num}. ${item.title} ${artist ? '- ' + artist : ''}\n`;
  });

  document.getElementById('resultText').value = result.trim();
}

function copyResultText() {
  const resultText = document.getElementById('resultText').value.trim();
  if (!resultText) {
    alert('暂无结果可复制！');
    return;
  }

  navigator.clipboard.writeText(resultText)
    .then(() => {
      showCopyToast();
    })
    .catch(err => {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制！');
    });
}
