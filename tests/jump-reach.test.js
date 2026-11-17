import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/jump-reach/problem.js';

// Brute force: mark every index reachable by trying every jump length. Independent of the reference.
function brute(nums) {
  const ok = Array(nums.length).fill(false);
  ok[0] = true;
  for (let i = 0; i < nums.length; i++) {
    if (!ok[i]) continue;
    for (let d = 1; d <= nums[i] && i + d < nums.length; d++) ok[i + d] = true;
  }
  return ok[nums.length - 1];
}

test('reference matches brute force on 3000 random arrays', () => {
  const rnd = mulberry32(73);
  for (let t = 0; t < 3000; t++) {
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 12) }, () => Math.floor(rnd() * 4));
    assert.equal(reference(nums), brute(nums));
  }
});

test('visible expectations agree; two max-size cases; both answers hidden; every test parses', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected === true));
  assert.ok(problem.hiddenTests.some((t) => t.expected === false));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[100001]').ok, false);
  assert.equal(problem.parseCustomInput('[1,').ok, false);
  assert.deepEqual(problem.parseCustomInput('[2,0,0]').args, [[2, 0, 0]]);
});
