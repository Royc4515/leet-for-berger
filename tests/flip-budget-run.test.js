import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/flip-budget-run/problem.js';

// Brute force: from every start, walk right and spend flips until the budget is gone.
function brute(nums, k) {
  let best = 0;
  for (let i = 0; i < nums.length; i++) {
    let used = 0;
    let len = 0;
    for (let j = i; j < nums.length; j++) {
      if (nums[j] === 0) used++;
      if (used > k) break;
      len++;
    }
    best = Math.max(best, len);
  }
  return best;
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(1004);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 16);
    const ones = rnd();
    const nums = Array.from({ length: n }, () => (rnd() < ones ? 1 : 0));
    const k = Math.floor(rnd() * (n + 1));
    assert.equal(reference(nums, k), brute(nums, k), `${JSON.stringify(nums)} ${k}`);
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
    const parsed = problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`);
    assert.equal(parsed.ok, true, parsed.error);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 4);
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length < 100)) assert.equal(brute(...t.args), t.expected);
  // Extending from every start costs about the sum of the window lengths: all zeros with
  // k = n / 2 is about n * n / 2 * 0.75 steps, far past a 2 s limit.
  const big = problem.hiddenTests.find((t) => t.args[0].every((v) => v === 0) && t.args[1] === 50000);
  assert.ok(big && big.args[0].length * big.args[1] >= 5e9);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Resets the window when the budget is exceeded instead of sliding it.
  const resets = (nums, k) => {
    let best = 0;
    let len = 0;
    let used = 0;
    for (const v of nums) {
      if (v === 0) used++;
      if (used > k) {
        len = 0;
        used = 0;
        if (v === 0 && k > 0) {
          used = 1;
          len = 0;
        }
      }
      len++;
      best = Math.max(best, len);
    }
    return best;
  };
  // Moves the left edge past the dropped element without ever giving back a zero it passed.
  const forgetsDecrement = (nums, k) => {
    let left = 0;
    let zeros = 0;
    let best = 0;
    for (let right = 0; right < nums.length; right++) {
      if (nums[right] === 0) zeros++;
      while (zeros > k && left <= right) left++;
      best = Math.max(best, right - left + 1);
    }
    return best;
  };
  // Flips the first k zeros it finds and then reports the longest run of ones.
  const flipsFirstK = (nums, k) => {
    const a = [...nums];
    let left = k;
    for (let i = 0; i < a.length && left > 0; i++) if (a[i] === 0) {
      a[i] = 1;
      left--;
    }
    let best = 0;
    let run = 0;
    for (const v of a) {
      run = v === 1 ? run + 1 : 0;
      best = Math.max(best, run);
    }
    return best;
  };
  // Ignores k = 0 correctness by treating a zero budget as one flip.
  const minOneFlip = (nums, k) => reference(nums, Math.max(k, 1));
  for (const [name, wrong] of [['resets window', resets], ['forgets to give back a zero', forgetsDecrement], ['flips first k zeros', flipsFirstK], ['k = 0 treated as 1', minOneFlip]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,0,1]\n1').args, [[1, 0, 1], 1]);
  assert.equal(problem.parseCustomInput('[1,0,1]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n0').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n0').ok, false);
  assert.equal(problem.parseCustomInput('[1,0]\n-1').ok, false);
  assert.equal(problem.parseCustomInput('[1,0]\n3').ok, false);
  assert.equal(problem.parseCustomInput('[1,0]\n1.5').ok, false);
  assert.equal(problem.parseCustomInput('[1,0]\n2').ok, true);
  assert.equal(problem.parseCustomInput(`${JSON.stringify(Array(100001).fill(1))}\n0`).ok, false);
  assert.equal(problem.solveReference([[1, 0, 1, 1, 0, 1], 1]), 4);
});
