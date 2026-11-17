import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/best-run-product/problem.js';

// Brute force: multiply out every subarray in BigInt. Independent of the reference.
function brute(nums) {
  let best = null;
  for (let i = 0; i < nums.length; i++) {
    let p = 1n;
    for (let j = i; j < nums.length; j++) {
      p *= BigInt(nums[j]);
      if (best === null || p > best) best = p;
    }
  }
  return Number(best);
}

test('reference matches brute force on 3000 random arrays', () => {
  const rnd = mulberry32(163);
  for (let t = 0; t < 3000; t++) {
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 12) }, () => Math.floor(rnd() * 11) - 5);
    assert.equal(reference(nums), brute(nums));
  }
});

test('visible expectations agree; two max-size cases; a 64-bit answer; every test parses', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected > 2147483647));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  // The stated bound keeps every answer exact in a double.
  for (const t of problem.hiddenTests) assert.ok(Math.abs(t.expected) <= 1e15);
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[11]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  // 10^16 overflows the guarantee even though every value is in range...
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(16).fill(10))).ok, false);
  // ...but a zero in the middle splits it into two products of 10^8.
  assert.equal(problem.parseCustomInput(JSON.stringify([...Array(8).fill(10), 0, ...Array(8).fill(-10)])).ok, true);
  assert.deepEqual(problem.parseCustomInput('[2,3,-2,4]').args, [[2, 3, -2, 4]]);
});
