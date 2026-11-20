import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/ring-shift/problem.js';

// Brute force: shift by one place, k times (small k only).
function brute(nums, k) {
  const a = [...nums];
  for (let step = 0; step < k; step++) a.unshift(a.pop());
  return a;
}

test('reference matches brute force on 3000 random arrays, k below, at and above the length', () => {
  const rnd = mulberry32(189);
  let past = 0;
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 9);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * 21) - 10);
    const k = Math.floor(rnd() * 30);
    if (k >= n) past++;
    const copy = [...nums];
    assert.deepEqual(reference(nums, k), brute(nums, k), JSON.stringify([nums, k]));
    assert.deepEqual(nums, copy, 'reference must not mutate its input');
  }
  assert.ok(past > 1000, `${past} cases with k >= n`);
});

test('5 visible and 10 hidden cases, expectations agree, max-size cases, valid input', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 6 && x.args[1] <= 100)) assert.deepEqual(brute(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0].length >= 99991);
  assert.ok(big.length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.args[1] === 1000000000), 'k at its maximum');
  // The answer is a rotation of the input: same values, and position (i + k) mod n holds nums[i].
  for (const t of big) {
    const [nums, k] = t.args;
    for (const i of [0, 1, 12345, nums.length - 1]) assert.equal(t.expected[(i + k) % nums.length], nums[i]);
  }
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Slices at n - k without reducing k: a negative cut point picks the wrong pieces when k > n.
  const noMod = (nums, k) => nums.slice(nums.length - k).concat(nums.slice(0, nums.length - k));
  // Shifts to the left instead of the right.
  const leftShift = (nums, k) => {
    const c = k % nums.length;
    return nums.slice(c).concat(nums.slice(0, c));
  };
  // Reverses the two blocks but not the whole array first.
  const noWholeReverse = (nums, k) => {
    const c = k % nums.length;
    const a = [...nums];
    a.splice(0, c, ...a.slice(0, c).reverse());
    a.splice(c, a.length - c, ...a.slice(c).reverse());
    return a;
  };
  for (const [name, wrong] of [['no k mod n', noMod], ['left shift', leftShift], ['missing whole reverse', noWholeReverse]]) {
    assert.ok(all.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), name);
  }
  // One step at a time needs about n * k operations: far beyond any limit on the largest cases.
  const heaviest = Math.max(...all.map((t) => t.args[0].length * t.args[1]));
  assert.ok(heaviest > 1e13, `${heaviest} single-step operations`);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,3]\n1'), { ok: true, args: [[1, 2, 3], 1] });
  assert.equal(problem.parseCustomInput('[1,2,3]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2,3]\n-1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2,3]\n1000000001').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2,3]\n1.5').ok, false);
  assert.deepEqual(problem.solveReference([[1, 2], 5]), [2, 1]);
});
