import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/digit-list-sum/problem.js';

// Brute force: turn both digit lists into BigInts, add, and split the sum back into digits.
function brute(a, b) {
  const toBig = (d) => BigInt([...d].reverse().join(''));
  return [...String(toBig(a) + toBig(b))].reverse().map(Number);
}

/** Seeded valid digit list: no trailing zero unless the number is 0. */
function randomDigits(rnd) {
  const n = 1 + Math.floor(rnd() * 12);
  const d = Array.from({ length: n }, () => (rnd() < 0.4 ? 9 : Math.floor(rnd() * 10)));
  if (n > 1 && d[n - 1] === 0) d[n - 1] = 1;
  return d;
}

test('reference matches brute force on 3000 random pairs', () => {
  const rnd = mulberry32(67);
  for (let t = 0; t < 3000; t++) {
    const a = randomDigits(rnd);
    const b = randomDigits(rnd);
    assert.deepEqual(reference(a, b), brute(a, b), `${a} + ${b}`);
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => Math.max(t.args[0].length, t.args[1].length) === 100000);
  assert.ok(big.length >= 2);
  // The carry out of 10^5 nines must produce a 100001-digit result.
  assert.ok(big.some((t) => t.expected.length === 100001));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[2,4,3]\n[5,6,4]').args, [[2, 4, 3], [5, 6, 4]]);
  assert.equal(problem.parseCustomInput('[0]\n[0]').ok, true);
  assert.equal(problem.parseCustomInput('[]\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('[1,0]\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('[10]\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('[1]').ok, false);
  assert.equal(problem.parseCustomInput(`${JSON.stringify(Array(100001).fill(1))}\n[1]`).ok, false);
  assert.equal(problem.parseCustomInput('[1]\nx').ok, false);
});
