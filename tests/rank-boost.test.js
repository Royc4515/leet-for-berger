import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/rank-boost/problem.js';

// Brute force: try every distinct reordering and keep the best score. Only usable for a handful of values.
function brute(nums) {
  let best = 0;
  const used = new Array(nums.length).fill(false);
  const rec = (pos, score) => {
    if (pos === nums.length) {
      best = Math.max(best, score);
      return;
    }
    for (let k = 0; k < nums.length; k++) {
      if (used[k]) continue;
      used[k] = true;
      rec(pos + 1, score + (nums[k] > nums[pos] ? 1 : 0));
      used[k] = false;
    }
  };
  rec(0, 0);
  return best;
}

test('reference matches brute force on 1500 random arrays, with many repeated values', () => {
  const rnd = mulberry32(71);
  for (let i = 0; i < 1500; i++) {
    const n = 1 + Math.floor(rnd() * 7);
    const maxVal = Math.floor(rnd() * 6);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * (maxVal + 1)));
    const copy = [...nums];
    assert.equal(reference(nums), brute(nums), JSON.stringify(nums));
    assert.deepEqual(nums, copy, 'reference must not mutate its input');
  }
});

test('reference equals n minus the highest frequency (the counting characterization)', () => {
  const rnd = mulberry32(73);
  for (let i = 0; i < 300; i++) {
    const n = 1 + Math.floor(rnd() * 40);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * 8));
    const freq = new Map();
    for (const v of nums) freq.set(v, (freq.get(v) ?? 0) + 1);
    assert.equal(reference(nums), n - Math.max(...freq.values()));
  }
});

test('5 visible and 10 hidden cases, expectations agree, max-size cases, valid input', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 8)) assert.equal(brute(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Distinct values minus one: right with all-distinct input, wrong with ties.
  const distinctMinusOne = (nums) => new Set(nums).size - 1;
  // Assumes the values are never all equal: wrong for a single value or all-equal input.
  const lengthMinusOne = (nums) => nums.length - 1;
  // Sorts with the default comparator, which orders numbers as text ("10" before "9").
  const textSort = (nums) => {
    const s = [...nums].sort();
    let j = 0;
    for (const x of s) if (x > s[j]) j++;
    return j;
  };
  // Pairs each value with the next larger one only when it is the immediate neighbor in sorted order.
  const neighborsOnly = (nums) => {
    const s = [...nums].sort((a, b) => a - b);
    let score = 0;
    for (let i = 0; i + 1 < s.length; i++) if (s[i + 1] > s[i] && (i === 0 || s[i] > s[i - 1])) score++;
    return score;
  };
  for (const [name, wrong] of [['distinct minus one', distinctMinusOne], ['length minus one', lengthMinusOne], ['text sort', textSort], ['neighbors only', neighborsOnly]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
  // An O(n^2) matcher cannot finish 10^5 values inside the per-case limit.
  assert.ok(all.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,3,5,2,1,3,1]'), { ok: true, args: [[1, 3, 5, 2, 1, 3, 1]] });
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(new Array(100001).fill(1))).ok, false);
  assert.equal(problem.parseCustomInput('1,2').ok, false);
  assert.equal(problem.solveReference([[1, 2, 3, 4]]), 3);
});
