import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/prefix-score-sum/problem.js';

// Brute force: compare every suffix with s character by character.
function brute(s) {
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    let k = 0;
    while (i + k < s.length && s[k] === s[i + k]) k++;
    total += k;
  }
  return total;
}

test('reference matches brute force on 3000 random small strings', () => {
  const rnd = mulberry32(72);
  for (let k = 0; k < 3000; k++) {
    const n = 1 + Math.floor(rnd() * 30);
    const letters = 1 + Math.floor(rnd() * 3);
    const s = Array.from({ length: n }, () => 'abc'[Math.floor(rnd() * letters)]).join('');
    assert.equal(reference(s), brute(s), s);
  }
});

test('visible expectations agree; 64-bit totals and max sizes are tested; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(t.args[0]).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected > 2 ** 32));
  assert.equal(reference('a'.repeat(100000)), 100000 * 100001 / 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('babab'), { ok: true, args: ['babab'] });
  assert.deepEqual(problem.parseCustomInput('"zz"'), { ok: true, args: ['zz'] });
  assert.equal(problem.parseCustomInput('').ok, false);
  assert.equal(problem.parseCustomInput('Ab').ok, false);
  assert.equal(problem.parseCustomInput('a'.repeat(100001)).ok, false);
});
