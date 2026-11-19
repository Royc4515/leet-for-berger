import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/palindrome-joins/problem.js';

const isPalindrome = (s) => s === [...s].reverse().join('');

// Brute force: every ordered pair, joined and checked. Independent of the split-and-lookup idea.
function brute(words) {
  const out = [];
  for (let i = 0; i < words.length; i++) {
    for (let j = 0; j < words.length; j++) if (i !== j && isPalindrome(words[i] + words[j])) out.push([i, j]);
  }
  return out;
}

/** Distinct short words over a tiny alphabet, sometimes with the empty word: many matches. */
function randomWords(rnd) {
  const n = 1 + Math.floor(rnd() * 12);
  const letters = 1 + Math.floor(rnd() * 3);
  const seen = new Set();
  for (let tries = 0; seen.size < n && tries < 200; tries++) {
    const len = Math.floor(rnd() * 6);
    let w = '';
    for (let i = 0; i < len; i++) w += String.fromCharCode(97 + Math.floor(rnd() * letters));
    seen.add(w);
  }
  return [...seen];
}

/**
 * The split solution with switches for its classic mistakes, so each can be shown to fail a case.
 * @param {{ firstCut?: number, secondCutFromZero?: boolean, allowSelf?: boolean, sorted?: boolean, equalOnly?: boolean }} opts
 */
function variant(opts) {
  const { firstCut = 0, secondCutFromZero = false, allowSelf = false, sorted = true, equalOnly = false } = opts;
  const rev = (s) => [...s].reverse().join('');
  return (words) => {
    const index = new Map(words.map((w, i) => [w, i]));
    const out = [];
    words.forEach((w, i) => {
      if (equalOnly) {
        const k = index.get(rev(w));
        if (k !== undefined && (allowSelf || k !== i)) out.push([i, k]);
        return;
      }
      for (let cut = firstCut; cut <= w.length; cut++) {
        const a = w.slice(0, cut);
        const b = w.slice(cut);
        const ra = index.get(rev(a));
        if (ra !== undefined && (allowSelf || ra !== i) && isPalindrome(b)) out.push([i, ra]);
        const rb = index.get(rev(b));
        if ((cut > 0 || secondCutFromZero) && rb !== undefined && (allowSelf || rb !== i) && isPalindrome(a)) out.push([rb, i]);
      }
    });
    return sorted ? out.sort((x, y) => x[0] - y[0] || x[1] - y[1]) : out;
  };
}

test('reference matches brute force on 3000 random word lists', () => {
  const rnd = mulberry32(336);
  for (let i = 0; i < 3000; i++) {
    const words = randomWords(rnd);
    assert.deepEqual(reference(words), brute(words), JSON.stringify(words));
  }
});

test('visible expectations agree; 15 valid cases; at least 2 at the maximum size', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 10000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.args[0].length === 10000 && t.args[0].every((w) => w.length === 50)));
});

test('hidden tests at the larger sizes agree with brute force', () => {
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 2000)) assert.deepEqual(t.expected, brute(t.args[0]));
});

test('the 15 cases catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  const wrongs = {
    'no split at position 0 (misses the empty word on the right)': variant({ firstCut: 1 }),
    'second check also at position 0 (mirror pairs twice)': variant({ secondCutFromZero: true }),
    'a palindrome joined with itself': variant({ allowSelf: true }),
    'only equal-length partners': variant({ equalOnly: true }),
    'output not sorted': variant({ sorted: false }),
  };
  for (const [why, fn] of Object.entries(wrongs)) {
    assert.ok(suite.some((t) => JSON.stringify(fn(...t.args)) !== JSON.stringify(t.expected)), why);
  }
});

test('custom input parser enforces the constraints', () => {
  assert.deepEqual(problem.parseCustomInput('["bat","tab","cat"]').args, [['bat', 'tab', 'cat']]);
  assert.equal(problem.parseCustomInput('["a",""]').ok, true);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('["a","a"]').ok, false);
  assert.equal(problem.parseCustomInput('["Ab"]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(['a'.repeat(51)])).ok, false);
  assert.equal(problem.parseCustomInput('[1]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
