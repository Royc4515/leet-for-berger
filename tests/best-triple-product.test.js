import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/best-triple-product/problem.js';

// Brute force: try every index triple i < j < k in O(n^3).
function brute(nums) {
  let best = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      for (let k = j + 1; k < nums.length; k++) {
        const p = nums[i] * nums[j] * nums[k];
        if (p > best) best = p;
      }
    }
  }
  return best;
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(628);
  for (let i = 0; i < 2000; i++) {
    const n = 3 + Math.floor(rnd() * 14);
    const mode = i % 4;
    const nums = Array.from({ length: n }, () => {
      if (mode === 0) return Math.floor(rnd() * 21) - 10; // mixed
      if (mode === 1) return -1 - Math.floor(rnd() * 20); // all negative
      if (mode === 2) return Math.floor(rnd() * 21); // non-negative
      return Math.floor(rnd() * 2001) - 1000; // full range
    });
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
    assert.ok(t.expected >= -1000000000 && t.expected <= 1000000000);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 4);
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length < 50)) {
    assert.equal(brute(...t.args), t.expected);
  }
});

test('classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Only multiplies the three largest values, ignoring two large negatives.
  const topThreeOnly = (nums) => {
    const s = [...nums].sort((a, b) => a - b);
    const n = s.length;
    return s[n - 1] * s[n - 2] * s[n - 3];
  };
  // Initializes best answer to 0, breaking all-negative arrays.
  const zeroFloor = (nums) => Math.max(0, reference(nums));
  // Deduplicates into a Set before picking extremes.
  const deduped = (nums) => {
    const s = [...new Set(nums)].sort((a, b) => a - b);
    if (s.length < 3) return 0;
    const n = s.length;
    return Math.max(s[n - 1] * s[n - 2] * s[n - 3], s[0] * s[1] * s[n - 1]);
  };
  for (const [name, wrong] of [['top three only', topThreeOnly], ['zero floor', zeroFloor], ['deduped values', deduped]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[-10,-10,5,2]').args, [[-10, -10, 5, 2]]);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[1001,1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[-1001,1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5,2,3]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(100001).fill(1))).ok, false);
  assert.equal(problem.solveReference([[-10, -10, 5, 2]]), 500);
});
