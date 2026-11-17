import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/longest-distinct-window/problem.js';

// Brute force: every substring, checked for repeats with a Set.
function brute(s) {
  let best = 0;
  for (let i = 0; i < s.length; i++)
    for (let j = i; j < s.length; j++) {
      const sub = s.slice(i, j + 1);
      if (new Set(sub).size === sub.length) best = Math.max(best, sub.length);
    }
  return best;
}

test('reference matches brute force on 2000 random strings', () => {
  const rnd = mulberry32(61);
  const alphabet = 'abcdeA !';
  for (let i = 0; i < 2000; i++) {
    const n = Math.floor(rnd() * 16);
    const k = 1 + Math.floor(rnd() * alphabet.length);
    let s = '';
    for (let j = 0; j < n; j++) s += alphabet[Math.floor(rnd() * k)];
    assert.equal(reference(s), brute(s), s);
  }
});

test('visible expectations agree; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('abc').ok, false);
  assert.equal(problem.parseCustomInput('123').ok, false);
  assert.equal(problem.parseCustomInput('"caf\\u00e9"').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify('a'.repeat(100001))).ok, false);
  assert.deepEqual(problem.parseCustomInput('"a b"').args, ['a b']);
  assert.deepEqual(problem.parseCustomInput('""').args, ['']);
});
