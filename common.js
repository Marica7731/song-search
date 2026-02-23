// ==========================================
// common.js - 性能优化版
// ==========================================

function isValidArtist(artist) {
    if (!artist || artist.trim() === '') return false;
    if (artist.includes('来源处未提供标准格式歌手')) return false;
    return true;
}

function cleanString(str) {
    if (!str) return '';
    let s = str.trim();
    s = s.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
    s = s.replace(/\u3000/g, ' ');
    s = s.replace(/[～〜˜]/g, '~');
    s = s.replace(/[—–―]/g, '-');
    s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    s = s.replace(/…/g, '...');
    s = s.replace(/[☆★♪♫❤️✨]/g, '');
    s = s.replace(/!!/g, '!');
    s = s.replace(/！！/g, '!');
    s = s.replace(/\s*-\s*/g, '-');
    s = s.replace(/\s+/g, ' ');
    return s;
}

function extractCore(str) {
    if (!str) return '';
    let s = cleanString(str);
    let prevLength;
    do {
        prevLength = s.length;
        s = s.replace(/\([^()]*\)/g, '');
        s = s.replace(/（[^（）]*）/g, '');
    } while (s.length !== prevLength);
    s = s.replace(/\s+/g, ' ').trim();
    return s.toLowerCase();
}

function normalizeString(str) {
    if (!str) return '';
    return cleanString(str).toLowerCase();
}

/**
 * 🔧 性能优化：生成唯一指纹 Key
 * 代替原来的 isSameSong 双重循环比对
 */
function getSongFingerprint(song) {
    const coreTitle = extractCore(song.title || '未知歌曲');
    const coreArtist = extractCore(song.artist || '');
    // 直接用 "核心歌名|核心歌手" 作为唯一 Key
    return `${coreTitle}|${coreArtist}`;
}

/**
 * 🔧 性能爆炸优化：O(n) 复杂度计算去重数
 */
function getUniqueSongCount(data) {
    if (data.length === 0) return 0;
    const seen = new Set();
    for (let i = 0; i < data.length; i++) {
        seen.add(getSongFingerprint(data[i]));
    }
    return seen.size;
}

// 保留 isSameSong 供特殊情况使用，但主要逻辑改用 fingerprint
function isSameSong(songA, songB) {
    return getSongFingerprint(songA) === getSongFingerprint(songB);
}
