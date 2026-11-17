import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/doubled-array/problem.js';

// Brute force: the definition, ans = nums followed by nums.
const brute = (nums) => nums.concat(nums);

test('reference matches brute force on 1000 random arrays and does not mutate its input', () => {
  const rnd = mulberry32(160);
  for (let k = 0; k < 1000; k++) {
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 30) }, () => 1 + Math.floor(rnd() * 1000));
    const copy = [...nums];
    assert.deepEqual(reference(nums), brute(nums));
    assert.deepEqual(nums, copy);
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 1000).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,1]'), { ok: true, args: [[1, 2, 1]] });
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[0]').ok, false);
  assert.equal(problem.parseCustomInput('[1001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(new Array(1001).fill(1))).ok, false);
  assert.equal(problem.parseCustomInput('1,2').ok, false);
});
