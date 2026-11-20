import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/flag-sort/problem.js';

// Brute force: a plain numeric sort.
const brute = (nums) => [...nums].sort((a, b) => a - b);

test('reference matches a numeric sort on 3000 random arrays and does not mutate its input', () => {
  const rnd = mulberry32(81);
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 12);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * 3));
    const copy = [...nums];
    assert.deepEqual(reference(nums), brute(nums), JSON.stringify(nums));
    assert.deepEqual(nums, copy);
  }
});

test('5 visible and 10 hidden cases, expectations agree, max-size cases, valid input', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Advances mid after a swap with the right end, skipping the value that just arrived.
  const advancesTooEarly = (nums) => {
    const a = [...nums];
    let lo = 0;
    let mid = 0;
    let hi = a.length - 1;
    while (mid <= hi) {
      if (a[mid] === 0) {
        [a[lo], a[mid]] = [a[mid], a[lo]];
        lo++;
        mid++;
      } else if (a[mid] === 1) {
        mid++;
      } else {
        [a[mid], a[hi]] = [a[hi], a[mid]];
        hi--;
        mid++;
      }
    }
    return a;
  };
  // Moves the 0s to the front and stops: 1s and 2s stay in their original relative order.
  const zerosOnly = (nums) => [...nums.filter((v) => v === 0), ...nums.filter((v) => v !== 0)];
  // Sorts descending.
  const descending = (nums) => [...nums].sort((a, b) => b - a);
  // Returns the input as is.
  const unchanged = (nums) => [...nums];
  // Loses the 2s that were never counted: fills only 0s and 1s.
  const dropsTwos = (nums) => {
    const zeros = nums.filter((v) => v === 0).length;
    return nums.map((_, i) => (i < zeros ? 0 : 1));
  };
  for (const [name, wrong] of [
    ['advances mid after the right swap', advancesTooEarly],
    ['zeros only', zerosOnly],
    ['descending', descending],
    ['unchanged', unchanged],
    ['drops twos', dropsTwos],
  ]) {
    assert.ok(all.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[2,0,2,1,1,0]'), { ok: true, args: [[2, 0, 2, 1, 1, 0]] });
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[3]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(new Array(100001).fill(1))).ok, false);
  assert.equal(problem.parseCustomInput('0,1').ok, false);
  assert.deepEqual(problem.solveReference([[2, 1, 0]]), [0, 1, 2]);
});
