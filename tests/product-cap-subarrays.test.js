import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/product-cap-subarrays/problem.js';

// Brute force: every subarray, product in BigInt so overflow cannot hide a bug.
function brute(nums, k) {
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    let product = 1n;
    for (let j = i; j < nums.length; j++) {
      product *= BigInt(nums[j]);
      if (product < BigInt(k)) count++;
    }
  }
  return count;
}

// Classic wrong answers.
// 32-bit count: wraps like a Java or C int would.
const int32Count = (nums, k) => reference(nums, k) | 0;
// One subarray per right end instead of right - left + 1.
function countsOnePerEnd(nums, k) {
  if (k <= 1) return 0;
  let product = 1;
  let left = 0;
  let count = 0;
  for (let right = 0; right < nums.length; right++) {
    product *= nums[right];
    while (product >= k) product /= nums[left++];
    if (right >= left) count++;
  }
  return count;
}
// No k <= 1 guard: the shrink loop runs past the window (nums[left] becomes undefined, the
// product turns NaN) and the length goes negative.
function noSmallKGuard(nums, k) {
  let product = 1;
  let left = 0;
  let count = 0;
  for (let right = 0; right < nums.length; right++) {
    product *= nums[right];
    while (product >= k) product /= nums[left++];
    count += right - left + 1;
  }
  return count;
}
// Strict versus non-strict comparison: counts products equal to k.
function countsEqualToK(nums, k) {
  return brute(nums, k + 1);
}

function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 12);
  const max = [3, 10, 100, 10000][Math.floor(rnd() * 4)];
  const nums = Array.from({ length: n }, () => 1 + Math.floor(rnd() * max));
  const k = [0, 1, 2, 10, 100, 1000, 1000000000][Math.floor(rnd() * 7)];
  return [nums, rnd() < 0.5 ? k : Math.floor(rnd() * (k + 1))];
}

test('reference matches brute force on 3000 seeded small inputs', () => {
  const rnd = mulberry32(713);
  for (let i = 0; i < 3000; i++) {
    const [nums, k] = randomCase(rnd);
    assert.equal(reference(nums, k), brute(nums, k), `${JSON.stringify(nums)} k=${k}`);
  }
});

test('reference matches brute force on 60 seeded medium inputs with long windows', () => {
  const rnd = mulberry32(714);
  for (let i = 0; i < 60; i++) {
    const nums = Array.from({ length: 200 }, () => (rnd() < 0.05 ? 2 + Math.floor(rnd() * 8) : 1));
    const k = 1 + Math.floor(rnd() * 1000000000);
    assert.equal(reference(nums, k), brute(nums, k), `k=${k}`);
  }
});

test('number ranges: the product stays below 10^13 and the count needs more than 32 bits', () => {
  // k * max(nums) bounds the window product just before it is shrunk.
  assert.ok(1000000000 * 10000 < Number.MAX_SAFE_INTEGER);
  const ones = problem.hiddenTests.find((t) => t.args[0].length === 100000 && t.args[0].every((v) => v === 1));
  assert.equal(ones.expected, 100000 * 100001 / 2);
  assert.ok(ones.expected > 2 ** 31 - 1);
});

test('visible expectations agree; 15 valid cases; at least two arrays at 10^5 elements', () => {
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
  // Small hidden cases agree with the brute force too.
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 1000)) assert.equal(brute(...t.args), t.expected);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [int32Count, countsOnePerEnd, noSmallKGuard, countsEqualToK]) {
    const differs = (t) => wrong(...t.args) !== t.expected;
    // countsEqualToK and brute are quadratic; only run them on inputs that are small enough.
    const cases = wrong === countsEqualToK ? suite.filter((t) => t.args[0].length <= 1000) : suite;
    assert.ok(cases.some(differs), `${wrong.name} passes every case`);
    if (wrong !== countsEqualToK) assert.ok(problem.hiddenTests.some(differs), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects malformed input', () => {
  assert.deepEqual(problem.parseCustomInput('[10,5,2,6]\n100').args, [[10, 5, 2, 6], 100]);
  assert.equal(problem.parseCustomInput('[10,5,2,6]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n5').ok, false);
  assert.equal(problem.parseCustomInput('[0]\n5').ok, false);
  assert.equal(problem.parseCustomInput('[10001]\n5').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]\n5').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n-1').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n1000000001').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n2.5').ok, false);
  assert.equal(problem.parseCustomInput('nope\n5').ok, false);
});
