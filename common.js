// common.js
function isValidArtist(artist) {
    if (!artist || artist.trim() === '') return false;
    if (artist.includes('来源处未提供标准格式歌手')) return false;
    return true;
}

function normalizeString(str) {
    // ... 把上面那个超长的 normalizeString 函数完整放这里 ...
    if (!str) return '';
    let s = str.trim();
    s = s.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
    // ... (省略中间部分，记得完整复制) ...
    return s.toLowerCase();
}

function hasContinuousCommonStr(str1, str2, minLength = 2) {
    // ... 也放这里 ...
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);
    if (s1.length < minLength || s2.length < minLength) return false;
    for (let i = 0; i <= s1.length - minLength; i++) {
        const subStr = s1.substring(i, i + minLength);
        if (s2.includes(subStr)) return true;
    }
    return false;
}

function isSameSong(songA, songB) {
    // ... 也放这里 ...
}
