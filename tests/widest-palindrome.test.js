import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/widest-palindrome/problem.js';

// Brute force: every substring from longest to shortest, left to right; the first palindrome wins.
function brute(s) {
  for (let len = s.length; len > 0; len--) {
    for (let i = 0; i + len <= s.length; i++) {
      const t = s.slice(i, i + len);
      if (t === [...t].reverse().join('')) return t;
    }
  }
  return '';
}

test('reference matches brute force on 3000 random small strings', () => {
  const rnd = mulberry32(60);
  for (let k = 0; k < 3000; k++) {
    const n = 1 + Math.floor(rnd() * 14);
    const letters = 1 + Math.floor(rnd() * 3);
    let s = '';
    for (let i = 0; i < n; i++) s += 'abc'[Math.floor(rnd() * letters)];
    assert.equal(reference(s), brute(s), s);
  }
});

test('visible expectations agree; long palindrome-rich cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  for (const t of all) assert.equal(problem.parseCustomInput(t.args[0]).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 5000).length >= 2);
  // Ties: "babad" must pick "bab", the leftmost.
  assert.equal(reference('babad'), 'bab');
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('babad'), { ok: true, args: ['babad'] });
  assert.deepEqual(problem.parseCustomInput('"a1b"'), { ok: true, args: ['a1b'] });
  assert.equal(problem.parseCustomInput('').ok, false);
  assert.equal(problem.parseCustomInput('ABC').ok, false);
  assert.equal(problem.parseCustomInput('a b').ok, false);
  assert.equal(problem.parseCustomInput('a'.repeat(5001)).ok, false);
  assert.equal(problem.parseCustomInput('"unterminated').ok, false);
});
