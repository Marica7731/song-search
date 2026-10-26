'use strict';
// Compact, deterministic, title-level index for selecting songs not yet cut.
// Usage: node scripts/song-lookup-index.js build
//        node scripts/song-lookup-index.js check candidates.json
// candidates.json: [{"title":"...", "artist":"..."}, ...]
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const indexDir = path.join(dataDir, 'song-lookup');
const normalize = (s) => String(s || '').normalize('NFKC').toLocaleLowerCase('ja')
  .replace(/[\s\u3000・。、。，!！?？'"“”‘’\-＿_~～()（）【】\[\]]/g, '');
const bucket = (key) => crypto.createHash('sha256').update(key).digest('hex')[0];
function loadSongs(code, filename) {
  const sandbox = { window: { SONG_DATA: [] } };
  vm.runInNewContext(code, sandbox, { timeout: 12000, filename });
  if (!Array.isArray(sandbox.window.SONG_DATA)) throw Error('SONG_DATA is not an array: ' + filename);
  return sandbox.window.SONG_DATA;
}
function build() {
  const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'index.json'), 'utf8'));
  if (!Array.isArray(manifest.files) || !manifest.files.length) throw Error('Empty source manifest');
  const tables = Object.fromEntries('0123456789abcdef'.split('').map(c => [c, new Map()]));
  const sourceHash = crypto.createHash('sha256');
  let records = 0;
  for (const file of manifest.files) {
    if (!/^[^/\\]+\.js$/.test(file)) throw Error('Unsafe path: ' + file);
    const source = fs.readFileSync(path.join(dataDir, file), 'utf8');
    sourceHash.update(file).update('\0').update(source).update('\0');
    for (const s of loadSongs(source, file)) {
      if (!s || typeof s.title !== 'string') continue;
      const title = normalize(s.title);
      if (!title) continue;
      const artist = normalize(s.artist);
      const slot = tables[bucket(title)];
      if (!slot.has(title)) slot.set(title, new Set());
      if (artist) slot.get(title).add(artist);
      records++;
    }
  }
  fs.mkdirSync(indexDir, { recursive: true });
  let titleCount = 0;
  for (const [prefix, table] of Object.entries(tables)) {
    const entries = [...table.entries()].sort(([a], [b]) => a.localeCompare(b, 'ja'))
      .map(([title, artists]) => [title, [...artists].sort()]);
    titleCount += entries.length;
    fs.writeFileSync(path.join(indexDir, prefix + '.json'), JSON.stringify(entries) + '\n');
  }
  // Do not include timestamps: unchanged sources must produce identical index files.
  const output = { schemaVersion: 1, normalization: 'nfkc-title-v1', sourceFiles: manifest.files.length,
    sourceSha256: sourceHash.digest('hex'), recordCount: records, titleCount,
    shards: '0123456789abcdef'.split('').map(x => x + '.json') };
  fs.writeFileSync(path.join(indexDir, 'manifest.json'), JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify(output));
}
function check(candidateFile) {
  if (!candidateFile) throw Error('Specify a UTF-8 JSON candidates file');
  const candidates = JSON.parse(fs.readFileSync(candidateFile, 'utf8'));
  if (!Array.isArray(candidates)) throw Error('Candidates must be an array');
  const manifest = JSON.parse(fs.readFileSync(path.join(indexDir, 'manifest.json'), 'utf8'));
  if (manifest.schemaVersion !== 1) throw Error('Unsupported index version');
  const cache = new Map();
  const result = candidates.map((s) => {
    const title = normalize(s && s.title);
    const artist = normalize(s && s.artist);
    if (!title) return { ...s, status: 'invalid' };
    const b = bucket(title);
    if (!cache.has(b)) cache.set(b, new Map(JSON.parse(fs.readFileSync(path.join(indexDir, b + '.json'), 'utf8'))));
    const known = cache.get(b).get(title);
    return { ...s, status: known ? 'already_cut_title' : 'unseen_title',
      artistStatus: !known ? 'unseen_title' : !artist ? 'artist_unspecified' :
        known.includes(artist) ? 'already_cut_title_artist' : 'different_artist_or_credit',
      indexedArtistCount: known ? known.length : 0 };
  });
  console.log(JSON.stringify({ sourceSha256: manifest.sourceSha256, results: result }, null, 2));
}
if (require.main === module) {
  try {
    const cmd = process.argv[2];
    if (cmd === 'build') build();
    else if (cmd === 'check') check(process.argv[3]);
    else throw Error('Usage: build | check candidates.json');
  } catch (err) { console.error(err.message); process.exitCode = 1; }
}
module.exports = { normalize, bucket, build };
