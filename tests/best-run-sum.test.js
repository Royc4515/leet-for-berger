import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/best-run-sum/problem.js';

// Brute force: sum every non-empty subarray directly. Independent of the reference.
function brute(nums) {
  let best = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    let s = 0;
    for (let j = i; j < nums.length; j++) {
      s += nums[j];
      best = Math.max(best, s);
    }
  }
  return best;
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(71);
  for (let t = 0; t < 2000; t++) {
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 15) }, () => Math.floor(rnd() * 21) - 12);
    assert.equal(reference(nums), brute(nums));
  }
});

test('visible expectations agree; two max-size cases; every test parses', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  // At least one all-negative hidden case, so "start at 0" is caught.
  assert.ok(problem.hiddenTests.some((t) => t.expected < 0));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[10001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(new Array(100001).fill(0))).ok, false);
  assert.deepEqual(problem.parseCustomInput('[-1,2]').args, [[-1, 2]]);
});
