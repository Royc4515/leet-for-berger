import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/dna-repeats/problem.js';

// Brute force: compare every pair of windows; keep the ones that match some other window.
function brute(s) {
  const found = new Set();
  for (let i = 0; i + 10 <= s.length; i++) {
    for (let j = i + 1; j + 10 <= s.length; j++) {
      if (s.slice(i, i + 10) === s.slice(j, j + 10)) found.add(s.slice(i, i + 10));
    }
  }
  return [...found].sort();
}

test('reference matches brute force on 1500 random small strings', () => {
  const rnd = mulberry32(28);
  for (let k = 0; k < 1500; k++) {
    const n = Math.floor(rnd() * 40) + 1;
    // Small alphabets make repeats likely.
    const letters = 'ACGT'.slice(0, 1 + Math.floor(rnd() * 4));
    const s = Array.from({ length: n }, () => letters[Math.floor(rnd() * letters.length)]).join('');
    assert.deepEqual(reference(s), brute(s), s);
  }
});

test('visible expectations agree; output is sorted; max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(t.args[0]).ok, true);
    assert.deepEqual(t.expected, [...t.expected].sort());
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  // The two-letter case repeats every one of its 2^10 windows.
  assert.ok(problem.hiddenTests.some((t) => t.expected.length === 1024));
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('ACGT'), { ok: true, args: ['ACGT'] });
  assert.deepEqual(problem.parseCustomInput('"AAAAAAAAAAA"'), { ok: true, args: ['AAAAAAAAAAA'] });
  assert.equal(problem.parseCustomInput('acgt').ok, false);
  assert.equal(problem.parseCustomInput('ACGU').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
  assert.equal(problem.parseCustomInput('A'.repeat(100001)).ok, false);
});
