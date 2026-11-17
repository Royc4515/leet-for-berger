import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/street-heist/problem.js';

// Brute force: every subset of houses with no two adjacent. Independent of the reference.
function brute(nums) {
  let best = 0;
  for (let mask = 0; mask < 1 << nums.length; mask++) {
    if (mask & (mask >> 1)) continue;
    let s = 0;
    for (let i = 0; i < nums.length; i++) if (mask & (1 << i)) s += nums[i];
    best = Math.max(best, s);
  }
  return best;
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(109);
  for (let t = 0; t < 2000; t++) {
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 14) }, () => Math.floor(rnd() * 10));
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
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[10001]').ok, false);
  assert.equal(problem.parseCustomInput('[1,"2"]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[2,1,1,2]').args, [[2, 1, 1, 2]]);
});
