import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/mountain-peak/problem.js';

// Brute force: index of the maximum (unique on a mountain).
const brute = (nums) => nums.indexOf(Math.max(...nums));

test('reference matches brute force on 3000 random mountains', () => {
  const rnd = mulberry32(70);
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 12);
    const peak = Math.floor(rnd() * n);
    const nums = new Array(n);
    nums[peak] = Math.floor(rnd() * 20);
    for (let j = peak - 1; j >= 0; j--) nums[j] = nums[j + 1] - 1 - Math.floor(rnd() * 3);
    for (let j = peak + 1; j < n; j++) nums[j] = nums[j - 1] - 1 - Math.floor(rnd() * 3);
    assert.equal(reference(nums), peak);
    assert.equal(brute(nums), peak);
    assert.equal(problem.parseCustomInput(JSON.stringify(nums)).ok, true);
  }
});

test('visible and hidden expectations agree with brute force; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests) assert.equal(t.expected, brute(...t.args));
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser rejects non-mountains', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[1,1]').ok, false);
  assert.equal(problem.parseCustomInput('[1,3,2,4]').ok, false);
  assert.equal(problem.parseCustomInput('[3,1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2,2,1]').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[1,3,2]').args, [[1, 3, 2]]);
});
