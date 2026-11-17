import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/zeros-to-end/problem.js';

// Brute force: bubble each zero one step right until it reaches the zeros at the end.
function brute(input) {
  const nums = [...input];
  for (let pass = 0; pass < nums.length; pass++) {
    for (let i = 0; i + 1 < nums.length; i++) if (nums[i] === 0 && nums[i + 1] !== 0) [nums[i], nums[i + 1]] = [nums[i + 1], nums[i]];
  }
  return nums;
}

test('reference matches adjacent swapping on 2000 random arrays', () => {
  const rnd = mulberry32(41);
  for (let i = 0; i < 2000; i++) {
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 12) }, () => (rnd() < 0.4 ? 0 : Math.floor(rnd() * 11) - 5));
    assert.deepEqual(reference(nums), brute(nums));
  }
});

test('visible expectations agree; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[2147483648]').ok, false);
  assert.equal(problem.parseCustomInput('[0.5]').ok, false);
  assert.equal(problem.parseCustomInput('0,1').ok, false);
  assert.deepEqual(problem.parseCustomInput('[0,1]').args, [[0, 1]]);
});
