import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/dotted-quads/problem.js';

const validPart = (p) => String(Number(p)) === p && Number(p) <= 255;

// Brute force: put the three dots at every triple of gaps, keep the splits whose parts are all
// canonical decimal numbers up to 255 (a number that prints back as itself has no leading
// zero), then sort. No search, no pruning, and the order comes from the sort.
function brute(s) {
  const out = [];
  const n = s.length;
  for (let a = 1; a < n; a++)
    for (let b = a + 1; b < n; b++)
      for (let c = b + 1; c < n; c++) {
        const parts = [s.slice(0, a), s.slice(a, b), s.slice(b, c), s.slice(c)];
        if (parts.every(validPart)) out.push(parts.join('.'));
      }
  return out.sort();
}

/** A random digit string; digits come from a small alphabet so zeros and 255s are common. */
function randomDigits(rnd) {
  const alphabets = ['0', '01', '012', '0125', '25', '0123456789', '1', '05'];
  const alphabet = alphabets[Math.floor(rnd() * alphabets.length)];
  const len = Math.floor(rnd() * 15);
  let s = '';
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(rnd() * alphabet.length)];
  return s || '0';
}

test('reference matches brute force on 3000 random digit strings, both empty and non-empty answers', () => {
  const rnd = mulberry32(93);
  let empty = 0;
  for (let i = 0; i < 3000; i++) {
    const s = randomDigits(rnd);
    const want = brute(s);
    if (!want.length) empty++;
    assert.deepEqual(reference(s), want, s);
  }
  assert.ok(empty > 300 && empty < 2700, `${empty} empty answers`);
});

test('5 visible and 10 hidden cases, visible expectations agree, max-size inputs', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.deepEqual(brute(...t.args), t.expected, t.args[0]);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 20).length >= 2);
  // The hidden set holds empty answers, a single answer and a list of 10 or more answers.
  assert.ok(problem.hiddenTests.some((t) => t.expected.length === 0));
  assert.ok(problem.hiddenTests.some((t) => t.expected.length === 2));
  assert.ok(problem.hiddenTests.some((t) => t.expected.length >= 10));
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Variant of the brute force with a pluggable rule for what a valid part is.
  const withRule = (rule) => (s) => {
    const out = [];
    const n = s.length;
    for (let a = 1; a < n; a++)
      for (let b = a + 1; b < n; b++)
        for (let c = b + 1; c < n; c++) {
          const parts = [s.slice(0, a), s.slice(a, b), s.slice(b, c), s.slice(c)];
          if (parts.every(rule)) out.push(parts.join('.'));
        }
    return out.sort();
  };
  const leadingZerosAllowed = withRule((p) => p.length <= 3 && Number(p) <= 255);
  const noUpperBound = withRule((p) => p.length <= 3 && String(Number(p)) === p);
  const zeroForbidden = withRule((p) => validPart(p) && p !== '0');
  // Takes the dotted strings in the order a depth-first search that tries longer parts first finds them.
  const longestFirst = (s) => brute(s).reverse();
  for (const [name, wrong] of [['leading zeros', leadingZerosAllowed], ['no upper bound', noUpperBound], ['zero part rejected', zeroForbidden], ['longest part first', longestFirst]]) {
    assert.ok(all.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"1111"').args, ['1111']);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"12a4"').ok, false);
  assert.equal(problem.parseCustomInput('1111').ok, false);
  assert.equal(problem.parseCustomInput(`"${'1'.repeat(21)}"`).ok, false);
  assert.deepEqual(problem.solveReference(['0000']), ['0.0.0.0']);
});
