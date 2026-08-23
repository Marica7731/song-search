'use strict';

const BILI_VIEW_API = 'https://api.bilibili.com/x/web-interface/view?bvid=';
const BV_REGEX = /BV[0-9a-zA-Z]+/;

function normalizeBvid(value) {
    const matched = String(value || '').match(BV_REGEX);
    return matched?.[0] || '';
}

function parseBiliViewPayload(payload, requestedBvid) {
    if (!payload || payload.code !== 0 || !payload.data) {
        throw new Error(`B站接口返回异常：code=${payload?.code ?? 'unknown'}`);
    }

    const data = payload.data;
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

async function loadBiliPageList(bvid, options = {}) {
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
        return parseBiliViewPayload(await response.json(), normalizedBvid);
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = {
    loadBiliPageList,
    normalizeBvid,
    parseBiliViewPayload
};
