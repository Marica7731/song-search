const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const { analyzeTitleArtistInput, loadSongSources, normalizeText } = require('../dup-check-core.js');

function response(status, value, statusText = '') {
  const ok = status >= 200 && status < 300;
  return {
    ok,
    status,
    statusText,
    json: async () => value,
    text: async () => String(value)
  };
}

function input(title, artist = '') {
  return { title, artist, originalLine: artist ? title + ' - ' + artist : title };
}

test('normalization matches spacing, case, full-width forms and half-width kana conservatively', () => {
  assert.equal(normalizeText('  Ｓｏｎｇ　Ａ  '), 'song a');
  assert.equal(normalizeText('ｶﾞ'), normalizeText('ガ'));
  assert.equal(normalizeText('A  B'), normalizeText('A B'));
  assert.notEqual(normalizeText('A B'), normalizeText('AB'));
  assert.equal(normalizeText('Song（Live）'), normalizeText('Song(Live)'));
  assert.notEqual(normalizeText('Song (Live)'), normalizeText('Song'));
  assert.notEqual(normalizeText('Song feat. Artist'), normalizeText('Song Artist'));
  assert.notEqual(normalizeText('side:A'), normalizeText('side A'));
});

test('title and artist matching separates new titles, title-only hits and exact pair hits', () => {
  const pool = [
    { title: 'プロポーズ', artist: 'なとり', source: 'one.js', link: 'https://example.test/1' },
    { title: 'プロポーズ', artist: 'なとり', source: 'two.js', link: 'https://example.test/2' },
    { title: 'プロポーズ', artist: 'なとり', source: 'three.js', link: 'https://example.test/3' },
    { title: 'プロポーズ', artist: '別の歌手', source: 'four.js', link: 'https://example.test/4' },
    { title: 'プロポーズ', artist: '未知', source: 'five.js', link: 'https://example.test/5' }
  ];

  const exact = analyzeTitleArtistInput(input('プロポーズ', 'なとり'), pool, true);
  assert.equal(exact.status, 'exact');
  assert.equal(exact.titleMatchCount, 5);
  assert.equal(exact.artistMatchCount, 3);
  assert.equal(exact.isFirst, false);

  const mismatch = analyzeTitleArtistInput(input('プロポーズ', '不存在的歌手'), pool, true);
  assert.equal(mismatch.status, 'title-artist-mismatch');
  assert.equal(mismatch.titleMatchCount, 5);
  assert.equal(mismatch.artistMatchCount, 0);
  assert.equal(mismatch.isFirst, false);
  assert.equal(mismatch.dupList.length, 5);

  const noArtist = analyzeTitleArtistInput(input('プロポーズ'), pool, true);
  assert.equal(noArtist.status, 'title-without-artist');
  assert.equal(noArtist.isFirst, false);

  const newTitle = analyzeTitleArtistInput(input('全新曲名', '歌手'), pool, true);
  assert.equal(newTitle.status, 'new-title');
  assert.equal(newTitle.isFirst, true);

  const incomplete = analyzeTitleArtistInput(input('全新曲名', '歌手'), pool, false);
  assert.equal(incomplete.status, 'unknown');
  assert.equal(incomplete.isIndeterminate, true);
  assert.equal(incomplete.isFirst, false);
});

test('batch analysis preserves one result per input and never treats a title-only hit as new', () => {
  const pool = [{ title: 'プロポーズ', artist: 'なとり', source: 'sensational.js', link: 'https://example.test/1' }];
  const results = [
    input('プロポーズ', 'なとり'),
    input('プロポーズ', '不存在的歌手'),
    input('全新曲名', '歌手')
  ].map(item => analyzeTitleArtistInput(item, pool, true));

  assert.equal(results.length, 3);
  assert.deepEqual(results.map(item => item.status), ['exact', 'title-artist-mismatch', 'new-title']);
  assert.equal(results.filter(item => item.isFirst).length, 1);
});

