import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { intArray } from '../src/js/engine/growth-inputs.js';
import problem, { reference } from '../src/js/problems/digit-sum-pair/problem.js';

const digitSum = (v) => String(v).split('').reduce((a, d) => a + Number(d), 0);

// Brute force: every pair of different indices.
function brute(nums) {
  let best = -1;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) if (digitSum(nums[i]) === digitSum(nums[j])) best = Math.max(best, nums[i] + nums[j]);
  }
  return best;
}

// Classic wrong answers.
function pairsWithItself(nums) {
  let best = -1;
  for (const v of nums) best = Math.max(best, v + v);
  return Math.max(best, reference(nums));
}
const zeroWhenNone = (nums) => Math.max(0, reference(nums));
function sortedNeighbours(nums) {
  const s = [...nums].sort((a, b) => b - a);
  let best = -1;
  for (let i = 1; i < s.length; i++) if (digitSum(s[i]) === digitSum(s[i - 1])) best = Math.max(best, s[i] + s[i - 1]);
  return best;
}

test('reference matches brute force on 3000 seeded random arrays', () => {
  const rnd = mulberry32(2342);
  for (let k = 0; k < 3000; k++) {
    const n = 1 + Math.floor(rnd() * 25);
    const max = [9, 100, 1000, 1000000000][k % 4];
    const nums = intArray(n, mulberry32(k + 1), { min: 1, max });
    assert.equal(reference(nums), brute(nums), JSON.stringify(nums));
  }
});

test('visible expectations agree; 15 valid cases; at least two at the size limit', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  // The largest possible answer appears and fits in 32 bits.
  assert.ok(problem.hiddenTests.some((t) => t.expected === 2000000000));
  assert.ok(problem.hiddenTests.every((t) => t.expected <= 2147483647));
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [pairsWithItself, zeroWhenNone, sortedNeighbours]) {
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser enforces size and range', () => {
  assert.deepEqual(problem.parseCustomInput('[18,43]').args, [[18, 43]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[0]').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('x').ok, false);
});
