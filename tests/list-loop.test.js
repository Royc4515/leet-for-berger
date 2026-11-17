import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { cycleListFrom } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/list-loop/problem.js';

// Brute force on real nodes, independent of pos: walk and remember every node seen.
function brute([values, pos]) {
  const seen = new Set();
  for (let n = cycleListFrom(values, pos); n; n = n.next) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}

test('reference matches brute force on 2000 random lists', () => {
  const rnd = mulberry32(41);
  for (let i = 0; i < 2000; i++) {
    const n = Math.floor(rnd() * 12);
    const values = Array.from({ length: n }, () => Math.floor(rnd() * 5) - 2);
    const pos = n && rnd() < 0.6 ? Math.floor(rnd() * n) : -1;
    assert.equal(reference([values, pos]), brute([values, pos]));
  }
});

test('visible expectations agree with the reference; 5 visible, 10 hidden, 2+ at max size', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests) assert.equal(brute(t.args[0]), t.expected);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0][0].length >= 99999).length >= 2);
  // Both answers must be common, or always returning one of them scores well.
  const loops = problem.hiddenTests.filter((t) => t.expected).length;
  assert.ok(loops >= 4 && loops <= 6);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[3,2,0,-4]\n1'), { ok: true, args: [[[3, 2, 0, -4], 1]] });
  assert.deepEqual(problem.parseCustomInput('[]\n-1'), { ok: true, args: [[[], -1]] });
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n2').ok, false);
  assert.equal(problem.parseCustomInput('[]\n0').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]\n-1').ok, false);
  assert.equal(problem.parseCustomInput('[100001]\n-1').ok, false);
  assert.equal(problem.parseCustomInput('nope\n-1').ok, false);
});
