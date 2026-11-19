const fs = require('node:fs/promises');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const {
  analyzeTitleArtistBatch,
  loadSongSources,
  parseTitleArtistInput
} = require('../dup-check-core.js');

const root = path.resolve(__dirname, '..');
const usage = '用法: node scripts/check-title-artist.js [曲目列表文件|-]';

async function readLocalSource(relativePath) {
  const text = await fs.readFile(path.join(root, relativePath), 'utf8');
  return { ok: true, text: async () => text, json: async () => JSON.parse(text) };
}

function describeMatch(song, aliases) {
  return {
    title: song.title,
    artist: song.artist,
    source: song.source,
    sourceAlias: aliases[song.source.slice(0, -3)] || song.source,
    link: song.link
  };
}

async function main(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log(usage);
    return;
  }
  if (args.length > 1) throw new Error(usage);
  const raw = !args[0] || args[0] === '-' ? readFileSync(0, 'utf8') : await fs.readFile(args[0], 'utf8');
  const inputs = parseTitleArtistInput(raw);
  if (inputs.length === 0) throw new Error('没有可查重的曲目。' + usage);

  let library;
  try {
    library = await loadSongSources(readLocalSource);
  } catch (error) {
    library = {
      songs: [],
      aliases: {},
      summary: { expected: null, loaded: 0, failed: [], indexError: error.message }
    };
    process.exitCode = 1;
  }

  const { expected, loaded, failed, indexError } = library.summary;
  const complete = expected !== null && loaded === expected && failed.length === 0;
  const matches = analyzeTitleArtistBatch(inputs, library.songs, complete);
  const results = matches.map((match, index) => ({
    input: inputs[index],
    normalizedTitle: match.titleKey,
    normalizedArtist: match.artistKey,
    status: match.status,
    titleMatchCount: match.titleMatchCount,
    artistMatchCount: match.artistMatchCount,
    titleMatches: match.titleDupList.map(song => describeMatch(song, library.aliases)),
    pairMatches: match.pairDupList.map(song => describeMatch(song, library.aliases))
  }));

  process.stdout.write(JSON.stringify({
    scope: 'current-index',
    coverage: { expected, loaded, failed: failed.map(({ fileName, error }) => ({ fileName, error })), complete, indexError },
    results
  }) + '\n');
}

main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
