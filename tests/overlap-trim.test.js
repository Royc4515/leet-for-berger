import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/overlap-trim/problem.js';

// Brute force: try every subset, keep the largest pairwise-disjoint one. Independent of the reference.
function brute(intervals) {
  const n = intervals.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    const picked = intervals.filter((_, i) => mask & (1 << i));
    const ok = picked.every((a, i) => picked.every((b, j) => i === j || a[1] <= b[0] || b[1] <= a[0]));
    if (ok) best = Math.max(best, picked.length);
  }
  return n - best;
}

test('reference matches brute force on 1500 random interval sets', () => {
  const rnd = mulberry32(79);
  for (let t = 0; t < 1500; t++) {
    const intervals = Array.from({ length: 1 + Math.floor(rnd() * 9) }, () => {
      const s = Math.floor(rnd() * 10) - 5;
      return [s, s + 1 + Math.floor(rnd() * 4)];
    });
    assert.equal(reference(intervals), brute(intervals));
  }
});

test('reference does not mutate its input', () => {
  const input = [[5, 7], [1, 3]];
  reference(input);
  assert.deepEqual(input, [[5, 7], [1, 3]]);
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
  assert.equal(problem.parseCustomInput('[[2,2]]').ok, false);
  assert.equal(problem.parseCustomInput('[[3,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2,3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,50001]]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[[1,2],[2,3]]').args, [[[1, 2], [2, 3]]]);
});
