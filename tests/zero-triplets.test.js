import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/zero-triplets/problem.js';

// Brute force: every triple of positions, deduplicated by value, then sorted lexicographically.
function brute(nums) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++)
      for (let k = j + 1; k < nums.length; k++) {
        if (nums[i] + nums[j] + nums[k] !== 0) continue;
        const t = [nums[i], nums[j], nums[k]].sort((x, y) => x - y);
        seen.set(t.join(','), t);
      }
  return [...seen.values()].sort((p, q) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2]);
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(51);
  for (let i = 0; i < 2000; i++) {
    const nums = Array.from({ length: 3 + Math.floor(rnd() * 10) }, () => Math.floor(rnd() * 13) - 6);
    assert.deepEqual(reference(nums), brute(nums));
  }
});

test('visible expectations agree; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 3000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[0,0]').ok, false);
  assert.equal(problem.parseCustomInput('[0,0,100001]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(new Array(3001).fill(0))).ok, false);
  assert.equal(problem.parseCustomInput('{}').ok, false);
  assert.deepEqual(problem.parseCustomInput('[1,-1,0]').args, [[1, -1, 0]]);
});
