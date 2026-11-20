import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/balanced-cuts/problem.js';

// Brute force: table over (parts used, prefix length), trying every position for the last cut.
// O(n^2 * k) and independent of the binary search.
function brute(nums, k) {
  const n = nums.length;
  const prefix = [0];
  for (const v of nums) prefix.push(prefix[prefix.length - 1] + v);
  let best = Array.from({ length: n + 1 }, (_, i) => prefix[i]);
  for (let parts = 2; parts <= k; parts++) {
    const next = Array(n + 1).fill(Infinity);
    for (let i = parts; i <= n; i++) {
      for (let j = parts - 1; j < i; j++) next[i] = Math.min(next[i], Math.max(best[j], prefix[i] - prefix[j]));
    }
    best = next;
  }
  return best[n];
}

// Classic wrong answer: close a part as soon as it reaches total / k.
function equalChunks(nums, k) {
  const target = nums.reduce((a, b) => a + b, 0) / k;
  let worst = 0;
  let sum = 0;
  let parts = 0;
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
    if (sum >= target && parts < k - 1) {
      worst = Math.max(worst, sum);
      sum = 0;
      parts++;
    }
  }
  return Math.max(worst, sum);
}

// Classic wrong answer: the average part, or the largest value if that is bigger.
function averageBound(nums, k) {
  return Math.max(Math.max(...nums), Math.ceil(nums.reduce((a, b) => a + b, 0) / k));
}

// Classic wrong answer: the right binary search with every sum held in a 32-bit integer.
function int32Sums(nums, k) {
  let lo = Math.max(...nums);
  let hi = nums.reduce((a, b) => (a + b) | 0, 0);
  const fits = (cap) => {
    let parts = 1;
    let cur = 0;
    for (const v of nums) {
      if (((cur + v) | 0) > cap) {
        parts++;
        cur = v;
      } else {
        cur = (cur + v) | 0;
      }
    }
    return parts <= k;
  };
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 12);
  const top = [3, 10, 100][Math.floor(rnd() * 3)];
  const nums = Array.from({ length: n }, () => (rnd() < 0.15 ? 0 : Math.floor(rnd() * (top + 1))));
  const k = 1 + Math.floor(rnd() * Math.min(n, 6));
  return [nums, k];
}

test('reference matches the O(n^2 k) table on 3000 random inputs', () => {
  const rnd = mulberry32(410);
  for (let i = 0; i < 3000; i++) {
    const [nums, k] = randomCase(rnd);
    assert.equal(reference(nums, k), brute(nums, k), JSON.stringify([nums, k]));
  }
});

test('visible expectations agree; 15 valid cases; full-size cases', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
  for (const t of problem.visibleTests) assert.equal(brute(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 10000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected > 2 ** 31 - 1), 'one answer needs 64 bits');
  // The table costs about n^2 * k / 2 steps; at the largest case that is far past a 2 s budget.
  const big = problem.hiddenTests.find((t) => t.args[0].length === 10000 && t.args[1] === 50);
  assert.ok((big.args[0].length ** 2 * big.args[1]) / 2 > 1e9);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [equalChunks, averageBound, int32Sums]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
  for (const t of suite) assert.ok(t.expected >= Math.max(...t.args[0]), 'answer is at least the largest value');
});

test('custom input parser rejects bad values', () => {
  assert.deepEqual(problem.parseCustomInput('[7,2,5,10,8]\n2').args, [[7, 2, 5, 10, 8], 2]);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n3').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n0').ok, false);
  assert.equal(problem.parseCustomInput('[-1,2]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1000001]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]\n1').ok, false);
  assert.equal(problem.parseCustomInput('nope\n1').ok, false);
});
