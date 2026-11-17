import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/merge-sorted/problem.js';

// Brute force: concatenate and sort.
const brute = (a, b) => [...a, ...b].sort((x, y) => x - y);

const input = (args) => `${JSON.stringify(args[0])}\n${JSON.stringify(args[1])}`;

test('reference matches concatenate-and-sort on 2000 random sorted pairs', () => {
  const rnd = mulberry32(31);
  const sorted = (n) => Array.from({ length: n }, () => Math.floor(rnd() * 21) - 10).sort((x, y) => x - y);
  for (let i = 0; i < 2000; i++) {
    const a = sorted(Math.floor(rnd() * 8));
    const b = sorted(a.length === 0 ? 1 + Math.floor(rnd() * 7) : Math.floor(rnd() * 8));
    assert.deepEqual(reference(a, b), brute(a, b));
  }
});

test('visible expectations agree; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length + t.args[1].length === 200000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(input(t.args)).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]\n[]').ok, false);
  assert.equal(problem.parseCustomInput('[2,1]\n[3]').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n[3,2]').ok, false);
  assert.equal(problem.parseCustomInput('[1]').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n[2000000000]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[1,3]\n[]').args, [[1, 3], []]);
});