test('source loading accepts the real sensational.js format', async () => {
  const root = path.resolve(__dirname, '..');
  const sourceText = await fs.readFile(path.join(root, 'data', 'sensational.js'), 'utf8');
  const fetchImpl = async url => {
    if (url === 'data/index.json') return response(200, { files: ['sensational.js'], fileToAlias: { sensational: 'Sen†Sational' } });
    if (url === 'data/sensational.js') return response(200, sourceText);
    throw new Error('unexpected URL: ' + url);
  };

  const result = await loadSongSources(fetchImpl);
  assert.equal(result.summary.expected, 1);
  assert.equal(result.summary.loaded, 1);
  assert.equal(result.summary.failed.length, 0);
  assert.ok(result.songs.some(song => song.title === 'プロポーズ' && song.artist === 'なとり'));
});

test('the current generated source index loads without schema failures', async () => {
  const root = path.resolve(__dirname, '..');
  const indexData = JSON.parse(await fs.readFile(path.join(root, 'data', 'index.json'), 'utf8'));
  const fetchImpl = async url => {
    if (url === 'data/index.json') return response(200, indexData);
    const fileName = url.slice('data/'.length);
    const sourceText = await fs.readFile(path.join(root, 'data', fileName), 'utf8');
    return response(200, sourceText);
  };

  const result = await loadSongSources(fetchImpl);
  assert.equal(result.summary.expected, indexData.files.length);
  assert.equal(result.summary.loaded, indexData.files.length);
  assert.equal(result.summary.failed.length, 0);
  assert.ok(result.songs.length > 0);
});

test('source loading reports HTTP, network, syntax and SONG_DATA validation failures', async () => {
  const files = ['valid.js', 'http404.js', 'http500.js', 'network.js', 'invalid.js', 'missing.js', 'wrong.js', 'bad-row.js', 'partial.js'];
  const scripts = {
    'valid.js': 'window.SONG_DATA = [{ title: "ok", artist: "artist", link: "https://example.test" }];',
    'invalid.js': 'window.SONG_DATA = [',
    'missing.js': 'window.other = [];',
    'wrong.js': 'window.SONG_DATA = {};',
    'bad-row.js': 'window.SONG_DATA = [{ title: "ok", artist: null, link: "https://example.test" }];',
    'partial.js': 'window.SONG_DATA = [{ title: "partial", artist: "artist", link: "https://example.test" }]; throw new Error("late execution failure");'
  };
  const fetchImpl = async url => {
    if (url === 'data/index.json') return response(200, { files, fileToAlias: {} });
    const fileName = url.slice('data/'.length);
    if (fileName === 'http404.js') return response(404, 'missing', 'Not Found');
    if (fileName === 'http500.js') return response(500, 'failure', 'Internal Server Error');
    if (fileName === 'network.js') throw new Error('network unavailable');
    return response(200, scripts[fileName]);
  };

  const result = await loadSongSources(fetchImpl);
  assert.equal(result.summary.expected, files.length);
  assert.equal(result.summary.loaded, 1);
  assert.equal(result.summary.failed.length, files.length - 1);
  assert.match(result.summary.failed.find(item => item.fileName === 'http404.js').error, /HTTP 404 Not Found/);
  assert.match(result.summary.failed.find(item => item.fileName === 'http500.js').error, /HTTP 500 Internal Server Error/);
  assert.match(result.summary.failed.find(item => item.fileName === 'network.js').error, /network unavailable/);
  assert.ok(result.summary.failed.find(item => item.fileName === 'invalid.js').error);
  assert.match(result.summary.failed.find(item => item.fileName === 'missing.js').error, /SONG_DATA 缺失/);
  assert.match(result.summary.failed.find(item => item.fileName === 'wrong.js').error, /SONG_DATA 缺失/);
  assert.match(result.summary.failed.find(item => item.fileName === 'bad-row.js').error, /缺少有效的 title、artist 或 link/);
  assert.match(result.summary.failed.find(item => item.fileName === 'partial.js').error, /late execution failure/);
  assert.deepEqual(result.songs.map(song => song.title), ['ok']);
});

test('source index HTTP and schema errors fail visibly instead of loading an empty library', async () => {
  await assert.rejects(
    loadSongSources(async () => response(503, null, 'Unavailable')),
    /data\/index.json HTTP 503 Unavailable/
  );
  await assert.rejects(
    loadSongSources(async () => response(200, { files: [] })),
    /files 必须是非空数组/
  );
});
