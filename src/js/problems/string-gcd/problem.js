/**
 * Problem: String GCD
 *
 * Find the longest string that both inputs are whole repetitions of. Trying every prefix works but
 * repeats a lot of comparisons; the clean insight is that a common divisor exists exactly when
 * a + b equals b + a, and then its length must be gcd(|a|, |b|).
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Greatest common divisor of two non-negative integers.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

/**
 * Reference: the concatenation test, then the prefix of length gcd(|str1|, |str2|).
 * @param {string} str1
 * @param {string} str2
 * @returns {string}
 */
export function reference(str1, str2) {
  if (str1 + str2 !== str2 + str1) return '';
  return str1.slice(0, gcd(str1.length, str2.length));
}

const MAX_LEN = 100000;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** A random uppercase string of length `len`. */
function randomWord(rnd, len) {
  return Array.from({ length: len }, () => LETTERS[Math.floor(rnd() * 26)]).join('');
}

/**
 * Two long repetitions of one random unit: str1 = unit^r1, str2 = unit^r2. With `breakLast`, the
 * last character of str2 is changed so no common divisor remains.
 */
function repeatedPair(seed, unitLen, r1, r2, breakLast = false) {
  const rnd = mulberry32(seed);
  const unit = randomWord(rnd, unitLen);
  const str1 = unit.repeat(r1);
  let str2 = unit.repeat(r2);
  if (breakLast) {
    const last = str2[str2.length - 1];
    str2 = str2.slice(0, -1) + (last === 'Z' ? 'A' : String.fromCharCode(last.charCodeAt(0) + 1));
  }
  return [str1, str2];
}

const visible = [
  { args: ['ABCABC', 'ABC'], expected: 'ABC', note: '"ABCABC" is "ABC" twice and "ABC" is itself once.' },
  { args: ['ABABAB', 'ABAB'], expected: 'AB', note: '"AB" divides both; "ABAB" does not divide "ABABAB".' },
  { args: ['LEET', 'CODE'], expected: '', note: 'No string divides both.' },
  { args: ['AAAA', 'AA'], expected: 'AA', note: '"A" divides both, but "AA" is longer and also does.' },
  { args: ['ABCDEF', 'ABC'], expected: '', note: '"ABC" is a prefix of "ABCDEF" but does not divide it.' },
];

// Hidden tests: one character each way, coprime lengths over one letter, the shorter string
// first, an answer longer than the smallest repeating unit, a prefix that matches until the very
// end, and 10^5-character inputs (one with a 6-letter unit, one broken at the last character, and
// gcd 1 over a single letter).
const hiddenArgs = [
  ['A', 'A'],
  ['A', 'B'],
  ['AAAAA', 'AAA'],
  ['ABAB', 'ABABAB'],
  ['ABABABAB', 'ABAB'],
  ['ABCABCABD', 'ABC'],
  repeatedPair(91, 6, 16000, 10000),
  repeatedPair(93, 5, 20000, 12000, true),
  ['Q'.repeat(MAX_LEN), 'Q'.repeat(MAX_LEN - 1)],
  repeatedPair(97, 7, 14285, 5000),
];

export const problem = {
  id: 'string-gcd',
  title: 'String GCD',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Math', 'String'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['str1', 'str2'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A string <code>x</code> <strong>divides</strong> a string <code>s</code> when
    <code>s</code> is <code>x</code> written one or more times in a row, so <code>"AB"</code>
    divides <code>"ABABAB"</code> but not <code>"ABA"</code>.</p>
    <p>Given two strings <code>str1</code> and <code>str2</code>, return the longest string that
    divides both of them. If no string divides both, return the empty string
    <code>""</code>.</p>
  `,
  constraints: [
    '1 <= str1.length, str2.length <= 10^5',
    'str1 and str2 contain only uppercase English letters',
    'Target complexity: O(m + n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `str1 = ${JSON.stringify(t.args[0])}, str2 = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If x divides both strings, what can you say about the length of x?',
    'Which candidate lengths are even worth checking?',
    'If both strings are repetitions of the same x, what do str1 + str2 and str2 + str1 look like?',
    'Once you know a common divisor exists, which one is the longest?',
  ],

  signature: {
    name: 'gcdOfStrings',
    params: [
      { name: 'str1', type: 'string' },
      { name: 'str2', type: 'string' },
    ],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, each a JSON string, for example "ABCABC" then "ABC".
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines, each a JSON string, for example "ABCABC" then "ABC".' };
    let strs;
    try {
      strs = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'Both lines must be JSON strings in double quotes.' };
    }
    for (const s of strs) {
      if (typeof s !== 'string' || !s.length || s.length > MAX_LEN) return { ok: false, error: 'Each string must have 1 to 10^5 characters.' };
      if (!/^[A-Z]+$/.test(s)) return { ok: false, error: 'Use uppercase English letters only.' };
    }
    return { ok: true, args: strs };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
