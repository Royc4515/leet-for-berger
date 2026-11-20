import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/word-order-flip/problem.js';

// Brute force: collect words front to back with a state machine, then emit them last to first.
// Shares no scanning direction or helper with the reference.
function brute(s) {
  const words = [];
  let cur = '';
  for (const ch of s + ' ') {
    if (ch === ' ') {
      if (cur) words.push(cur);
      cur = '';
    } else cur += ch;
  }
  let out = '';
  for (let i = words.length - 1; i >= 0; i--) out += (out ? ' ' : '') + words[i];
  return out;
}

function randomText(rnd) {
  const len = 1 + Math.floor(rnd() * 30);
  const gap = rnd();
  const chars = Array.from({ length: len }, () => (rnd() < gap ? ' ' : 'abcXYZ019'[Math.floor(rnd() * 9)]));
  if (chars.every((c) => c === ' ')) chars[Math.floor(rnd() * len)] = 'z';
  return chars.join('');
}

test('reference matches brute force on 2000 random texts', () => {
  const rnd = mulberry32(151);
  for (let i = 0; i < 2000; i++) {
    const s = randomText(rnd);
    assert.equal(reference(s), brute(s), JSON.stringify(s));
  }
});

test('5 visible and 10 hidden cases, expectations agree, max-size inputs, valid input', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.equal(brute(t.args[0]), t.expected);
    assert.ok(!t.expected.startsWith(' ') && !t.expected.endsWith(' ') && !t.expected.includes('  '));
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Split at every single space: empty pieces survive and show up as extra spaces.
  const splitOnOneSpace = (s) => s.split(' ').reverse().join(' ');
  // Trims the ends but not the gaps between words.
  const trimOnly = (s) => s.trim().split(' ').reverse().join(' ');
  // Reverses all characters, which also reverses the inside of each word.
  const reverseChars = (s) => [...s].reverse().join('').trim().replace(/ +/g, ' ');
  for (const [name, wrong] of [['split on one space', splitOnOneSpace], ['trim only', trimOnly], ['reverse characters', reverseChars]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
  // The right idea with the standard library: split on runs of spaces.
  for (const t of all) assert.equal(t.args[0].split(/ +/).filter(Boolean).reverse().join(' '), t.expected);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"  hello world  "'), { ok: true, args: ['  hello world  '] });
  assert.equal(problem.parseCustomInput('"   "').ok, false);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"a,b"').ok, false);
  assert.equal(problem.parseCustomInput('hello world').ok, false);
  assert.equal(problem.parseCustomInput('5').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify('a'.repeat(100001))).ok, false);
  assert.equal(problem.solveReference(['a  b']), 'b a');
});
