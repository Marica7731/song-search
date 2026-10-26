'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { groupCollectionEntries } = require('./bvid-collection-groups');
const { getProbeCountForCollection, selectLowestViewCandidates } = require('./bvid-probe-selection');

function candidates(prefix, count, startView = 1000) {
    return Array.from({ length: count }, (_, index) => ({
        bvid: `BV${prefix}${String(index).padStart(3, '0')}`,
        viewCount: startView - index
    }));
}

test('the 明日夢 section anchors share one full-season probe set for BV1xHnk6DE2C', () => {
    const pool = [
        { bvid: 'BV1lowest', viewCount: 497 },
        { bvid: 'BV1xHnk6DE2C', viewCount: 1283 },
        { bvid: 'BV1next', viewCount: 1596 },
        ...candidates('a', 65, 2500)
    ];
    const entries = ['BV1JRwUzoEpM', 'BV1icwSzXEYv'];
    const groups = groupCollectionEntries(entries, new Map([
        [entries[0], { seasonId: 7685930, candidates: pool }],
        [entries[1], { seasonId: '7685930', candidates: pool.map(candidate => ({ ...candidate })) }]
    ]));

    assert.equal(groups.length, 1);
    assert.deepEqual(groups[0].entryBvids, entries);
    assert.equal(groups[0].candidates.length, 68);
    const selected = selectLowestViewCandidates(groups[0].candidates, {
        probeCount: getProbeCountForCollection(groups[0].candidates.length)
    }).selected;
    assert.equal(selected.length, 3);
    assert.equal(selected.filter(candidate => candidate.bvid === 'BV1xHnk6DE2C').length, 1);
});

test('seven relay entries in one season become one three-candidate probe group', () => {
    const entries = Array.from({ length: 7 }, (_, index) => `BV1relay${index}`);
    const allCandidates = candidates('r', 106);
    const metadata = new Map(entries.map((entry, index) => [entry, {
        seasonId: 3953333,
        candidates: index === 0 ? allCandidates : allCandidates.slice(index)
    }]));
    const groups = groupCollectionEntries(entries, metadata);

    assert.equal(groups.length, 1);
    assert.equal(groups[0].entryBvids.length, 7);
    assert.equal(groups[0].candidates.length, 106);
    assert.equal(selectLowestViewCandidates(groups[0].candidates, {
        probeCount: getProbeCountForCollection(groups[0].candidates.length)
    }).selected.length, 3);
});

test('different seasons and standalone entries remain separate; 14 unique videos are all selected', () => {
    const smallCandidates = candidates('s', 14);
    const groups = groupCollectionEntries(['BV1smallA', 'BV1smallB', 'BV1other', 'BV1standalone'], new Map([
        ['BV1smallA', { seasonId: 'small', candidates: smallCandidates.slice(0, 8) }],
        ['BV1smallB', { seasonId: 'small', candidates: smallCandidates.slice(7) }],
        ['BV1other', { seasonId: 'other-season', candidates: candidates('o', 15) }],
        ['BV1standalone', { seasonId: null, candidates: [{ bvid: 'BV1standalone', viewCount: 3 }] }]
    ]));

    assert.equal(groups.length, 3);
    const smallGroup = groups.find(group => group.seasonId === 'small');
    assert.equal(smallGroup.candidates.length, 14);
    assert.equal(selectLowestViewCandidates(smallGroup.candidates, {
        probeCount: getProbeCountForCollection(smallGroup.candidates.length)
    }).selected.length, 14);
});
