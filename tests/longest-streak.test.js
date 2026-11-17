import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/longest-streak/problem.js';

// Brute force: sort the distinct values and scan.
function brute(nums) {
  const v = [...new Set(nums)].sort((a, b) => a - b);
  let best = v.length ? 1 : 0;
  let run = 1;
  for (let i = 1; i < v.length; i++) {
    run = v[i] === v[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(4);
  for (let i = 0; i < 2000; i++) {
    const nums = Array.from({ length: Math.floor(rnd() * 20) }, () => Math.floor(rnd() * 30) - 15);
    assert.equal(reference(nums), brute(nums));
  }
});

test('visible expectations agree; tests are valid input', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('[2000000000]').ok, false);
  assert.equal(problem.parseCustomInput('[]').ok, true);
});
