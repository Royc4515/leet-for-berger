import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/range-cover/problem.js';

// Brute force: every pair of values (a, b) with a <= b is a candidate; keep those that touch
// every list and pick the narrowest, then the smallest start.
function brute(nums) {
  const values = [...new Set(nums.flat())].sort((x, y) => x - y);
  let best = null;
  for (const a of values) {
    for (const b of values) {
      if (b < a) continue;
      if (!nums.every((list) => list.some((v) => v >= a && v <= b))) continue;
      if (best === null || b - a < best[1] - best[0] || (b - a === best[1] - best[0] && a < best[0])) best = [a, b];
    }
  }
  return best;
}

test('reference matches brute force on 1000 random inputs', () => {
  const rnd = mulberry32(47);
  for (let t = 0; t < 1000; t++) {
    const k = 1 + Math.floor(rnd() * 4);
    const range = 1 + Math.floor(rnd() * 15);
    const nums = Array.from({ length: k }, () =>
      Array.from({ length: 1 + Math.floor(rnd() * 5) }, () => Math.floor(rnd() * (2 * range + 1)) - range).sort((x, y) => x - y),
    );
    assert.deepEqual(reference(nums), brute(nums), JSON.stringify(nums));
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 3500 && t.args[0].every((l) => l.length === 50)).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[]]').ok, false);
  assert.equal(problem.parseCustomInput('[[3,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[100001]]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify([new Array(51).fill(0)])).ok, false);
  assert.deepEqual(problem.parseCustomInput('[[1,5],[3,7]]').args, [[[1, 5], [3, 7]]]);
});
