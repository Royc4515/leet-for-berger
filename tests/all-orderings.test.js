import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/all-orderings/problem.js';

// Brute force: Heap's algorithm (swap-based, a different generation order), then an explicit
// lexicographic sort. Independent of the reference's search.
function brute(nums) {
  const a = [...nums];
  const out = [];
  const gen = (k) => {
    if (k === 1) {
      out.push([...a]);
      return;
    }
    for (let i = 0; i < k; i++) {
      gen(k - 1);
      const j = k % 2 === 0 ? i : 0;
      [a[j], a[k - 1]] = [a[k - 1], a[j]];
    }
  };
  gen(a.length);
  return out.sort((p, q) => {
    for (let i = 0; i < p.length; i++) if (p[i] !== q[i]) return p[i] - q[i];
    return 0;
  });
}

test('reference matches brute force on 1000 random inputs', () => {
  const rnd = mulberry32(67);
  for (let t = 0; t < 1000; t++) {
    const n = 1 + Math.floor(rnd() * 6);
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
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 8).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[2,2]').ok, false);
  assert.equal(problem.parseCustomInput('[-11]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2,3,4,5,6,7,8,9]').ok, false);
  assert.equal(problem.parseCustomInput('"12"').ok, false);
  assert.deepEqual(problem.parseCustomInput('[2,1]').args, [[2, 1]]);
});
