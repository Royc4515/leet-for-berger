import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/squeeze-runs/problem.js';

// Brute force: a regular expression that matches each run and rewrites it.
const brute = (s) => s.replace(/(.)\1*/g, (run, c) => (run.length > 1 ? c + run.length : c));

test('reference matches a regex rewrite on 3000 random strings', () => {
  const rnd = mulberry32(91);
  const alphabet = 'abA09';
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 40);
    let s = '';
    for (let k = 0; k < n; k++) s += alphabet[Math.floor(rnd() * (1 + (i % 5)))];
    assert.equal(reference(s), brute(s), s);
  }
  // Long runs (counts with 2 and 3 digits) too.
  for (const len of [9, 10, 11, 99, 100, 101, 1000]) assert.equal(reference('q'.repeat(len)), `q${len}`);
});

test('5 visible and 10 hidden cases, expectations agree, max-size cases, valid input', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.ok(t.expected.length <= t.args[0].length, 'the result is never longer than the input');
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected === 'a100000'), 'a five-digit count');
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Writes the count after every run, including runs of length 1.
  const alwaysCount = (s) => s.replace(/(.)\1*/g, (run, c) => c + run.length);
  // Writes the count as a single character: the last digit only.
  const lastDigit = (s) => s.replace(/(.)\1*/g, (run, c) => (run.length > 1 ? c + (run.length % 10) : c));
  // Forgets to flush the final run.
  const dropsLastRun = (s) => {
    let out = '';
    let i = 0;
    while (i < s.length) {
      let j = i;
      while (j < s.length && s[j] === s[i]) j++;
      if (j < s.length) out += s[i] + (j - i > 1 ? String(j - i) : '');
      i = j;
    }
    return out;
  };
  // Counts each character across the whole string instead of per run.
  const globalCount = (s) => {
    const count = new Map();
    for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
    return [...count].map(([c, k]) => (k > 1 ? c + k : c)).join('');
  };
  // Caps a run at 9 and starts a new block (the sibling problem's rule).
  const capNine = (s) => s.replace(/(.)\1*/g, (run, c) => {
    let out = '';
    for (let left = run.length; left > 0; left -= 9) out += c + (Math.min(left, 9) > 1 ? Math.min(left, 9) : '');
    return out;
  });
  for (const [name, wrong] of [
    ['always count', alwaysCount],
    ['last digit only', lastDigit],
    ['drops last run', dropsLastRun],
    ['global count', globalCount],
    ['cap at 9', capNine],
  ]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"aabcccccaaa"'), { ok: true, args: ['aabcccccaaa'] });
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"a b"').ok, false);
  assert.equal(problem.parseCustomInput('"a-b"').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify('a'.repeat(100001))).ok, false);
  assert.equal(problem.parseCustomInput('aab').ok, false);
  assert.equal(problem.parseCustomInput('5').ok, false);
  assert.equal(problem.solveReference(['aaab']), 'a3b');
});
