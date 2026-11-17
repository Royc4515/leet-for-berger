import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/balloon-pop/problem.js';

// Brute force: try every popping order (n!), simulating the row. Independent of the interval DP.
function brute(nums) {
  if (!nums.length) return 0;
  let best = 0;
  for (let i = 0; i < nums.length; i++) {
    const gain = (nums[i - 1] ?? 1) * nums[i] * (nums[i + 1] ?? 1);
    best = Math.max(best, gain + brute([...nums.slice(0, i), ...nums.slice(i + 1)]));
  }
  return best;
}

test('reference matches brute force on 1000 random rows', () => {
  const rnd = mulberry32(347);
  for (let t = 0; t < 1000; t++) {
    const n = 1 + Math.floor(rnd() * 6);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * (t % 4 === 0 ? 3 : 101)));
    assert.equal(reference(nums), brute(nums), JSON.stringify(nums));
  }
});

test('visible expectations agree; 15 valid cases; two cases with 300 balloons', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.ok(t.expected <= 2 ** 31 - 1);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 300).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[3,1,5,8]').args, [[3, 1, 5, 8]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[101]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(301).fill(1))).ok, false);
  assert.equal(problem.parseCustomInput('3,1').ok, false);
});
