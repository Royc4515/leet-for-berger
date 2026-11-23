import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/smallest-positive-gap/problem.js';

// Independent brute force: linear scan checking 1, 2, 3, ... one by one.
function brute(nums) {
  let cand = 1;
  while (nums.includes(cand)) cand++;
  return cand;
}

// Independent check: cyclic placement matching the shipped solutions.
function cyclicSort(input) {
  const nums = [...input];
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
      const target = nums[i] - 1;
      [nums[i], nums[target]] = [nums[target], nums[i]];
    }
  }
  for (let i = 0; i < n; i++) if (nums[i] !== i + 1) return i + 1;
  return n + 1;
}

// Classic wrong answers.
function startsAtZero(nums) {
  let cand = 0;
  while (nums.includes(cand)) cand++;
  return cand;
}
function returnsNWhenFull(nums) {
  const ans = reference(nums);
  return ans === nums.length + 1 ? nums.length : ans;
}
function maxPlusOne(nums) {
  const pos = nums.filter((v) => v > 0);
  return pos.length ? Math.max(...pos) + 1 : 1;
}

test('reference and cyclic sort match brute force on 2000 seeded arrays', () => {
  const rnd = mulberry32(41);
  for (let c = 0; c < 2000; c++) {
    const n = 1 + Math.floor(rnd() * 25);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * 30) - 8);
    const expected = brute(nums);
    assert.equal(reference(nums), expected, JSON.stringify(nums));
    assert.equal(cyclicSort(nums), expected, JSON.stringify(nums));
  }
});

test('5 visible and 10 hidden cases, visible agree, at least two max-size inputs, inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('classic mistakes each fail a case', () => {
  const small = problem.hiddenTests.filter((t) => t.args[0].length <= 100);
  for (const wrong of [startsAtZero, returnsNWhenFull, maxPlusOne]) {
    assert.ok(small.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passed all small hidden cases`);
  }
});

test('custom input parser enforces limits', () => {
  assert.deepEqual(problem.parseCustomInput('[3,4,-1,1]').args, [[3, 4, -1, 1]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[2147483648]').ok, false);
  assert.equal(problem.parseCustomInput('[-2147483649]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('not json').ok, false);
});
