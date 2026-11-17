import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/lone-number/problem.js';

// Brute force: count every value against the whole array.
const brute = (nums) => nums.find((v) => nums.filter((w) => w === v).length === 1);

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(24);
  for (let k = 0; k < 2000; k++) {
    const pairs = Math.floor(rnd() * 8);
    const pool = new Set();
    while (pool.size < pairs + 1) pool.add(Math.floor(rnd() * 61) - 30);
    const [lone, ...rest] = [...pool];
    const nums = [lone, ...rest, ...rest];
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    assert.ok(problem.parseCustomInput(JSON.stringify(nums)).ok);
    assert.equal(reference(nums), brute(nums));
  }
});

test('visible expectations agree; tests are valid input; size limit is exercised', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 29999).length >= 2);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[1,1,1]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2,3]').ok, false);
  assert.equal(problem.parseCustomInput('[30001]').ok, false);
  assert.equal(problem.parseCustomInput('[2,2,1]').ok, true);
});
