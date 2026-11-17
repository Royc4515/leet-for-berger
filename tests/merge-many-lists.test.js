import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/merge-many-lists/problem.js';

// Brute force: concatenate everything and sort. Independent of the reference's pairwise merging.
const brute = (lists) => lists.flat().sort((x, y) => x - y);

test('reference matches brute force on 3000 random inputs', () => {
  const rnd = mulberry32(73);
  for (let t = 0; t < 3000; t++) {
    const k = Math.floor(rnd() * 7);
    const lists = Array.from({ length: k }, () => Array.from({ length: Math.floor(rnd() * 5) }, () => Math.floor(rnd() * 11) - 5).sort((x, y) => x - y));
    assert.deepEqual(reference(lists), brute(lists), JSON.stringify(lists));
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  const total = (t) => t.args[0].reduce((s, l) => s + l.length, 0);
  // Many lists with many nodes in total: merging one list at a time costs about k * N.
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 10000 && total(t) >= 90000);
  assert.ok(big.length >= 2);
  assert.ok(problem.hiddenTests.some((t) => total(t) === 200000 && t.args[0].length === 2));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[[1,4,5],[]]').args, [[[1, 4, 5], []]]);
  assert.equal(problem.parseCustomInput('[]').ok, true);
  assert.equal(problem.parseCustomInput('[[3,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[10001]]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[[1.5]]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(10001).fill([]))).ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify([Array(200001).fill(0)])).ok, false);
});
