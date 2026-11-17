import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/digit-palindrome/problem.js';

// Brute force: compare the decimal string with its reverse (the statement forbids this for
// users, which is exactly why it is an independent check).
const brute = (x) => String(x) === [...String(x)].reverse().join('');

test('reference matches string reversal on 5000 random 32-bit integers', () => {
  const rnd = mulberry32(21);
  for (let i = 0; i < 5000; i++) {
    // Mix small values (many palindromes) with full-range ones.
    const x = i % 2 ? Math.floor(rnd() * 20001) - 10000 : Math.floor(rnd() * 2 ** 32) - 2 ** 31;
    assert.equal(reference(x), brute(x), String(x));
  }
  for (let x = -50; x <= 100000; x++) assert.equal(reference(x), brute(x), String(x));
});

test('visible expectations agree; hidden tests mix true and false; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const outcomes = new Set(problem.hiddenTests.map((t) => t.expected));
  assert.deepEqual([...outcomes].sort(), [false, true]);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
    assert.equal(reference(...t.args), brute(t.args[0]));
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput(' -121 \n'), { ok: true, args: [-121] });
  assert.equal(problem.parseCustomInput('2147483648').ok, false);
  assert.equal(problem.parseCustomInput('-2147483649').ok, false);
  assert.equal(problem.parseCustomInput('1.5').ok, false);
  assert.equal(problem.parseCustomInput('"121"').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
});
