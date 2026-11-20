import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/dominant-value/problem.js';

// Brute force: count each element by scanning the whole array and return the first value whose
// count passes half. No tally, no sorting.
function brute(nums) {
  for (const v of nums) {
    let c = 0;
    for (const w of nums) if (w === v) c++;
    if (c > Math.floor(nums.length / 2)) return v;
  }
  throw new Error('no majority');
}

/** A random array with a guaranteed majority value: exactly floor(n / 2) + 1 copies, rest random. */
function randomWithMajority(rnd) {
  const n = 1 + Math.floor(rnd() * 14);
  const pool = 1 + Math.floor(rnd() * 5);
  const major = Math.floor(rnd() * 7) - 3;
  const copies = Math.floor(n / 2) + 1;
  const rest = Array.from({ length: n - copies }, () => {
    let v;
    do v = Math.floor(rnd() * (pool + 1)) - 2;
    while (v === major);
    return v;
  });
  const out = [...new Array(copies).fill(major), ...rest];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

test('reference matches brute force on 3000 random arrays', () => {
  const rnd = mulberry32(169);
  for (let i = 0; i < 3000; i++) {
    const nums = randomWithMajority(rnd);
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
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true, JSON.stringify(t.args[0]).slice(0, 60));
  }
  const big = problem.hiddenTests.filter((t) => t.args[0].length >= 99999);
  assert.ok(big.length >= 2);
  // Every large case really has the promised majority (brute would be quadratic, so count once).
  for (const t of big) {
    const counts = new Map();
    for (const v of t.args[0]) counts.set(v, (counts.get(v) ?? 0) + 1);
    assert.ok(counts.get(t.expected) > Math.floor(t.args[0].length / 2));
  }
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 20)) assert.equal(brute(...t.args), t.expected);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // The first value, or the middle one of the unsorted array: right only for lucky arrangements.
  const first = (nums) => nums[0];
  const middle = (nums) => nums[Math.floor(nums.length / 2)];
  // The vote trick without the reset: the candidate is never replaced after the first value.
  const noReset = (nums) => nums[0];
  // The most common value among the first half only.
  const firstHalfMode = (nums) => {
    const half = nums.slice(0, Math.max(1, Math.floor(nums.length / 2)));
    const counts = new Map();
    for (const v of half) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  };
  for (const [name, wrong] of [['first value', first], ['middle of unsorted', middle], ['candidate never replaced', noReset], ['mode of first half', firstHalfMode]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[2,2,1,1,1,2,2]').args, [[2, 2, 1, 1, 1, 2, 2]]);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false, 'no majority');
  assert.equal(problem.parseCustomInput('[1,1,2,2]').ok, false, 'a tie is not a majority');
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('[2000000000]').ok, false);
  assert.equal(problem.parseCustomInput('1,1').ok, false);
  assert.equal(problem.solveReference([[3, 2, 3]]), 3);
});
