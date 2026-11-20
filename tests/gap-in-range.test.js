import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/gap-in-range/problem.js';

// Brute force: test each candidate 0..n against the whole array with includes.
function brute(nums) {
  for (let v = 0; v <= nums.length; v++) if (!nums.includes(v)) return v;
  throw new Error('nothing missing');
}

/** 0..n in random order with one random number removed. */
function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 14);
  const missing = Math.floor(rnd() * (n + 1));
  const nums = [];
  for (let v = 0; v <= n; v++) if (v !== missing) nums.push(v);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

test('reference matches brute force on 3000 random arrays', () => {
  const rnd = mulberry32(268);
  for (let i = 0; i < 3000; i++) {
    const nums = randomCase(rnd);
    assert.equal(reference(nums), brute(nums), JSON.stringify(nums));
  }
});

test('5 visible and 10 hidden cases, visible expectations agree, max-size arrays', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 60)) assert.equal(brute(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000);
  assert.ok(big.length >= 2);
  // Both ends of the range occur: 0 and n are each the absent number somewhere.
  assert.ok(problem.hiddenTests.some((t) => t.expected === 0));
  assert.ok(problem.hiddenTests.some((t) => t.expected === t.args[0].length));
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Sum or xor over 0..n-1 instead of 0..n: wrong when the absent number is n.
  const sumToNMinusOne = (nums) => {
    const n = nums.length;
    let total = ((n - 1) * n) / 2;
    for (const v of nums) total -= v;
    return total;
  };
  const xorToNMinusOne = (nums) => {
    let r = 0;
    for (let i = 0; i < nums.length; i++) r ^= i ^ nums[i];
    return r;
  };
  // First index where the value is not its index: only meaningful on a sorted array.
  const firstMismatch = (nums) => {
    for (let i = 0; i < nums.length; i++) if (nums[i] !== i) return i;
    return nums.length;
  };
  for (const [name, wrong] of [['sum to n-1', sumToNMinusOne], ['xor to n-1', xorToNMinusOne], ['first index mismatch unsorted', firstMismatch]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[3,0,1]').args, [[3, 0, 1]]);
  assert.equal(problem.parseCustomInput('[0,0]').ok, false, 'duplicates');
  assert.equal(problem.parseCustomInput('[5]').ok, false, 'value above n');
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('3 0 1').ok, false);
  assert.equal(problem.solveReference([[0, 1]]), 2);
});
