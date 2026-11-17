import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/target-range/problem.js';

// Brute force: indexOf and lastIndexOf.
function brute(nums, target) {
  const l = nums.indexOf(target);
  return l < 0 ? [-1, -1] : [l, nums.lastIndexOf(target)];
}

test('reference matches brute force on 3000 random arrays', () => {
  const rnd = mulberry32(69);
  for (let i = 0; i < 3000; i++) {
    const nums = Array.from({ length: Math.floor(rnd() * 12) }, () => Math.floor(rnd() * 7) - 3).sort((x, y) => x - y);
    const target = Math.floor(rnd() * 11) - 5;
    assert.deepEqual(reference(nums, target), brute(nums, target));
  }
});

test('visible and hidden expectations agree with brute force; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests) assert.deepEqual(t.expected, brute(...t.args));
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[2,1]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n1000000001').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n"1"').ok, false);
  assert.deepEqual(problem.parseCustomInput('[]\n0').args, [[], 0]);
  assert.deepEqual(problem.parseCustomInput('[5,7,7,8]\n7').args, [[5, 7, 7, 8], 7]);
});
