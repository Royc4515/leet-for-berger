import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/mirror-bits/problem.js';

// Brute force: pad to 32 binary digits, reverse the string, parse it back. No bitwise operators.
const brute = (n) => parseInt(n.toString(2).padStart(32, '0').split('').reverse().join(''), 2);

test('reference matches brute force on 5000 random values across the 32-bit range', () => {
  const rnd = mulberry32(190);
  for (let k = 0; k < 5000; k++) {
    const n = Math.floor(rnd() * 4294967296);
    assert.equal(reference(n), brute(n), String(n));
  }
  for (let b = 0; b < 32; b++) assert.equal(reference(2 ** b), 2 ** (31 - b));
  // Mirroring twice gives the input back.
  for (let k = 0; k < 500; k++) {
    const n = Math.floor(rnd() * 4294967296);
    assert.equal(reference(reference(n)), n);
  }
});

test('5 visible and 10 hidden cases, expectations agree, top-bit values are covered', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
    assert.equal(brute(t.args[0]), t.expected);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] >= 2 ** 31).length >= 3);
  assert.ok(problem.hiddenTests.filter((t) => t.expected >= 2 ** 31).length >= 3);
  assert.ok(problem.hiddenTests.some((t) => t.args[0] === 4294967295 && t.expected === 4294967295));
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Reverses only the significant bits: trailing zeros of the input are lost.
  const significantOnly = (n) => parseInt(n.toString(2).split('').reverse().join(''), 2);
  // Builds the answer with `<<`, which goes negative once the top bit is set.
  const signedShift = (n) => {
    let rest = n >>> 0;
    let out = 0;
    for (let i = 0; i < 32; i++) {
      out = (out << 1) | (rest & 1);
      rest >>>= 1;
    }
    return out;
  };
  // Stops when the input runs out instead of running 32 rounds.
  const stopsEarly = (n) => {
    let out = 0;
    for (let rest = n; rest > 0; rest = Math.floor(rest / 2)) out = out * 2 + (rest % 2);
    return out;
  };
  for (const [name, wrong] of [['significant bits only', significantOnly], ['signed shift', signedShift], ['stops early', stopsEarly]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('-1').ok, false);
  assert.equal(problem.parseCustomInput('4294967296').ok, false);
  assert.equal(problem.parseCustomInput('1.5').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
  assert.deepEqual(problem.parseCustomInput(' 4294967295 '), { ok: true, args: [4294967295] });
  assert.equal(problem.solveReference([43261596]), 964176192);
});
