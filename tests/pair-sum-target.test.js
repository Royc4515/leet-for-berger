import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/pair-sum-target/problem.js';

// Brute force: every pair, in order.
function brute(nums, target) {
  for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) if (nums[i] + nums[j] === target) return [i, j];
  return [];
}

test('reference matches brute force on 2000 random arrays with a unique pair', () => {
  const rnd = mulberry32(1);
  let checked = 0;
  while (checked < 2000) {
    const nums = Array.from({ length: 2 + Math.floor(rnd() * 12) }, () => Math.floor(rnd() * 21) - 10);
    const target = Math.floor(rnd() * 41) - 20;
    if (problem.parseCustomInput(`${JSON.stringify(nums)}\n${target}`).ok) {
      assert.deepEqual(reference(nums, target), brute(nums, target));
      checked++;
    }
  }
});

test('every test has exactly one pair; sizes as declared', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('custom input rejects zero or several pairs', () => {
  assert.equal(problem.parseCustomInput('[1,2,3]\n100').ok, false);
  assert.equal(problem.parseCustomInput('[1,2,3,4]\n5').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n2').ok, false);
});
