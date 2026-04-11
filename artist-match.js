(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.ArtistMatch = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const KANA_DIGRAPH_ROMAJI = {
    きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
    ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
    しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
    じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
    ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
    にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
    ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
    びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
    ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
    みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
    りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
    う゛ぁ: 'va', う゛ぃ: 'vi', う゛ぇ: 've', う゛ぉ: 'vo', う゛ゅ: 'vyu',
    てぃ: 'ti', でぃ: 'di', とぅ: 'tu', どぅ: 'du',
    ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo', ふゅ: 'fyu',
    うぃ: 'wi', うぇ: 'we', うぉ: 'wo',
    つぁ: 'tsa', つぃ: 'tsi', つぇ: 'tse', つぉ: 'tso',
    しぇ: 'she', じぇ: 'je', ちぇ: 'che',
    すぃ: 'si', ずぃ: 'zi',
    いぇ: 'ye',
    くぁ: 'kwa', くぃ: 'kwi', くぇ: 'kwe', くぉ: 'kwo',
    ぐぁ: 'gwa', ぐぃ: 'gwi', ぐぇ: 'gwe', ぐぉ: 'gwo'
  };

  const KANA_ROMAJI = {
    あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
    か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
    が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
    さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
    ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
    た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
    だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
    な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
    は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
    ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
    ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
    ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
    や: 'ya', ゆ: 'yu', よ: 'yo',
    ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
    わ: 'wa', を: 'wo', ん: 'n',
    ゃ: 'ya', ゅ: 'yu', ょ: 'yo',
    ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
    ゔ: 'vu'
  };

  function normalizeString(str) {
    if (!str) return '';
    let s = String(str).trim();
    s = s.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
    s = s.replace(/\u3000/g, ' ');
    s = s.replace(/[～〜˜]/g, '~');
    s = s.replace(/[—–―]/g, '-');
    s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    s = s.replace(/…/g, '...');
    s = s.replace(/\s+/g, ' ');
    return s.toLowerCase();
  }

  function toHiragana(value) {
    return normalizeString(value).replace(/[\u30A1-\u30F6]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
  }

  function kanaToRomaji(value) {
    const input = toHiragana(value);
    let result = '';
    let geminate = false;

    for (let i = 0; i < input.length; i += 1) {
      const current = input[i];
      const digraph = input.slice(i, i + 2);
      let romaji = '';

      if (current === 'っ') {
        geminate = true;
        continue;
      }

      if (current === 'ー') {
        const lastVowel = result.match(/[aeiou](?=[^aeiou]*$)/);
        if (lastVowel) result += lastVowel[0];
        continue;
      }

      if (KANA_DIGRAPH_ROMAJI[digraph]) {
        romaji = KANA_DIGRAPH_ROMAJI[digraph];
        i += 1;
      } else if (KANA_ROMAJI[current]) {
        romaji = KANA_ROMAJI[current];
      } else {
        romaji = current;
      }

      if (geminate && /^[bcdfghjklmnpqrstvwxyz]/.test(romaji)) {
        romaji = romaji[0] + romaji;
      }
      geminate = false;
      result += romaji;
    }

    return normalizeString(result);
  }

  function addArtistVariant(set, value) {
    const normalized = normalizeString(value);
    if (!normalized) return;
    set.add(normalized);

    const compact = normalized.replace(/[\s._\-\/]+/g, '');
    if (compact) set.add(compact);

    const alnumCompact = compact.replace(/[^a-z0-9]+/g, '');
    if (alnumCompact) set.add(alnumCompact);

    const romaji = kanaToRomaji(normalized);
    if (romaji) {
      set.add(romaji);
      const romajiCompact = romaji.replace(/[^a-z0-9]+/g, '');
      if (romajiCompact) set.add(romajiCompact);
    }
  }

  function buildArtistMatchVariants(value) {
    const variants = new Set();
    addArtistVariant(variants, value);
    return Array.from(variants).filter(Boolean);
  }

  function hasContinuousCommonStr(str1, str2, minLength) {
    const threshold = Number.isFinite(minLength) ? Math.max(1, minLength) : 2;
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);
    if (s1.length < threshold || s2.length < threshold) return false;
    for (let i = 0; i <= s1.length - threshold; i += 1) {
      const subStr = s1.substring(i, i + threshold);
      if (s2.includes(subStr)) return true;
    }
    return false;
  }

  function areArtistsCompatible(artistA, artistB, minLength = 2) {
    const variantsA = buildArtistMatchVariants(artistA);
    const variantsB = buildArtistMatchVariants(artistB);
    if (variantsA.length === 0 || variantsB.length === 0) return false;

    for (const left of variantsA) {
      for (const right of variantsB) {
        if (left === right) return true;
        if (hasContinuousCommonStr(left, right, minLength)) return true;
      }
    }
    return false;
  }

  function isSameSong(songA, songB, isValidArtistFn) {
    const titleA = normalizeString(songA?.title || '未知歌曲');
    const titleB = normalizeString(songB?.title || '未知歌曲');
    if (titleA !== titleB) return false;

    const artistA = String(songA?.artist || '').trim();
    const artistB = String(songB?.artist || '').trim();
    const isValidArtist = typeof isValidArtistFn === 'function'
      ? isValidArtistFn
      : artist => !!artist && !!String(artist).trim();

    const validA = isValidArtist(artistA);
    const validB = isValidArtist(artistB);
    if (!validA || !validB) return true;
    return areArtistsCompatible(artistA, artistB);
  }

  function matchesArtistCondition(text, condition) {
    if (!text || !condition || typeof condition.value !== 'string') return false;
    const textVariants = buildArtistMatchVariants(text);
    const queryVariants = buildArtistMatchVariants(condition.value);
    if (textVariants.length === 0 || queryVariants.length === 0) return false;

    switch (condition.type) {
      case 'exact':
        return textVariants.some(textVariant => queryVariants.includes(textVariant));
      case 'phrase':
      case 'fuzzy':
        return textVariants.some(textVariant =>
          queryVariants.some(queryVariant => textVariant.includes(queryVariant))
        );
      default:
        return false;
    }
  }

  return {
    normalizeString,
    hasContinuousCommonStr,
    buildArtistMatchVariants,
    areArtistsCompatible,
    isSameSong,
    matchesArtistCondition,
    kanaToRomaji
  };
});
