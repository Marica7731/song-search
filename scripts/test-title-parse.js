const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, 'update-songs.js'), 'utf8');

function extractConst(name) {
  const match = source.match(new RegExp(`const ${name} = [^\\n]+`));
  if (!match) throw new Error(`Missing const: ${name}`);
  return `${match[0]};`;
}

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function: ${name}`);
  let braceIndex = source.indexOf('{', start);
  let depth = 0;
  for (let i = braceIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }
  throw new Error(`Unclosed function: ${name}`);
}

const bootstrap = [
  'DEFAULT_ARTIST_TEXT',
  'CLEAN_SUFFIX_REGEX',
  'TRAILING_TAG_REGEX',
  'LEADING_SOURCE_REGEX',
  'LEADING_INDEX_REGEX'
].map(extractConst).join('\n');

const runtime = [
  extractFunction('cleanTitle'),
  extractFunction('cleanArtist'),
  extractFunction('splitSongTitleAndArtist')
].join('\n\n');

const context = {};
vm.createContext(context);
vm.runInContext(`${bootstrap}\n\n${runtime}`, context);

const samples = [
  {
    input: '[5-7].キミソラキセキ - EGOIST【 花丸はれる】【治愈接力',
    expected: { title: 'キミソラキセキ', artist: 'EGOIST' }
  },
  {
    input: '[6/7]. シリウスの心臓 - ヰ世界情緒【治愈接力【Figaro】',
    expected: { title: 'シリウスの心臓', artist: 'ヰ世界情緒' }
  },
  {
    input: '【厄倫蒂兒】[1/5].星屑ビーナス - Aimer【治愈接力',
    expected: { title: '星屑ビーナス', artist: 'Aimer' }
  },
  {
    input: '【厄倫蒂兒】 [1/5] 星屑ビーナス - Aimer【治愈接力',
    expected: { title: '星屑ビーナス', artist: 'Aimer' }
  },
  {
    input: '[5-7]キミソラキセキ - EGOIST【 花丸はれる】【治愈接力',
    expected: { title: 'キミソラキセキ', artist: 'EGOIST' }
  },
  {
    input: 'P3: シリウスの心臓 - ヰ世界情緒【治愈接力',
    expected: { title: 'シリウスの心臓', artist: 'ヰ世界情緒' }
  },
  {
    input: '09. 弱虫モンブラン - DECO『27[2026-03-07][KGzE3tksTYc]',
    expected: { title: '弱虫モンブラン', artist: 'DECO『27' }
  },
  {
    input: '16. 8.32 - *Luna',
    expected: { title: '8.32', artist: '*Luna' }
  },
  {
    input: '[2-7]. フクロウ~フクロウが知らせる客が来たと~ - KOKIA【治愈接力【Figaro】',
    expected: { title: 'フクロウ~フクロウが知らせる客が来たと~', artist: 'KOKIA' }
  }
];

let failed = false;
for (const sample of samples) {
  const actual = context.splitSongTitleAndArtist(sample.input);
  const ok = actual.title === sample.expected.title && actual.artist === sample.expected.artist;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${sample.input}`);
  if (!ok) {
    failed = true;
    console.log('  expected:', sample.expected);
    console.log('  actual  :', actual);
  }
}

if (failed) {
  process.exitCode = 1;
}
