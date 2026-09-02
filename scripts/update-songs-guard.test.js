'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    assertCandidateCoversExisting,
    assertRunMadeProgress,
    assertSourceRefreshSafe,
    countStoredSongs,
    getReliableWinner
} = require('./update-songs-guard');

function buildStoredSongs(songs) {
    return [
        '// generated source data',
        'window.SONG_DATA = window.SONG_DATA || [];',
        `window.SONG_DATA.push(${songs.map(song => JSON.stringify(song)).join(',')});`
    ].join('\n');
}

test('rejects a run when every selected source failed', () => {
    assert.throws(
        () => assertRunMadeProgress(0, 63),
        /全部来源刷新失败：0\/63/
    );
    assert.doesNotThrow(() => assertRunMadeProgress(1, 63));
    assert.doesNotThrow(() => assertRunMadeProgress(0, 0));
});

test('counts only generated song title fields', () => {
    const content = [
        '// title in a comment does not count',
        '  "title": "first",',
        '  "collection": "title",',
        '\t"title": "second",'
    ].join('\n');

    assert.equal(countStoredSongs(content), 2);
});

test('rejects a multi-entry source when any configured BV fails', () => {
    assert.throws(() => assertSourceRefreshSafe({
        alias: '非常驻妹妹',
        configuredBvids: ['BV1xucZzxEkZ', 'BV117P2zwEuq', 'BV1LJ4m1A7FC'],
        failedBvids: ['BV117P2zwEuq'],
        previousCount: 3360,
        nextCount: 1428
    }), /1\/3.*BV117P2zwEuq.*保留旧文件/);
});

test('keeps the strongest accepted winner in the current candidate pool', () => {
    const winner = getReliableWinner({
        recentRuns: [
            { winner: 'BV1old', winnerSongCount: 2317 },
            { winner: 'BV1weak', winnerSongCount: 480 },
            { winner: 'BV1rejected', winnerSongCount: 2400, accepted: false }
        ]
    }, ['BV1old', 'BV1weak', 'BV1rejected', 'BV1explore']);

    assert.deepEqual(winner, { bvid: 'BV1old', songCount: 2317 });
});

test('rejects a large successful-looking source regression', () => {
    assert.throws(() => assertSourceRefreshSafe({
        alias: '非常驻妹妹',
        configuredBvids: ['BV1xucZzxEkZ'],
        failedBvids: [],
        previousCount: 3373,
        nextCount: 1530
    }), /3373 -> 1530.*54\.6%.*保留旧文件/);
});

test('allows a small correction and first generation', () => {
    assert.doesNotThrow(() => assertSourceRefreshSafe({
        alias: '来源',
        configuredBvids: ['BV1test'],
        failedBvids: [],
        previousCount: 3360,
        nextCount: 3300
    }));
    assert.doesNotThrow(() => assertSourceRefreshSafe({
        alias: '新来源',
        configuredBvids: ['BV1new'],
        failedBvids: [],
        previousCount: 0,
        nextCount: 20
    }));
});

test('rejects an equal-sized candidate that replaces an existing BV and page', () => {
    const existingContent = buildStoredSongs([
        { title: 'old 1', link: 'https://www.bilibili.com/video/BV1oldSource?p=1' },
        { title: 'old 2', link: 'https://www.bilibili.com/video/BV1oldSource?p=2' }
    ]);
    const nextSongs = [
        { title: 'old 1', link: 'https://www.bilibili.com/video/BV1oldSource?p=1' },
        { title: 'replacement', link: 'https://www.bilibili.com/video/BV1newSource?p=1' }
    ];

    assert.throws(() => assertCandidateCoversExisting({
        alias: '来源',
        existingContent,
        nextSongs
    }), /缺少 1\/2 个旧 BV\+分P 身份.*BV1oldSource\?p=2.*保留旧文件/);
});

test('allows reordered existing identities and additions', () => {
    const existingContent = buildStoredSongs([
        { title: 'old 1', link: 'https://www.bilibili.com/video/BV1sameSource?p=1' },
        { title: 'old 2', link: 'https://www.bilibili.com/video/BV1sameSource?p=2' }
    ]);

    assert.doesNotThrow(() => assertCandidateCoversExisting({
        alias: '来源',
        existingContent,
        nextSongs: [
            { title: 'old 2 renamed', link: 'https://www.bilibili.com/video/BV1sameSource?p=2' },
            { title: 'new', link: 'https://www.bilibili.com/video/BV1sameSource?p=3' },
            { title: 'old 1', link: 'https://www.bilibili.com/video/BV1sameSource?p=1' }
        ]
    }));
});

test('allows an explicit local source shrink override', () => {
    const existingContent = buildStoredSongs([
        { title: 'old', link: 'https://www.bilibili.com/video/BV1manualFix?p=1' }
    ]);

    assert.doesNotThrow(() => assertCandidateCoversExisting({
        alias: '来源',
        existingContent,
        nextSongs: [],
        allowSourceShrink: true
    }));
});
