import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/keypad-words/problem.js';

const KEYS = ['', '', 'abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz'];

// Brute force: every lowercase string of the right length is a candidate (26^n, so n <= 3),
// kept when each letter belongs to its digit's key; the sort fixes the order independently.
function brute(digits) {
  if (!digits.length) return [];
  let all = [''];
  for (let i = 0; i < digits.length; i++) all = all.flatMap((s) => [...'abcdefghijklmnopqrstuvwxyz'].map((c) => s + c));
  return all.filter((s) => [...s].every((c, i) => KEYS[+digits[i]].includes(c))).sort();
}

test('reference matches brute force on 1000 random digit strings', () => {
  const rnd = mulberry32(59);
  for (let t = 0; t < 1000; t++) {
    const len = Math.floor(rnd() * 4);
    let digits = '';
    for (let i = 0; i < len; i++) digits += String(2 + Math.floor(rnd() * 8));
    assert.deepEqual(reference(digits), brute(digits), digits);
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 8).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected.length === 65536));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('"21"').ok, false);
  assert.equal(problem.parseCustomInput('"2a"').ok, false);
  assert.equal(problem.parseCustomInput('"222222222"').ok, false);
  assert.equal(problem.parseCustomInput('23').ok, false);
  assert.deepEqual(problem.parseCustomInput('""').args, ['']);
  assert.deepEqual(problem.parseCustomInput('"79"').args, ['79']);
});
