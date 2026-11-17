import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference, toRoman } from '../src/js/problems/roman-numeral-value/problem.js';

// Brute force: try every value and pick the one whose standard numeral equals s. Independent of
// the subtraction rule, it only relies on the greedy writer.
const ALL = Array.from({ length: 3999 }, (_, i) => toRoman(i + 1));
const brute = (s) => ALL.indexOf(s) + 1;

test('greedy writer produces the textbook numerals', () => {
  assert.equal(toRoman(1994), 'MCMXCIV');
  assert.equal(toRoman(3999), 'MMMCMXCIX');
  assert.equal(toRoman(3888), 'MMMDCCCLXXXVIII');
  assert.equal(toRoman(444), 'CDXLIV');
});

test('reference matches lookup for every value 1..3999 and 2000 random draws', () => {
  for (let n = 1; n <= 3999; n++) assert.equal(reference(ALL[n - 1]), n);
  const rnd = mulberry32(32);
  for (let i = 0; i < 2000; i++) {
    const s = ALL[Math.floor(rnd() * 3999)];
    assert.equal(reference(s), brute(s), s);
  }
});

test('visible expectations agree; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true, t.args[0]);
    assert.equal(t.expected, brute(t.args[0]));
  }
  assert.ok(problem.hiddenTests.some((t) => t.args[0].length === 15));
});

test('custom input parser accepts every standard numeral and rejects others', () => {
  for (const s of ALL) assert.equal(problem.parseCustomInput(JSON.stringify(s)).ok, true, s);
  for (const bad of ['""', '"IIII"', '"IC"', '"VX"', '"MMMM"', '"xiv"', 'XIV', '"IIV"', '"ABC"']) {
    assert.equal(problem.parseCustomInput(bad).ok, false, bad);
  }
});
