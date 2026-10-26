'use strict';

const BV_REGEX = /BV[0-9a-zA-Z]+/;

function normalizeBvid(value) {
    return String(value || '').match(BV_REGEX)?.[0] || '';
}

function groupCollectionEntries(entryBvids, metadataByEntry) {
    const groups = new Map();
    const uniqueEntryBvids = Array.from(new Set((Array.isArray(entryBvids) ? entryBvids : [])
        .map(normalizeBvid)
        .filter(Boolean)));

    for (const entryBvid of uniqueEntryBvids) {
        const metadata = metadataByEntry instanceof Map ? metadataByEntry.get(entryBvid) : null;
        if (!metadata) continue;

        const seasonId = String(metadata.seasonId || '').trim() || null;
        const groupId = seasonId ? `season:${seasonId}` : `entry:${entryBvid}`;
        let group = groups.get(groupId);
        if (!group) {
            group = {
                groupId,
                seasonId,
                entryBvids: [],
                candidatesByBvid: new Map()
            };
            groups.set(groupId, group);
        }
        group.entryBvids.push(entryBvid);

        for (const candidate of Array.isArray(metadata.candidates) ? metadata.candidates : []) {
            const bvid = normalizeBvid(candidate?.bvid);
            if (!bvid) throw new Error(`合集元数据包含无效 BV 号：${entryBvid}`);
            // Multiple entry responses can differ slightly as view counts change;
            // retain the latest response while still unioning every section member.
            group.candidatesByBvid.set(bvid, { ...candidate, bvid });
        }
    }

    return Array.from(groups.values()).map(group => ({
        groupId: group.groupId,
        seasonId: group.seasonId,
        entryBvids: group.entryBvids,
        candidates: Array.from(group.candidatesByBvid.values())
    }));
}

module.exports = { groupCollectionEntries };
