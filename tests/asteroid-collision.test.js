import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/asteroid-collision/problem.js';

// Brute force: resolve the leftmost adjacent (right-mover, left-mover) pair until none is left.
// Any order of resolving collisions reaches the same final state, so this is independent of
// the stack argument.
function brute(input) {
  const row = [...input];
  for (;;) {
    const i = row.findIndex((v, k) => k + 1 < row.length && v > 0 && row[k + 1] < 0);
    if (i < 0) return row;
    const right = row[i];
    const left = -row[i + 1];
    if (right > left) row.splice(i + 1, 1);
    else if (right < left) row.splice(i, 1);
    else row.splice(i, 2);
  }
}

test('reference matches step-by-step resolution on 2000 random rows', () => {
  const rnd = mulberry32(71);
  for (let i = 0; i < 2000; i++) {
    const row = Array.from({ length: 2 + Math.floor(rnd() * 10) }, () => (1 + Math.floor(rnd() * 5)) * (rnd() < 0.5 ? 1 : -1));
    assert.deepEqual(reference(row), brute(row));
  }
});

test('visible expectations agree; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[5]').ok, false);
  assert.equal(problem.parseCustomInput('[5,0]').ok, false);
  assert.equal(problem.parseCustomInput('[5,1001]').ok, false);
  assert.equal(problem.parseCustomInput('5,-5').ok, false);
  assert.deepEqual(problem.parseCustomInput('[5,-5]').args, [[5, -5]]);
});
