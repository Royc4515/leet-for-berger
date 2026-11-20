import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/bounded-sum-pairs/problem.js';

// Brute force: every pair of positions. Independent of sorting and of the two-pointer pass.
function brute(nums, lower, upper) {
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const s = nums[i] + nums[j];
      if (s >= lower && s <= upper) count++;
    }
  }
  return count;
}

// Classic wrong answers.
// 32-bit count: wraps like a Java or C int would.
const int32Count = (nums, lower, upper) => reference(nums, lower, upper) | 0;
// Exclusive lower bound: subtracts the pairs below lower itself, dropping sums equal to lower.
const exclusiveLower = (nums, lower, upper) => reference(nums, lower + 1, upper);
// Exclusive upper bound.
const exclusiveUpper = (nums, lower, upper) => reference(nums, lower, upper - 1);
// Ordered pairs: counts (i, j) and (j, i), so everything doubles.
const orderedPairs = (nums, lower, upper) => 2 * reference(nums, lower, upper);
// Also pairs an element with itself.
function withSelfPairs(nums, lower, upper) {
  return reference(nums, lower, upper) + nums.filter((v) => 2 * v >= lower && 2 * v <= upper).length;
}

function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 10);
  const range = [3, 10, 1000, 1000000000][Math.floor(rnd() * 4)];
  const nums = Array.from({ length: n }, () => Math.floor(rnd() * (2 * range + 1)) - range);
  const a = Math.floor(rnd() * (4 * range + 1)) - 2 * range;
  const b = Math.floor(rnd() * (4 * range + 1)) - 2 * range;
  const clamp = (v) => Math.max(-1e9, Math.min(1e9, v));
  return [nums, clamp(Math.min(a, b)), clamp(Math.max(a, b))];
}

test('reference matches brute force on 3000 seeded small inputs', () => {
  const rnd = mulberry32(2563);
  let nonzero = 0;
  for (let i = 0; i < 3000; i++) {
    const [nums, lower, upper] = randomCase(rnd);
    const expected = brute(nums, lower, upper);
    assert.equal(reference(nums, lower, upper), expected, JSON.stringify([nums, lower, upper]));
    if (expected > 0) nonzero++;
  }
  assert.ok(nonzero > 1000, `only ${nonzero} cases had a pair`);
});

test('reference matches brute force on 40 seeded medium inputs', () => {
  const rnd = mulberry32(2564);
  for (let i = 0; i < 40; i++) {
    const nums = Array.from({ length: 300 }, () => Math.floor(rnd() * 2001) - 1000);
    const lower = Math.floor(rnd() * 1000) - 800;
    const upper = lower + Math.floor(rnd() * 800);
    assert.equal(reference(nums, lower, upper), brute(nums, lower, upper));
  }
});

test('visible expectations agree with the reference and the brute force', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
});

test('hidden tests are valid, include at least two max-size tests and answers beyond 32 bits', () => {
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = t.args.map((a) => JSON.stringify(a)).join('\n');
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  assert.ok(problem.hiddenTests.filter((t) => t.expected > 2 ** 31).length >= 2);
  // Sums of exactly +-2 * 10^9 are exercised, which are the largest values a sum can take.
  assert.ok(problem.hiddenTests.some((t) => t.args[0].includes(1e9) && t.args[0].includes(-1e9)));
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [int32Count, exclusiveLower, exclusiveUpper, orderedPairs, withSelfPairs]) {
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden test`);
  }
  // Boundary mistakes already show on the visible cases.
  assert.ok(problem.visibleTests.some((t) => exclusiveLower(...t.args) !== t.expected));
  assert.ok(problem.visibleTests.some((t) => exclusiveUpper(...t.args) !== t.expected));
});

test('checking every pair would take billions of sums on the max tests', () => {
  const pairs = (n) => (n * (n - 1)) / 2;
  const heavy = problem.hiddenTests.filter((t) => pairs(t.args[0].length) > 4e9);
  assert.ok(heavy.length >= 2);
});

test('custom input parser rejects invalid input', () => {
  assert.equal(problem.parseCustomInput('[1,2,3]\n2\n5').ok, true);
  assert.equal(problem.parseCustomInput('[1,2,3]\n5\n2').ok, false);
  assert.equal(problem.parseCustomInput('[]\n0\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]\n0\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n-1000000001\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n0\n1000000001').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]\n0\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n0').ok, false);
  assert.equal(problem.parseCustomInput('nope\n0\n1').ok, false);
});
