import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/equal-after-deletes/problem.js';

// Brute force, by value rather than by window: for every value and every pair of its occurrences
// (a, b), the stretch a..b keeps the copies of that value inside it and deletes the rest.
// It is affordable when the deleted count is at most k; the best kept count wins.
function brute(nums, k) {
  let best = 1;
  for (let a = 0; a < nums.length; a++) {
    for (let b = a; b < nums.length; b++) {
      if (nums[a] !== nums[b]) continue;
      let kept = 0;
      for (let i = a; i <= b; i++) if (nums[i] === nums[a]) kept++;
      if (b - a + 1 - kept <= k) best = Math.max(best, kept);
    }
  }
  return best;
}

function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 14);
  const maxV = 1 + Math.floor(rnd() * n);
  const nums = Array.from({ length: n }, () => 1 + Math.floor(rnd() * maxV));
  return [nums, Math.floor(rnd() * (n + 1))];
}

test('reference matches brute force on 3000 random cases', () => {
  const rnd = mulberry32(2831);
  for (let i = 0; i < 3000; i++) {
    const [nums, k] = randomCase(rnd);
    assert.equal(reference(nums, k), brute(nums, k), JSON.stringify([nums, k]));
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
    const raw = `${JSON.stringify(t.args[0])}\n${t.args[1]}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 60));
  }
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 12)) assert.equal(brute(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000);
  assert.ok(big.length >= 2);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Ignores k: the longest run of equal values.
  const runOnly = (nums) => {
    let best = 1;
    let run = 1;
    for (let i = 1; i < nums.length; i++) {
      run = nums[i] === nums[i - 1] ? run + 1 : 1;
      best = Math.max(best, run);
    }
    return best;
  };
  // Ignores the cost of joining: the highest total count of any value.
  const mostFrequent = (nums) => {
    const counts = new Map();
    for (const v of nums) counts.set(v, (counts.get(v) ?? 0) + 1);
    return Math.max(...counts.values());
  };
  // Returns the window length instead of the kept count (counts the deleted elements too).
  const windowLength = (nums, k) => {
    const count = new Array(nums.length + 1).fill(0);
    let best = 0;
    let left = 0;
    let longest = 0;
    for (let right = 0; right < nums.length; right++) {
      best = Math.max(best, ++count[nums[right]]);
      if (right - left + 1 - best > k) count[nums[left++]]--;
      longest = Math.max(longest, right - left + 1);
    }
    return longest;
  };
  // Treats k as extra copies: min(total count, longest run + k).
  const runPlusK = (nums, k) => Math.min(mostFrequent(nums), runOnly(nums) + k);
  const small = all.filter((t) => t.args[0].length <= 1000);
  for (const [name, wrong] of [['longest run, ignores k', runOnly], ['most frequent overall', mostFrequent], ['window length', windowLength], ['run plus k', runPlusK]]) {
    assert.ok(small.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[2,2,1,2,3,2,1]\n2').args, [[2, 2, 1, 2, 3, 2, 1], 2]);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false, 'k missing');
  assert.equal(problem.parseCustomInput('[1,2]\n3').ok, false, 'k above n');
  assert.equal(problem.parseCustomInput('[1,2]\n-1').ok, false);
  assert.equal(problem.parseCustomInput('[3,1]\n0').ok, false, 'value above n');
  assert.equal(problem.parseCustomInput('[0,1]\n0').ok, false, 'value below 1');
  assert.equal(problem.parseCustomInput('[]\n0').ok, false);
  assert.equal(problem.parseCustomInput('x\n0').ok, false);
  assert.equal(problem.solveReference([[1, 1, 2, 2, 2, 1, 1], 0]), 3);
});
