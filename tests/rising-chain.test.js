import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/rising-chain/problem.js';

// Brute force: the O(n^2) DP over "longest chain ending at i". Independent of the reference.
function brute(nums) {
  const f = nums.map(() => 1);
  for (let i = 0; i < nums.length; i++)
    for (let j = 0; j < i; j++) if (nums[j] < nums[i]) f[i] = Math.max(f[i], f[j] + 1);
  return Math.max(...f);
}

test('reference matches brute force on 3000 random arrays', () => {
  const rnd = mulberry32(149);
  for (let t = 0; t < 3000; t++) {
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 20) }, () => Math.floor(rnd() * 9) - 4);
    assert.equal(reference(nums), brute(nums));
  }
});

test('visible expectations agree; two max-size cases; every test parses', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]').ok, false);
  assert.equal(problem.parseCustomInput('[0.5]').ok, false);
  assert.equal(problem.parseCustomInput('7').ok, false);
  assert.deepEqual(problem.parseCustomInput('[7,7]').args, [[7, 7]]);
});
