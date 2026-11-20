import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/crack-palindrome/problem.js';

const isPal = (v) => v === [...v].reverse().join('');

// Brute force: every (position, letter) replacement that differs from the original and is not a
// palindrome; the smallest wins, or "" when there is none.
function brute(p) {
  let best = null;
  for (let i = 0; i < p.length; i++) {
    for (const c of 'abcdefghijklmnopqrstuvwxyz') {
      if (c === p[i]) continue;
      const cand = p.slice(0, i) + c + p.slice(i + 1);
      if (!isPal(cand) && (best === null || cand < best)) best = cand;
    }
  }
  return best ?? '';
}

test('reference matches brute force on 2000 random palindromes, even and odd, small alphabets', () => {
  const rnd = mulberry32(111);
  for (let i = 0; i < 2000; i++) {
    const half = Math.floor(rnd() * 6);
    const alpha = 'abcz'.slice(0, 1 + Math.floor(rnd() * 4));
    const left = Array.from({ length: half }, () => alpha[Math.floor(rnd() * alpha.length)]);
    const mid = rnd() < 0.5 || half === 0 ? alpha[Math.floor(rnd() * alpha.length)] : '';
    const p = left.join('') + mid + [...left].reverse().join('');
    assert.ok(isPal(p));
    assert.equal(reference(p), brute(p), p);
  }
});

test('5 visible and 10 hidden cases, expectations agree, max-size cases, valid input', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.ok(isPal(t.args[0]), 'every input is a palindrome');
    assert.equal(reference(...t.args), t.expected);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    if (t.expected !== '') assert.ok(!isPal(t.expected));
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests].filter((x) => x.args[0].length <= 12)) {
    assert.equal(brute(...t.args), t.expected);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 99999).length >= 2);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Scans the whole string, so the middle letter of an odd palindrome gets lowered ("aba" -> "aaa").
  const wholeScan = (p) => {
    if (p.length < 2) return '';
    for (let i = 0; i < p.length; i++) if (p[i] !== 'a') return `${p.slice(0, i)}a${p.slice(i + 1)}`;
    return `${p.slice(0, -1)}b`;
  };
  // Always raises the last character to 'b' (or 'a' when it is already 'b').
  const lastOnly = (p) => (p.length < 2 ? '' : `${p.slice(0, -1)}${p.at(-1) === 'b' ? 'a' : 'b'}`);
  // Never falls back: returns "" when the first half is all 'a'.
  const noFallback = (p) => {
    for (let i = 0; i < Math.floor(p.length / 2); i++) if (p[i] !== 'a') return `${p.slice(0, i)}a${p.slice(i + 1)}`;
    return '';
  };
  // Changes the first character to 'a' only when it is not already 'a'; otherwise raises the last one.
  const firstOnly = (p) => {
    if (p.length < 2) return '';
    return p[0] !== 'a' ? `a${p.slice(1)}` : `${p.slice(0, -1)}b`;
  };
  // Changes the first non-'a' to 'b' by mistake (not the smallest letter).
  const wrongLetter = (p) => {
    if (p.length < 2) return '';
    for (let i = 0; i < Math.floor(p.length / 2); i++) if (p[i] !== 'a') return `${p.slice(0, i)}${p[i] === 'b' ? 'a' : 'b'}${p.slice(i + 1)}`;
    return `${p.slice(0, -1)}b`;
  };
  for (const [name, wrong] of [['whole scan', wholeScan], ['last only', lastOnly], ['no fallback', noFallback], ['first only', firstOnly], ['wrong letter', wrongLetter]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"abccba"'), { ok: true, args: ['abccba'] });
  assert.equal(problem.parseCustomInput('"abc"').ok, false);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"Aa"').ok, false);
  assert.equal(problem.parseCustomInput('"a1a"').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify('a'.repeat(100001))).ok, false);
  assert.equal(problem.parseCustomInput('abccba').ok, false);
  assert.equal(problem.solveReference(['aba']), 'abb');
});
