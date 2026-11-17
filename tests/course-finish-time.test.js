import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/course-finish-time/problem.js';

// Brute force: straight from the definition, the finish of a course is its time plus the
// latest finish among its prerequisites, recomputed recursively without memoisation.
function brute(n, relations, time) {
  const finish = (v) => {
    let start = 0;
    for (const [a, b] of relations) if (b === v) start = Math.max(start, finish(a));
    return start + time[v - 1];
  };
  let best = 0;
  for (let v = 1; v <= n; v++) best = Math.max(best, finish(v));
  return best;
}

const asInput = (args) => [args[0], JSON.stringify(args[1]), JSON.stringify(args[2])].join('\n');

test('reference matches brute force on 2000 random DAGs', () => {
  const rnd = mulberry32(1205);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 7);
    // Relations only go from a smaller to a larger position in a random order: no cycles.
    const order = Array.from({ length: n }, (_, j) => j + 1);
    for (let a = n - 1; a > 0; a--) {
      const b = Math.floor(rnd() * (a + 1));
      [order[a], order[b]] = [order[b], order[a]];
    }
    const relations = [];
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (rnd() < 0.35) relations.push([order[a], order[b]]);
    const time = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 10));
    assert.equal(reference(n, relations, time), brute(n, relations, time));
  }
});

test('visible expectations agree; three 5 * 10^4-course cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] === 50000).length >= 3);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(asInput(t.args)).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('2\n[[1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[1,2],[2,1]]\n[1,1]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[1,2],[1,2]]\n[1,1]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[1,3]]\n[1,1]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[1,1]]\n[1,1]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[]\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[]\n[0,1]').ok, false);
  assert.deepEqual(problem.parseCustomInput('2\n[[2,1]]\n[3,4]').args, [2, [[2, 1]], [3, 4]]);
});
