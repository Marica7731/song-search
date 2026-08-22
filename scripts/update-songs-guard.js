'use strict';

const DEFAULT_MAX_DROP_RATIO = 0.15;
const DEFAULT_MIN_DROP_SONGS = 100;

function countStoredSongs(content) {
    const matches = String(content || '').match(/^\s*"title":/gm);
    return matches ? matches.length : 0;
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
    assertSourceRefreshSafe,
    countStoredSongs,
    getReliableWinner
};
