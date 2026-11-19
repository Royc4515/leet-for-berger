import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/common-values/problem.js';

// Brute force: nested loop, then a numeric insertion sort. Independent of the reference's sets.
function brute(nums1, nums2) {
  const out = [];
  for (const x of nums1) {
    let found = false;
    for (const y of nums2) if (x === y) found = true;
    if (found && !out.includes(x)) out.push(x);
  }
  for (let i = 1; i < out.length; i++) {
    for (let j = i; j > 0 && out[j - 1] > out[j]; j--) [out[j - 1], out[j]] = [out[j], out[j - 1]];
  }
  return out;
}

test('reference matches brute force on 2000 random cases', () => {
  const rnd = mulberry32(349);
  const arr = () => Array.from({ length: 1 + Math.floor(rnd() * 10) }, () => Math.floor(rnd() * 25) - 12);
  for (let i = 0; i < 2000; i++) {
    const a = arr();
    const b = arr();
    assert.deepEqual(reference(a, b), brute(a, b), JSON.stringify([a, b]));
  }
});

test('visible expectations agree; hidden tests are valid; max-size cases', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests.slice(0, 6)) assert.deepEqual(t.expected, brute(...t.args));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000 && t.args[1].length === 100000);
  assert.ok(big.length >= 4);
  assert.ok(big.some((t) => t.expected.length === 100000));
  assert.ok(big.some((t) => t.expected.length === 0));
});

test('values sort as numbers, not as text', () => {
  assert.deepEqual(reference([9, 25, 100, 1000, -1, -5], [1000, -5, 9, 100, 25, -1]), [-5, -1, 9, 25, 100, 1000]);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2]\n[2]'), { ok: true, args: [[1, 2], [2]] });
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n[1000000001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('[1]\nfoo').ok, false);
});
