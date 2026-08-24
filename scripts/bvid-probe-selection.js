'use strict';

const DEFAULT_MIN_COLLECTION_BVIDS = 20;
const DEFAULT_PROBE_COUNT = 3;
const BV_REGEX = /BV[0-9a-zA-Z]+/;

function normalizeBvid(value) {
    return String(value || '').match(BV_REGEX)?.[0] || '';
}

function selectLowestViewCandidates(candidates, options = {}) {
    const minimumCollectionSize = options.minimumCollectionSize ?? DEFAULT_MIN_COLLECTION_BVIDS;
    const probeCount = options.probeCount ?? DEFAULT_PROBE_COUNT;
    if (!Number.isInteger(minimumCollectionSize) || minimumCollectionSize < 1) {
        throw new Error('minimumCollectionSize 必须是正整数');
    }
    if (!Number.isInteger(probeCount) || probeCount < 1) {
        throw new Error('probeCount 必须是正整数');
    }

    const unique = new Map();
    (Array.isArray(candidates) ? candidates : []).forEach(candidate => {
        const bvid = normalizeBvid(candidate?.bvid);
        if (!bvid) {
            throw new Error('候选中包含无效 BV 号');
        }
        const viewCount = candidate?.viewCount;
        const previous = unique.get(bvid);
        if (previous && previous.viewCount !== viewCount) {
            throw new Error(`候选播放量不一致：${bvid}`);
        }
        unique.set(bvid, { bvid, viewCount });
    });

    const normalized = Array.from(unique.values());
    if (normalized.length < minimumCollectionSize) {
        return {
            eligible: false,
            total: normalized.length,
            selected: []
        };
    }

    const missingViews = normalized.filter(candidate => (
        !Number.isInteger(candidate.viewCount) || candidate.viewCount < 0
    ));
    if (missingViews.length > 0) {
        throw new Error(
            `合集有 ${missingViews.length}/${normalized.length} 个 BVID 缺少有效稿件播放量：` +
            missingViews.slice(0, 3).map(candidate => candidate.bvid).join(', ')
        );
    }
    if (normalized.length < probeCount) {
        throw new Error(`合集只有 ${normalized.length} 个 BVID，无法选择 ${probeCount} 个探针`);
    }

    return {
        eligible: true,
        total: normalized.length,
        selected: normalized
            .sort((left, right) => left.viewCount - right.viewCount || left.bvid.localeCompare(right.bvid))
            .slice(0, probeCount)
    };
}

module.exports = {
    DEFAULT_MIN_COLLECTION_BVIDS,
    DEFAULT_PROBE_COUNT,
    selectLowestViewCandidates
};
