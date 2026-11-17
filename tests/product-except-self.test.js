import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/product-except-self/problem.js';

// Brute force: multiply everything but i, for every i. Independent of the reference.
function brute(nums) {
  return nums.map((_, i) => {
    let p = 1;
    for (let j = 0; j < nums.length; j++) if (j !== i) p *= nums[j];
    return p || 0;
  });
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(1);
  for (let k = 0; k < 2000; k++) {
    const nums = Array.from({ length: 2 + Math.floor(rnd() * 9) }, () => Math.floor(rnd() * 11) - 5);
    assert.deepEqual(reference(nums), brute(nums));
  }
});

test('visible expectations agree with the reference; every test parses; sizes as declared', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    // Answers must be 32-bit for the typed languages.
    assert.ok(t.expected.every((v) => Number.isInteger(v) && Math.abs(v) <= 2147483647));
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.args[0].filter((v) => v === 0).length === 2));
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[1]').ok, false);
  assert.equal(problem.parseCustomInput('[1,31]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2.5]').ok, false);
  assert.equal(problem.parseCustomInput('1,2').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(10).fill(30))).ok, false);
  assert.equal(problem.parseCustomInput('[0,30,30,30,30,30,30]').ok, true);
});
