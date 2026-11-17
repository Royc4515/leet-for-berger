import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/rain-trap/problem.js';

// Brute force: for every bar, scan both sides for the tallest wall.
function brute(heights) {
  let total = 0;
  for (let i = 0; i < heights.length; i++) {
    let left = 0;
    let right = 0;
    for (let j = 0; j <= i; j++) left = Math.max(left, heights[j]);
    for (let j = i; j < heights.length; j++) right = Math.max(right, heights[j]);
    total += Math.min(left, right) - heights[i];
  }
  return total;
}

test('reference matches brute force on 2000 random skylines', () => {
  const rnd = mulberry32(21);
  for (let i = 0; i < 2000; i++) {
    const heights = Array.from({ length: 1 + Math.floor(rnd() * 15) }, () => Math.floor(rnd() * 8));
    assert.equal(reference(heights), brute(heights));
  }
});

test('visible expectations agree; an answer exceeds 32 bits; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.some((t) => t.expected > 2 ** 31));
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 200000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[1,-1]').ok, false);
  assert.equal(problem.parseCustomInput('[100001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
  assert.deepEqual(problem.parseCustomInput(' [0,2,0] ').args, [[0, 2, 0]]);
});
