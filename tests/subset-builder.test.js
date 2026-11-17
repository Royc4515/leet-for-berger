import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/subset-builder/problem.js';

// Brute force: every bitmask is one subset; sort each subset, then sort the list with an explicit
// lexicographic comparator (a shorter prefix first). Independent of the search order.
function brute(nums) {
  const n = nums.length;
  const all = [];
  for (let mask = 0; mask < 1 << n; mask++) all.push(nums.filter((_, i) => mask & (1 << i)).sort((x, y) => x - y));
  const lex = (p, q) => {
    for (let i = 0; i < Math.min(p.length, q.length); i++) if (p[i] !== q[i]) return p[i] - q[i];
    return p.length - q.length;
  };
  return all.sort(lex);
}

test('reference matches brute force on 1000 random inputs', () => {
  const rnd = mulberry32(61);
  for (let t = 0; t < 1000; t++) {
    const n = 1 + Math.floor(rnd() * 7);
    const pool = Array.from({ length: 21 }, (_, i) => i - 10);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const nums = pool.slice(0, n);
    assert.deepEqual(reference(nums), brute(nums), JSON.stringify(nums));
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 14).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[1,1]').ok, false);
  assert.equal(problem.parseCustomInput('[11]').ok, false);
  assert.equal(problem.parseCustomInput('[0.5]').ok, false);
  assert.equal(problem.parseCustomInput('[-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[3,1]').args, [[3, 1]]);
});
