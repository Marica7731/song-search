const assert = require('assert');
const { cleanSongTitle } = require('./title-cleaning');

const cases = [
    ['08. エルの楽園 [→ side:E →]', 'エルの楽園 [→ side:E →]'],
    ['10. エルの絵本 【魔女とラフレンツェ】', 'エルの絵本 【魔女とラフレンツェ】'],
    ['13. エルの絵本 【笛吹き男とパレード】', 'エルの絵本 【笛吹き男とパレード】'],
    ['14. エルの楽園 ［→ side：A →］', 'エルの楽園 ［→ side：A →］'],
    ['19. 終端の王と異世界の騎士 ～The Endia & The Knights～', '終端の王と異世界の騎士 ～The Endia & The Knights～'],
    ['Cosmic Dancers -', 'Cosmic Dancers'],
    ['P12: upload_sub', 'upload']
];

for (const [input, expected] of cases) {
    assert.strictEqual(cleanSongTitle(input), expected, input);
}

console.log('TITLE_CLEANING_CHECK_OK');
