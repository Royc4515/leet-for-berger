import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/bit-count/problem.js';

// Brute force: count '1' characters in the base-2 string (no bitwise operators involved).
const brute = (n) => [...n.toString(2)].filter((c) => c === '1').length;

test('reference matches brute force on 5000 random values across the 32-bit range', () => {
  const rnd = mulberry32(25);
  for (let k = 0; k < 5000; k++) {
    const n = Math.floor(rnd() * 4294967296);
    assert.equal(reference(n), brute(n), String(n));
  }
  for (let b = 0; b < 32; b++) assert.equal(reference(2 ** b), 1);
});

test('visible expectations agree; tests are valid input; top-bit values are covered', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] >= 2 ** 31).length >= 3);
  assert.ok(problem.hiddenTests.some((t) => t.args[0] === 4294967295 && t.expected === 32));
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('-1').ok, false);
  assert.equal(problem.parseCustomInput('4294967296').ok, false);
  assert.equal(problem.parseCustomInput('1.5').ok, false);
  assert.equal(problem.parseCustomInput('abc').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
  assert.deepEqual(problem.parseCustomInput(' 4294967295 '), { ok: true, args: [4294967295] });
});
