import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/kth-highest/problem.js';

// Brute force by counting: the answer v has at least k values >= v and fewer than k values > v.
function brute(nums, k) {
  for (const v of nums) {
    const atLeast = nums.filter((x) => x >= v).length;
    const above = nums.filter((x) => x > v).length;
    if (atLeast >= k && above < k) return v;
  }
  throw new Error('unreachable');
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(37);
  for (let t = 0; t < 2000; t++) {
    const n = 1 + Math.floor(rnd() * 15);
    const range = 1 + Math.floor(rnd() * 10);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * (2 * range + 1)) - range);
    const k = 1 + Math.floor(rnd() * n);
    assert.equal(reference(nums, k), brute(nums, k));
  }
});

test('visible expectations agree; four max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 4);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n3').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n0').ok, false);
  assert.equal(problem.parseCustomInput('[10001]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[3,1,2]\n2').args, [[3, 1, 2], 2]);
});
