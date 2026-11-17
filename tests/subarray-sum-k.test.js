import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/subarray-sum-k/problem.js';

// Brute force: sum every subarray directly. Independent of the reference.
function brute(nums, k) {
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    let s = 0;
    for (let j = i; j < nums.length; j++) {
      s += nums[j];
      if (s === k) count++;
    }
  }
  return count;
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(2);
  for (let t = 0; t < 2000; t++) {
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 15) }, () => Math.floor(rnd() * 9) - 4);
    const k = Math.floor(rnd() * 13) - 6;
    assert.deepEqual(reference(nums, k), brute(nums, k));
  }
});

test('visible expectations agree with the reference; every test parses; sizes as declared', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  // At least one answer must overflow 32 bits, so an int counter fails.
  assert.ok(problem.hiddenTests.some((t) => t.expected > 2147483647));
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[1,2,3]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n0').ok, false);
  assert.equal(problem.parseCustomInput('[1001]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n10000001').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n1.5').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n3').ok, true);
});
