// ==========================================
// common.js - 歌曲查询站公共逻辑库
// ==========================================

/**
 * 判断是否为有效歌手
 */
function isValidArtist(artist) {
    if (!artist || artist.trim() === '') return false;
    if (artist.includes('来源处未提供标准格式歌手')) return false;
    return true;
}

/**
 * 【核心】超级字符串清洗
 * 1. 全角转半角
 * 2. 移除装饰符号
 * 3. 统一标点
 */
function cleanString(str) {
    if (!str) return '';
    let s = str.trim();
    
    // 1. 全角转半角
    s = s.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
    s = s.replace(/\u3000/g, ' ');

    // 2. 统一特殊符号
    s = s.replace(/[～〜˜]/g, '~');
    s = s.replace(/[—–―]/g, '-');
    s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    s = s.replace(/…/g, '...');
    
    // 3. 移除装饰性符号 (☆, ♪ 等)
    s = s.replace(/[☆★♪♫❤️✨]/g, '');
    
    // 4. 合并重复标点
    s = s.replace(/!!/g, '!');
    s = s.replace(/！！/g, '!');

    // 5. 处理分隔符周围空格
    s = s.replace(/\s*-\s*/g, '-');

    // 6. 终极空格处理
    s = s.replace(/\s+/g, ' ');
    s = s.trim();

    return s;
}

/**
 * 【核心】提取字符串主体（移除所有括号及其内容）
 * 例如："周杰伦（JAY）" -> "周杰伦"
 * 例如："粛聖!! ロリ神レクイエム☆ - しぐれうい(9さい)" -> "粛聖!! ロリ神レクイエム - しぐれうい"
 */
function extractCore(str) {
    if (!str) return '';
    let s = cleanString(str);
    
    // 递归移除所有括号内容：(xxx) 或 （xxx）
    // 循环直到没有括号为止
    let prevLength;
    do {
        prevLength = s.length;
        // 移除半角括号内容
        s = s.replace(/\([^()]*\)/g, '');
        // 移除全角括号内容
        s = s.replace(/（[^（）]*）/g, '');
    } while (s.length !== prevLength);

    // 再次清洗空格
    s = s.replace(/\s+/g, ' ').trim();
    return s.toLowerCase(); // 转小写返回
}

/**
 * 【核心】获取用于比较的标准化字符串
 * 返回：清洗后的完整字符串
 */
function normalizeString(str) {
    if (!str) return '';
    return cleanString(str).toLowerCase();
}

/**
 * 模糊匹配：检查是否有连续公共子串
 */
function hasContinuousCommonStr(str1, str2, minLength = 2) {
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);
    if (s1.length < minLength || s2.length < minLength) return false;
    for (let i = 0; i <= s1.length - minLength; i++) {
        const subStr = s1.substring(i, i + minLength);
        if (s2.includes(subStr)) return true;
    }
    return false;
}

/**
 * 【顶层逻辑】判断两首歌是否为同一首
 * 策略：
 * 1. 先比【核心主体】(去掉括号的部分)，如果核心一样 -> 同一首
 *    (例如："周杰伦" 和 "周杰伦（JAY）" 是同一首)
 * 2. 如果核心不一样，再看完整字符串是否包含或模糊匹配
 */
function isSameSong(songA, songB) {
    const titleA = songA.title || '未知歌曲';
    const titleB = songB.title || '未知歌曲';

    // 1. 比较歌名核心主体 (最重要)
    const coreA = extractCore(titleA);
    const coreB = extractCore(titleB);

    if (coreA && coreB && coreA === coreB) {
        // 歌名核心一致，进入歌手判定
        return isArtistCompatible(songA, songB);
    }

    // 2. 如果核心不完全一致，做个保底的模糊包含判断
    // (防止其中一方标题特别长或特别短)
    const normA = normalizeString(titleA);
    const normB = normalizeString(titleB);
    
    if (normA.includes(normB) || normB.includes(normA)) {
        return isArtistCompatible(songA, songB);
    }

    // 3. 连续字符模糊匹配 (最后的防线)
    if (hasContinuousCommonStr(titleA, titleB)) {
        return isArtistCompatible(songA, songB);
    }

    return false;
}

/**
 * 判断歌手是否兼容
 */
function isArtistCompatible(songA, songB) {
    const artistA = (songA.artist || '').trim();
    const artistB = (songB.artist || '').trim();
    const validA = isValidArtist(artistA);
    const validB = isValidArtist(artistB);

    // 只要有一方没歌手，且歌名已匹配，就算同一首
    if (!validA || !validB) return true;

    // 双方都有歌手时，同样使用【核心主体】比较
    // 例如："しぐれうい(9さい)" 和 "しぐれうい" 是同一个人
    const coreA = extractCore(artistA);
    const coreB = extractCore(artistB);

    if (coreA === coreB) return true;

    // 保底：完整字符串包含或模糊匹配
    const normA = normalizeString(artistA);
    const normB = normalizeString(artistB);
    if (normA.includes(normB) || normB.includes(normA)) return true;
    
    return hasContinuousCommonStr(artistA, artistB);
}
