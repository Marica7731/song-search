'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalize, bucket } = require('./song-lookup-index');

test('Japanese and full-width variants normalize consistently', () => {
  assert.equal(normalize('  シャルル  '), normalize('シャルル'));
  assert.equal(normalize('Ｒａｉｎ！'), normalize('Rain!'));
  assert.equal(normalize('君の名は。'), normalize('君の名は'));
  assert.equal(normalize('A・B'), normalize('AB'));
});
test('same song maps to the same deterministic shard', () => {
  assert.equal(bucket(normalize('シャルル')), bucket(normalize(' シャルル ')));
  assert.match(bucket('example'), /^[0-9a-f]$/);
});
test('do not conflate unrelated song titles', () => {
  assert.notEqual(normalize('ド屑'), normalize('ドライフラワー'));
});
