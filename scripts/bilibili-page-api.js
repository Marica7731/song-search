'use strict';

const BILI_VIEW_API = 'https://api.bilibili.com/x/web-interface/view?bvid=';
const BV_REGEX = /BV[0-9a-zA-Z]+/;

function normalizeBvid(value) {
    const matched = String(value || '').match(BV_REGEX);
    return matched?.[0] || '';
}

function assertBiliViewPayload(payload) {
    if (!payload || payload.code !== 0 || !payload.data) {
        throw new Error(`B站接口返回异常：code=${payload?.code ?? 'unknown'}`);
    }
    return payload.data;
}

function parseBiliViewPayload(payload, requestedBvid) {
    const data = assertBiliViewPayload(payload);
    const collectionBv = normalizeBvid(data.bvid) || normalizeBvid(requestedBvid);
    if (!collectionBv) {
        throw new Error('B站接口未返回有效 BV 号');
    }

    const parts = (Array.isArray(data.pages) ? data.pages : [])
        .map(page => String(page?.part || '').trim())
        .filter(Boolean);
    if (parts.length === 0) {
        throw new Error(`B站接口未返回有效分P数据：${collectionBv}`);
    }
    const declaredPageCount = Number(data.videos || 0);
    if (declaredPageCount > 0 && parts.length !== declaredPageCount) {
        throw new Error(`B站接口分P数量不完整：声明 ${declaredPageCount}，实际 ${parts.length}`);
    }

    return [{
        collectionBv,
        collectionTitle: String(data.title || '').trim() || collectionBv,
        up: String(data.owner?.name || '').trim() || '未知UP主',
        parts
    }];
}

function parseBiliCollectionCandidates(payload, requestedBvid) {
    const data = assertBiliViewPayload(payload);
    const sections = Array.isArray(data.ugc_season?.sections)
        ? data.ugc_season.sections
        : [];
    const episodes = sections.flatMap(section => (
        Array.isArray(section?.episodes) ? section.episodes : []
    ));
    const records = episodes.length > 0
        ? episodes
        : [{ bvid: data.bvid || requestedBvid, arc: { stat: data.stat } }];
    const candidates = new Map();

    records.forEach(record => {
        const bvid = normalizeBvid(record?.bvid);
        if (!bvid) {
            throw new Error('B站合集元数据包含无效 BV 号');
        }
        const rawViewCount = record?.arc?.stat?.view;
        const viewCount = Number.isInteger(rawViewCount) && rawViewCount >= 0
            ? rawViewCount
            : null;
        const previous = candidates.get(bvid);
        if (previous && previous.viewCount !== viewCount) {
            throw new Error(`B站合集元数据的播放量不一致：${bvid}`);
        }
        candidates.set(bvid, { bvid, viewCount });
    });

    return Array.from(candidates.values());
}

async function loadBiliViewPayload(bvid, options = {}) {
    const normalizedBvid = normalizeBvid(bvid);
    if (!normalizedBvid) {
        throw new Error(`无效 BV 号：${bvid}`);
    }

    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
        throw new Error('当前 Node.js 不支持 fetch');
    }

    const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 15000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    timeout.unref?.();

    try {
        const endpoint = options.endpoint || BILI_VIEW_API;
        const response = await fetchImpl(`${endpoint}${encodeURIComponent(normalizedBvid)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                Referer: 'https://www.bilibili.com/'
            },
            signal: controller.signal
        });
        if (!response?.ok) {
            throw new Error(`B站接口 HTTP ${response?.status ?? 'unknown'}`);
        }
        const payload = await response.json();
        assertBiliViewPayload(payload);
        return payload;
    } finally {
        clearTimeout(timeout);
    }
}

async function loadBiliPageList(bvid, options = {}) {
    const payload = await loadBiliViewPayload(bvid, options);
    return parseBiliViewPayload(payload, bvid);
}

async function loadBiliCollectionCandidates(bvid, options = {}) {
    const payload = await loadBiliViewPayload(bvid, options);
    return parseBiliCollectionCandidates(payload, bvid);
}

module.exports = {
    loadBiliCollectionCandidates,
    loadBiliPageList,
    loadBiliViewPayload,
    normalizeBvid,
    parseBiliCollectionCandidates,
    parseBiliViewPayload
};
