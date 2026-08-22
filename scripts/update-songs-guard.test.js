'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    assertSourceRefreshSafe,
    countStoredSongs,
    getReliableWinner
} = require('./update-songs-guard');

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
