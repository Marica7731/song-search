'use strict';

const DEFAULT_MAX_DROP_RATIO = 0.15;
const DEFAULT_MIN_DROP_SONGS = 100;

function countStoredSongs(content) {
    const matches = String(content || '').match(/^\s*"title":/gm);
    return matches ? matches.length : 0;
}

function parseStoredSongs(content) {
    const text = String(content || '');
    if (!text.trim()) return [];

    const marker = 'window.SONG_DATA.push(';
    const payloadStart = text.indexOf(marker);
    const payloadEnd = text.lastIndexOf(');');
    if (payloadStart < 0 || payloadEnd < payloadStart + marker.length) {
        throw new Error('旧来源文件格式无法识别');
    }

    const payload = text.slice(payloadStart + marker.length, payloadEnd).trim();
    if (!payload) return [];
    const songs = JSON.parse(`[${payload}]`);
    if (!Array.isArray(songs)) throw new Error('旧来源曲目不是数组');
    return songs;
}

function getSongIdentity(link) {
    const text = String(link || '').trim();
    const match = text.match(/\/video\/(BV[0-9A-Za-z]+)(?:[/?#]|$)/);
    if (!match) return '';

    let page = 1;
    try {
        const parsedPage = Number.parseInt(new URL(text).searchParams.get('p') || '1', 10);
        if (Number.isInteger(parsedPage) && parsedPage > 0) page = parsedPage;
    } catch (_) {
        return '';
    }
    return `${match[1]}?p=${page}`;
}

function assertCandidateCoversExisting({
    alias,
    existingContent,
    nextSongs,
    allowSourceShrink = false
}) {
    if (allowSourceShrink || !String(existingContent || '').trim()) return;

    let existingSongs;
    try {
        existingSongs = parseStoredSongs(existingContent);
    } catch (err) {
        throw new Error(`${String(alias || 'unknown')} 旧来源文件解析失败：${err.message}；保留旧文件`);
    }

    const existingIdentities = new Set(existingSongs.map(song => getSongIdentity(song?.link)).filter(Boolean));
    const nextIdentities = new Set(
        (Array.isArray(nextSongs) ? nextSongs : []).map(song => getSongIdentity(song?.link)).filter(Boolean)
    );
    if (existingSongs.length > 0 && existingIdentities.size === 0) {
        throw new Error(`${String(alias || 'unknown')} 旧来源文件没有可识别的 BV+分P 身份；保留旧文件`);
    }

    const missing = Array.from(existingIdentities).filter(identity => !nextIdentities.has(identity));
    if (missing.length > 0) {
        throw new Error(
            `${String(alias || 'unknown')} 候选缺少 ${missing.length}/${existingIdentities.size} 个旧 BV+分P 身份：` +
            `${missing.slice(0, 3).join(', ')}；保留旧文件`
        );
    }
}

function getReliableWinner(entryState, candidatePool) {
    const candidates = new Set(Array.isArray(candidatePool) ? candidatePool : []);
    const recentRuns = Array.isArray(entryState?.recentRuns) ? entryState.recentRuns : [];
    let best = null;
    for (let index = 0; index < recentRuns.length; index++) {
        const run = recentRuns[index] || {};
        const songCount = Number(run.winnerSongCount) || 0;
        if (run.accepted === false || !run.winner || songCount <= 0 || !candidates.has(run.winner)) {
            continue;
        }
        if (!best || songCount >= best.songCount) {
            best = { bvid: run.winner, songCount };
        }
    }
    return best;
}

function assertRunMadeProgress(successCount, totalCount) {
    const succeeded = Number(successCount) || 0;
    const total = Number(totalCount) || 0;
    if (total > 0 && succeeded === 0) {
        throw new Error(`本轮全部来源刷新失败：0/${total}；拒绝把空刷新标记为成功`);
    }
}

function assertSourceRefreshSafe({
    alias,
    configuredBvids,
    failedBvids,
    previousCount,
    nextCount,
    maxDropRatio = DEFAULT_MAX_DROP_RATIO,
    minDropSongs = DEFAULT_MIN_DROP_SONGS
}) {
    const sourceName = String(alias || 'unknown');
    const expected = Array.isArray(configuredBvids) ? configuredBvids : [];
    const failed = Array.isArray(failedBvids) ? failedBvids : [];

    if (failed.length > 0) {
        throw new Error(
            `${sourceName} 有 ${failed.length}/${expected.length} 个入口 BV 刷新失败：${failed.join(', ')}；保留旧文件`
        );
    }

    const before = Number(previousCount) || 0;
    const after = Number(nextCount) || 0;
    if (before <= 0 || after >= before) return;

    const dropped = before - after;
    const dropRatio = dropped / before;
    if (dropped >= minDropSongs && dropRatio >= maxDropRatio) {
        throw new Error(
            `${sourceName} 曲目数异常回退：${before} -> ${after}（-${dropped}, ${(dropRatio * 100).toFixed(1)}%）；保留旧文件`
        );
    }
}

module.exports = {
    DEFAULT_MAX_DROP_RATIO,
    DEFAULT_MIN_DROP_SONGS,
    assertCandidateCoversExisting,
    assertSourceRefreshSafe,
    assertRunMadeProgress,
    countStoredSongs,
    getSongIdentity,
    getReliableWinner
};
