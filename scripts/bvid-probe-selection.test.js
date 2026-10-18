'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    DEFAULT_MIN_COLLECTION_BVIDS,
    DEFAULT_PROBE_COUNT,
    FULL_SCAN_BELOW_BVIDS,
    getProbeCountForCollection,
    selectLowestViewCandidates
} = require('./bvid-probe-selection');

function makeCandidates(count) {
    return Array.from({ length: count }, (_, index) => ({
        bvid: `BV1candidate${String(index).padStart(2, '0')}`,
        viewCount: 1000 - index * 7
    }));
}

test('scans every BVID in a non-empty collection smaller than 15', () => {
    const candidates = makeCandidates(14);
    const result = selectLowestViewCandidates(candidates, {
        minimumCollectionSize: DEFAULT_MIN_COLLECTION_BVIDS,
        probeCount: getProbeCountForCollection(candidates.length)
    });

    assert.equal(DEFAULT_MIN_COLLECTION_BVIDS, 1);
    assert.equal(FULL_SCAN_BELOW_BVIDS, 15);
    assert.equal(result.eligible, true);
    assert.equal(result.total, 14);
    assert.equal(result.selected.length, 14);
});

test('keeps the three-lowest-view sample for collections with at least 15 BVIDs', () => {
    assert.equal(getProbeCountForCollection(15), DEFAULT_PROBE_COUNT);
    assert.equal(getProbeCountForCollection(100), DEFAULT_PROBE_COUNT);
});

test('keeps empty collections ineligible and honors explicit probe counts', () => {
    const result = selectLowestViewCandidates([], {
        minimumCollectionSize: DEFAULT_MIN_COLLECTION_BVIDS,
        probeCount: getProbeCountForCollection(0)
    });

    assert.deepEqual(result, { eligible: false, total: 0, selected: [] });
    assert.equal(getProbeCountForCollection(4, 2), 2);
});

test('selects exactly the three manuscripts with the lowest view counts at 15 BVIDs', () => {
    const candidates = makeCandidates(15);
    candidates[3].viewCount = 2;
    candidates[11].viewCount = 1;
    candidates[14].viewCount = 3;

    const result = selectLowestViewCandidates(candidates);

    assert.equal(DEFAULT_PROBE_COUNT, 3);
    assert.equal(result.eligible, true);
    assert.equal(result.total, 15);
    assert.deepEqual(result.selected, [
        { bvid: 'BV1candidate11', viewCount: 1 },
        { bvid: 'BV1candidate03', viewCount: 2 },
        { bvid: 'BV1candidate14', viewCount: 3 }
    ]);
});

test('allows a verified small collection to probe every available BVID', () => {
    const candidates = makeCandidates(3);

    const result = selectLowestViewCandidates(candidates, {
        minimumCollectionSize: 3,
        probeCount: 3
    });

    assert.equal(result.eligible, true);
    assert.equal(result.total, 3);
    assert.deepEqual(result.selected, [...candidates].reverse());
});

test('counts duplicate BVIDs once when selecting small-collection probes', () => {
    const candidates = makeCandidates(14);
    candidates.push({ ...candidates[0] });

    const uniqueCount = new Set(candidates.map(candidate => candidate.bvid)).size;
    const result = selectLowestViewCandidates(candidates, {
        minimumCollectionSize: DEFAULT_MIN_COLLECTION_BVIDS,
        probeCount: getProbeCountForCollection(uniqueCount)
    });

    assert.equal(result.eligible, true);
    assert.equal(result.total, 14);
    assert.equal(result.selected.length, 14);
});

test('fails closed when an eligible collection is missing a manuscript view count', () => {
    const candidates = makeCandidates(15);
    candidates[8].viewCount = null;

    assert.throws(
        () => selectLowestViewCandidates(candidates),
        /缺少有效稿件播放量.*BV1candidate08/
    );
});
