'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    loadBiliCollectionCandidates,
    loadBiliPageList,
    parseBiliCollectionCandidates,
    parseBiliViewPayload
} = require('./bilibili-page-api');

test('converts Bilibili view metadata into the existing raw-data shape', () => {
    const rawData = parseBiliViewPayload({
        code: 0,
        data: {
            bvid: 'BV1multiPage',
            title: 'multi-page karaoke',
            owner: { name: 'verified uploader' },
            videos: 2,
            pages: [
                { page: 1, part: 'Song A - Artist A' },
                { page: 2, part: 'Song B - Artist B' }
            ]
        }
    }, 'BV1fallback');

    assert.deepEqual(rawData, [{
        collectionBv: 'BV1multiPage',
        collectionTitle: 'multi-page karaoke',
        up: 'verified uploader',
        parts: ['Song A - Artist A', 'Song B - Artist B']
    }]);
});

test('preserves all page titles and order for a 100-part video', () => {
    const pages = Array.from({ length: 100 }, (_, index) => ({
        page: index + 1,
        part: `Song ${index + 1}`
    }));
    const [collection] = parseBiliViewPayload({
        code: 0,
        data: {
            bvid: 'BV1hundredParts',
            title: '100-part karaoke',
            videos: 100,
            pages
        }
    }, 'BV1hundredParts');

    assert.equal(collection.parts.length, 100);
    assert.equal(collection.parts[0], 'Song 1');
    assert.equal(collection.parts[99], 'Song 100');
});

test('rejects API errors and responses without page titles', () => {
    assert.throws(
        () => parseBiliViewPayload({ code: -404, message: 'not found' }, 'BV1missing'),
        /code=-404/
    );
    assert.throws(
        () => parseBiliViewPayload({ code: 0, data: { bvid: 'BV1empty', pages: [] } }, 'BV1empty'),
        /未返回有效分P数据/
    );
});

test('rejects a partial page list', () => {
    assert.throws(
        () => parseBiliViewPayload({
            code: 0,
            data: {
                bvid: 'BV1partial',
                videos: 2,
                pages: [{ part: 'only one page' }]
            }
        }, 'BV1partial'),
        /声明 2，实际 1/
    );
});

test('loads metadata with Bilibili request headers', async () => {
    let request = null;
    const rawData = await loadBiliPageList('BV1request', {
        timeoutMs: 1000,
        fetchImpl: async (url, options) => {
            request = { url, options };
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    code: 0,
                    data: {
                        bvid: 'BV1request',
                        title: 'request fixture',
                        owner: { name: 'uploader' },
                        videos: 1,
                        pages: [{ part: 'Song - Artist' }]
                    }
                })
            };
        }
    });

    assert.match(request.url, /view\?bvid=BV1request$/);
    assert.equal(request.options.headers.Referer, 'https://www.bilibili.com/');
    assert.equal(rawData[0].parts.length, 1);
});

test('extracts every unique BVID and manuscript view count from all season sections', () => {
    const candidates = parseBiliCollectionCandidates({
        code: 0,
        data: {
            bvid: 'BV1entry',
            ugc_season: {
                sections: [
                    {
                        episodes: [
                            { bvid: 'BV1entry', arc: { stat: { view: 30 } } },
                            { bvid: 'BV1low', arc: { stat: { view: 4 } } }
                        ]
                    },
                    {
                        episodes: [
                            { bvid: 'BV1other', arc: { stat: { view: 12 } } },
                            { bvid: 'BV1low', arc: { stat: { view: 4 } } }
                        ]
                    }
                ]
            }
        }
    }, 'BV1entry');

    assert.deepEqual(candidates, [
        { bvid: 'BV1entry', viewCount: 30 },
        { bvid: 'BV1low', viewCount: 4 },
        { bvid: 'BV1other', viewCount: 12 }
    ]);
});

test('treats a standalone manuscript as a one-BVID collection', async () => {
    const candidates = await loadBiliCollectionCandidates('BV1single', {
        timeoutMs: 1000,
        fetchImpl: async () => ({
            ok: true,
            status: 200,
            json: async () => ({
                code: 0,
                data: { bvid: 'BV1single', stat: { view: 9 } }
            })
        })
    });

    assert.deepEqual(candidates, [{ bvid: 'BV1single', viewCount: 9 }]);
});
