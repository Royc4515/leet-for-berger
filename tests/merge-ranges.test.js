import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/merge-ranges/problem.js';

// Brute force: mark every covered point (and every gap between neighbours inside one range) on a
// small number line, then read the runs back. Independent of the reference's sort-and-sweep.
function brute(intervals) {
  const max = Math.max(...intervals.map((r) => r[1]));
  // Doubled coordinates: point x is cell 2x, the gap between x and x+1 is cell 2x+1, so [1,2] and
  // [3,4] stay apart while [1,3] and [3,4] join.
  const cells = Array(2 * max + 2).fill(false);
  for (const [s, e] of intervals) for (let c = 2 * s; c <= 2 * e; c++) cells[c] = true;
  const out = [];
  for (let c = 0; c < cells.length; c++) {
    if (!cells[c] || (c > 0 && cells[c - 1])) continue;
    let d = c;
    while (cells[d + 1]) d++;
    out.push([c / 2, d / 2]);
  }
  return out;
}

test('reference matches brute force on 2000 random inputs', () => {
  const rnd = mulberry32(7);
  const pick = (k) => Math.floor(rnd() * k);
  for (let t = 0; t < 2000; t++) {
    const intervals = Array.from({ length: 1 + pick(8) }, () => {
      const s = pick(20);
      return [s, s + pick(5)];
    });
    assert.deepEqual(reference(intervals), brute(intervals), JSON.stringify(intervals));
  }
});

test('reference does not mutate its input', () => {
  const input = [[4, 7], [1, 2], [2, 5]];
  reference(input);
  assert.deepEqual(input, [[4, 7], [1, 2], [2, 5]]);
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
  assert.equal(problem.parseCustomInput('[[3,2]]').ok, false);
  assert.equal(problem.parseCustomInput('[[-1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2,3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,1000000001]]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,0],[5,5]]').ok, true);
});
