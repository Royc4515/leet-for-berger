import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/shared-prefix/problem.js';

// Brute force: the longest prefix of the first word that every word starts with, tried from
// the longest candidate down. Independent of the reference's column scan.
function brute(strs) {
  for (let len = strs[0].length; len > 0; len--) {
    const p = strs[0].slice(0, len);
    if (strs.every((s) => s.startsWith(p))) return p;
  }
  return '';
}

test('reference matches brute force on 3000 random lists', () => {
  const rnd = mulberry32(61);
  for (let t = 0; t < 3000; t++) {
    const letters = 'abc'.slice(0, 1 + Math.floor(rnd() * 3));
    const n = 1 + Math.floor(rnd() * 5);
    const strs = Array.from({ length: n }, () => {
      let s = '';
      const len = Math.floor(rnd() * 6);
      for (let i = 0; i < len; i++) s += letters[Math.floor(rnd() * letters.length)];
      return s;
    });
    assert.equal(reference(strs), brute(strs), JSON.stringify(strs));
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const total = (t) => t.args[0].reduce((s, w) => s + w.length, 0);
  // Two words of 5 * 10^5 letters, with both a long and a very short shared prefix, so a
  // quadratic candidate loop fails whichever end it starts from.
  const longPairs = problem.hiddenTests.filter((t) => t.args[0].length === 2 && total(t) === 1000000);
  assert.equal(longPairs.length, 2);
  assert.ok(longPairs.some((t) => t.expected.length > 400000) && longPairs.some((t) => t.expected.length < 5));
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 10000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('["ab","a"]').args, [['ab', 'a']]);
  assert.equal(problem.parseCustomInput('[""]').ok, true);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('["Ab"]').ok, false);
  assert.equal(problem.parseCustomInput('[1]').ok, false);
  assert.equal(problem.parseCustomInput('"abc"').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(new Array(10001).fill('a'))).ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(['a'.repeat(600000), 'a'.repeat(400001)])).ok, false);
  assert.equal(problem.parseCustomInput('[').ok, false);
});
