'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    DEFAULT_MIN_COLLECTION_BVIDS,
    DEFAULT_PROBE_COUNT,
    selectLowestViewCandidates
} = require('./bvid-probe-selection');

function makeCandidates(count) {
    return Array.from({ length: count }, (_, index) => ({
        bvid: `BV1candidate${String(index).padStart(2, '0')}`,
        viewCount: 1000 - index * 7
    }));
}

test('does not select probes when a collection has fewer than 20 unique BVIDs', () => {
    const result = selectLowestViewCandidates(makeCandidates(19));

    assert.equal(DEFAULT_MIN_COLLECTION_BVIDS, 20);
    assert.deepEqual(result, { eligible: false, total: 19, selected: [] });
});

test('selects exactly the three manuscripts with the lowest view counts', () => {
    const candidates = makeCandidates(20);
    candidates[3].viewCount = 2;
    candidates[11].viewCount = 1;
    candidates[17].viewCount = 3;

    const result = selectLowestViewCandidates(candidates);

    assert.equal(DEFAULT_PROBE_COUNT, 3);
    assert.equal(result.eligible, true);
    assert.equal(result.total, 20);
    assert.deepEqual(result.selected, [
        { bvid: 'BV1candidate11', viewCount: 1 },
        { bvid: 'BV1candidate03', viewCount: 2 },
        { bvid: 'BV1candidate17', viewCount: 3 }
    ]);
});

test('counts duplicate BVIDs once before applying the 20-BVID threshold', () => {
    const candidates = makeCandidates(19);
    candidates.push({ ...candidates[0] });

    const result = selectLowestViewCandidates(candidates);

    assert.deepEqual(result, { eligible: false, total: 19, selected: [] });
});

test('fails closed when an eligible collection is missing a manuscript view count', () => {
    const candidates = makeCandidates(20);
    candidates[8].viewCount = null;

    assert.throws(
        () => selectLowestViewCandidates(candidates),
        /缺少有效稿件播放量.*BV1candidate08/
    );
});
