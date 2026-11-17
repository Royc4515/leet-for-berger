import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/shift-list/problem.js';

// Brute force: move the last element to the front, one step at a time, k times.
function brute(values, k) {
  const a = [...values];
  if (!a.length) return a;
  for (let i = 0; i < k; i++) a.unshift(a.pop());
  return a;
}

test('reference matches brute force on 3000 random lists', () => {
  const rnd = mulberry32(71);
  for (let t = 0; t < 3000; t++) {
    const values = Array.from({ length: Math.floor(rnd() * 8) }, () => Math.floor(rnd() * 201) - 100);
    const k = Math.floor(rnd() * 30);
    assert.deepEqual(reference(values, k), brute(values, k), `${values} by ${k}`);
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  // At least two max-size lists that really move about half the list, so k mod n steps of O(n)
  // each are too slow, and one with k a multiple of n.
  const big = problem.hiddenTests.filter((t) => t.args[0].length >= 99999);
  const halfway = big.filter((t) => {
    const s = t.args[1] % t.args[0].length;
    return s > 10000 && s < 90000;
  });
  assert.ok(halfway.length >= 2);
  assert.ok(big.some((t) => t.args[1] % t.args[0].length === 0));
  assert.ok(big.every((t) => t.args[1] > 2 ** 30 || t.args[1] === 50000));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,3]\n2').args, [[1, 2, 3], 2]);
  assert.equal(problem.parseCustomInput('[]\n0').ok, true);
  assert.equal(problem.parseCustomInput('[1]\n-1').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n2000000001').ok, false);
  assert.equal(problem.parseCustomInput('[101]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n1.5').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput(`${JSON.stringify(Array(100001).fill(0))}\n1`).ok, false);
});
