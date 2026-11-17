import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/vowel-window/problem.js';

// Brute force: recount every window with a regex.
function brute(s, k) {
  let best = 0;
  for (let i = 0; i + k <= s.length; i++) best = Math.max(best, (s.slice(i, i + k).match(/[aeiou]/g) ?? []).length);
  return best;
}

test('reference matches brute force on 2000 random strings', () => {
  const rnd = mulberry32(64);
  const alphabet = 'abeioxuy';
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 20);
    let s = '';
    for (let j = 0; j < n; j++) s += alphabet[Math.floor(rnd() * alphabet.length)];
    const k = 1 + Math.floor(rnd() * n);
    assert.equal(reference(s, k), brute(s, k), `${s} ${k}`);
  }
});

test('visible expectations agree; two max-size cases with large k; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000 && t.args[1] >= 50000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('"abc"').ok, false);
  assert.equal(problem.parseCustomInput('"abc"\n0').ok, false);
  assert.equal(problem.parseCustomInput('"abc"\n4').ok, false);
  assert.equal(problem.parseCustomInput('"aBc"\n1').ok, false);
  assert.equal(problem.parseCustomInput('""\n1').ok, false);
  assert.deepEqual(problem.parseCustomInput('"leetcode"\n3').args, ['leetcode', 3]);
});
