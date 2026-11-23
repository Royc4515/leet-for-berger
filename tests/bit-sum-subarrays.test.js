import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/bit-sum-subarrays/problem.js';

// Independent brute force: check every subarray [i..j].
function brute(nums, goal) {
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    let sum = 0;
    for (let j = i; j < nums.length; j++) {
      sum += nums[j];
      if (sum === goal) count++;
    }
  }
  return count;
}

// Independent check: two-pass sliding window matching the shipped solutions.
function slidingWindow(nums, goal) {
  const atMost = (limit) => {
    if (limit < 0) return 0;
    let left = 0;
    let sum = 0;
    let total = 0;
    for (let right = 0; right < nums.length; right++) {
      sum += nums[right];
      while (sum > limit) sum -= nums[left++];
      total += right - left + 1;
    }
    return total;
  };
  return atMost(goal) - atMost(goal - 1);
}

// Classic wrong answers.
// Naive single sliding window: counts at most one subarray per right endpoint when sum === goal.
function singleWindow(nums, goal) {
  let left = 0;
  let sum = 0;
  let count = 0;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (left <= right && sum > goal) sum -= nums[left++];
    if (left <= right && sum === goal) count++;
  }
  return count;
}
// Forgets to subtract atMost(goal - 1) (counts sum <= goal instead of sum == goal).
function atMostOnly(nums, goal) {
  let left = 0;
  let sum = 0;
  let total = 0;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum > goal) sum -= nums[left++];
    total += right - left + 1;
  }
  return total;
}
// Truncates to signed 32-bit int.
const int32Overflow = (nums, goal) => reference(nums, goal) | 0;

test('reference and sliding window match brute force on 2000 seeded binary arrays', () => {
  const rnd = mulberry32(930);
  for (let c = 0; c < 2000; c++) {
    const n = 1 + Math.floor(rnd() * 25);
    const nums = Array.from({ length: n }, () => (rnd() < 0.45 ? 1 : 0));
    const goal = Math.floor(rnd() * (n + 1));
    const expected = brute(nums, goal);
    assert.equal(reference(nums, goal), expected, JSON.stringify([nums, goal]));
    assert.equal(slidingWindow(nums, goal), expected, JSON.stringify([nums, goal]));
  }
});

test('5 visible and 10 hidden cases, visible agree, at least two max-size inputs, 64-bit case present', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected === 5000050000));
});

test('classic mistakes each fail a case', () => {
  for (const wrong of [singleWindow, atMostOnly, int32Overflow]) {
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passed all hidden cases`);
  }
});

test('custom input parser enforces limits', () => {
  assert.deepEqual(problem.parseCustomInput('[1,0,1]; 2').args, [[1, 0, 1], 2]);
  assert.equal(problem.parseCustomInput('[1,0,1]').ok, false);
  assert.equal(problem.parseCustomInput('[]; 0').ok, false);
  assert.equal(problem.parseCustomInput('[0,2,1]; 1').ok, false);
  assert.equal(problem.parseCustomInput('[0,1]; -1').ok, false);
  assert.equal(problem.parseCustomInput('[0,1]; 3').ok, false);
});
