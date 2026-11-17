import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/isomorphic-strings/problem.js';

// Brute force: two strings are isomorphic iff their "first occurrence index" patterns match.
const pattern = (s) => [...s].map((c) => s.indexOf(c)).join(',');
const brute = (s, t) => s.length === t.length && pattern(s) === pattern(t);

test('reference matches brute force on 3000 random pairs', () => {
  const rnd = mulberry32(5);
  for (let i = 0; i < 3000; i++) {
    const len = 1 + Math.floor(rnd() * 8);
    const s = Array.from({ length: len }, () => 'abc'[Math.floor(rnd() * 3)]).join('');
    const t = Array.from({ length: len }, () => 'xyz'[Math.floor(rnd() * 3)]).join('');
    assert.equal(reference(s, t), brute(s, t), `${s} ${t}`);
  }
});

test('visible expectations agree; hidden tests mix true and false; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const outcomes = new Set(problem.hiddenTests.map((t) => t.expected));
  assert.deepEqual([...outcomes].sort(), [false, true]);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('"ab"\n"abc"').ok, false);
  assert.equal(problem.parseCustomInput('"ab"').ok, false);
  assert.equal(problem.parseCustomInput('"é"\n"a"').ok, false);
});
