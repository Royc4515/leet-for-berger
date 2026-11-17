import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/smaller-count/problem.js';

// Brute force: compare every pair. Independent of the reference's counting.
const brute = (nums) => nums.map((v) => nums.filter((w) => w < v).length);

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(9);
  for (let t = 0; t < 2000; t++) {
    // Alternate a narrow range (many duplicates) and the full range.
    const maxV = t % 2 ? 5 : 100;
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 20) }, () => Math.floor(rnd() * (maxV + 1)));
    assert.deepEqual(reference(nums), brute(nums));
  }
});

test('visible expectations agree with the reference; every test parses; sizes as declared', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[101]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('8,1,2').ok, false);
  assert.equal(problem.parseCustomInput('[0,100]').ok, true);
});
