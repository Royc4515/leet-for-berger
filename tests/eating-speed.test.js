import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/eating-speed/problem.js';

// Brute force: try speeds 1, 2, 3, ... until the piles fit in h hours.
function brute(piles, h) {
  for (let k = 1; ; k++) if (piles.reduce((s, p) => s + Math.ceil(p / k), 0) <= h) return k;
}

test('reference matches brute force on 2000 random inputs', () => {
  const rnd = mulberry32(66);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 8);
    const piles = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 60));
    const h = n + Math.floor(rnd() * 40);
    assert.equal(reference(piles, h), brute(piles, h));
  }
});

test('visible expectations agree; two max-size cases; one needs 64-bit hour sums; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 10000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.args[0].reduce((s, p) => s + p, 0) > 2 ** 31));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[3,6]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[0]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[3,6]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[3]\n1000000001').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]\n5').ok, false);
  assert.deepEqual(problem.parseCustomInput('[3,6,7,11]\n8').args, [[3, 6, 7, 11], 8]);
});
