import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/repeat-check/problem.js';

// Brute force: compare every pair in O(n^2).
function brute(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return true;
    }
  }
  return false;
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(217);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 25);
    const span = 1 + Math.floor(rnd() * 80);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * (2 * span + 1)) - span);
    assert.equal(reference(nums), brute(nums), JSON.stringify(nums));
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
    const parsed = problem.parseCustomInput(JSON.stringify(t.args[0]));
    assert.equal(parsed.ok, true, parsed.error);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 4);
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length < 100)) {
    assert.equal(brute(...t.args), t.expected);
  }
});

test('classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Checks only adjacent elements without sorting.
  const adjacentOnly = (nums) => {
    for (let i = 1; i < nums.length; i++) if (nums[i] === nums[i - 1]) return true;
    return false;
  };
  // Ignores negative numbers when building a lookup.
  const positiveOnly = (nums) => {
    const seen = new Set();
    for (const v of nums) {
      if (v < 0) continue;
      if (seen.has(v)) return true;
      seen.add(v);
    }
    return false;
  };
  // Compares only the first element against the rest.
  const firstOnly = (nums) => nums.slice(1).includes(nums[0]);
  for (const [name, wrong] of [['adjacent only', adjacentOnly], ['positive only', positiveOnly], ['first only', firstOnly]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,3,1]').args, [[1, 2, 3, 1]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('5').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]').ok, false);
  assert.equal(problem.parseCustomInput('[-1000000001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(100001).fill(0))).ok, false);
  assert.equal(problem.solveReference([[1, 2, 3, 1]]), true);
});
