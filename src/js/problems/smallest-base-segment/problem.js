/**
 * Problem: Smallest Base Segment
 *
 * Given a non-empty string s, return the shortest string t such that
 * s == t repeated k times for some k >= 1.
 *
 * Every problem module exports the same shape (see docs/PROBLEM_FORMAT.md) so the
 * harness, the UI and the unit tests can stay problem-agnostic.
 */

import { mulberry32 } from '../../engine/rng.js';
import { charString } from '../../engine/growth-inputs.js';

/**
 * Reference O(n) solution via the KMP prefix function.
 * Kept in JS (not only as a string) so the unit tests and the hidden-test generator
 * use the exact same logic the "Reveal Solution" button shows.
 * @param {string} s
 * @returns {string}
 */
export function reference(s) {
  const n = s.length;
  const pi = new Int32Array(n);
  for (let i = 1; i < n; i++) {
    let k = pi[i - 1];
    while (k > 0 && s[i] !== s[k]) k = pi[k - 1];
    if (s[i] === s[k]) k++;
    pi[i] = k;
  }
  const period = n - pi[n - 1];
  // The smallest period only builds s by whole copies if it divides n.
  // "ababa" has period 2, but 5 % 2 != 0, so the answer is the whole string.
  return n % period === 0 ? s.slice(0, period) : s;
}

/** Deterministic generators: hidden tests must be identical on every run, or results flake. */
function repeatRandom(seed, baseLen, copies, alphabet = 'abc') {
  const rnd = mulberry32(seed);
  let base = '';
  for (let i = 0; i < baseLen; i++) base += alphabet[Math.floor(rnd() * alphabet.length)];
  return base.repeat(copies);
}

const visible = [
  { args: ['abcabcabc'], expected: 'abc', note: 'Three clean copies.' },
  { args: ['aaaa'], expected: 'a', note: 'Single-character base.' },
  { args: ['ababa'], expected: 'ababa', note: 'Has a period (2) that does not divide n.' },
  { args: ['abcd'], expected: 'abcd', note: 'No repetition at all.' },
  { args: ['abaaba'], expected: 'aba', note: 'Base itself contains repeats.' },
];

// Hidden tests target the classic wrong answers: off-by-one on n=1, period that
// does not divide n, near-miss last character, and inputs big enough to expose O(n^2).
const hiddenInputs = [
  'z',
  'zz',
  'abababab',
  'abcabcabd',
  'aabaabaab',
  repeatRandom(7, 5, 2000),
  repeatRandom(11, 1, 100000),
  repeatRandom(13, 333, 300),
  repeatRandom(17, 49999, 2),
  repeatRandom(19, 4, 25000).slice(0, -1) + 'x',
];

export const problem = {
  id: 'smallest-base-segment',
  title: 'Smallest Base Segment',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['String Periodicity', 'KMP Prefix Function'],
  timeLimitMs: 4000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a non-empty string <code>s</code>. A <strong>base segment</strong> of
    <code>s</code> is a string <code>t</code> such that <code>s</code> equals <code>t</code>
    concatenated with itself <code>k</code> times, for some integer <code>k &ge; 1</code>.</p>
    <p>Return the <strong>shortest</strong> base segment of <code>s</code>.</p>
    <p>Note that every string is a base segment of itself (<code>k = 1</code>), so an answer always exists.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of lowercase English letters only',
    'Target complexity: O(n) time, O(n) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If t is a base segment of length L, what must be true about n and L?',
    'Compare s with itself shifted by L characters. What does it mean if s[i] == s[i + L] for every valid i?',
    'Is there a classic string algorithm that tells you, for every prefix, the longest proper prefix that is also a suffix?',
    'With the prefix function pi, the smallest period is n - pi[n-1]. When does that period actually tile the whole string?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'smallestBaseSegment',
    params: [{ name: 's', type: 'string' }],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((s) => ({ args: [s], expected: reference(s) })),

  /**
   * Turns the raw "Custom Input" textarea into args.
   * Accepts a JSON string literal ("abab") or bare text (abab) because users type both.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!text) return { ok: false, error: 'Custom input is empty.' };
    let s = text;
    if (text.startsWith('"')) {
      try {
        s = JSON.parse(text);
      } catch {
        return { ok: false, error: 'Invalid JSON string literal.' };
      }
    }
    if (typeof s !== 'string' || s.length === 0) return { ok: false, error: 's must be a non-empty string.' };
    if (s.length > 100000) return { ok: false, error: 's.length must be <= 10^5.' };
    if (!/^[a-z]+$/.test(s)) return { ok: false, error: 's must contain lowercase English letters only.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). A random 7-letter base
  // repeated to length n: the string is built from whole copies, so the answer is the base and the
  // prefix function runs the full length with long borders (a "contains the base" shortcut finds
  // nothing early).
  growth: {
    target: 'n',
    n: 's.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000, 2048000],
    input: (n, seed) => {
      const base = charString(7, mulberry32(seed));
      return [base.repeat(Math.floor(n / 7))];
    },
  },
};

export default problem;
