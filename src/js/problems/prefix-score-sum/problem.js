/**
 * Problem: Prefix Score Sum
 *
 * Sum, over every suffix of s, of the length of its longest common prefix with s. That is
 * exactly the sum of the Z-array (with z[0] = n). Measuring each suffix by direct comparison is
 * O(n^2) on strings like "aaaa...a"; the Z-function reuses the rightmost match window [l, r) so
 * every character is compared a constant number of times, O(n).
 *
 * For n = 10^5 the sum reaches n(n + 1) / 2, about 5 * 10^9, which needs 64 bits.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: the Z-function, then n plus the sum of z[1..n-1].
 * @param {string} s
 * @returns {number}
 */
export function reference(s) {
  const n = s.length;
  const z = new Int32Array(n);
  let total = n;
  let l = 0;
  let r = 0; // the match window is s[l, r): the furthest-reaching match found so far
  for (let i = 1; i < n; i++) {
    let k = i < r ? Math.min(r - i, z[i - l]) : 0;
    while (i + k < n && s[k] === s[i + k]) k++;
    z[i] = k;
    if (i + k > r) {
      l = i;
      r = i + k;
    }
    total += k;
  }
  return total;
}

const MAX_N = 100000;
const VALID = /^[a-z]+$/;

/** n seeded letters drawn from the first k lowercase letters. */
function randomString(seed, n, k) {
  const rnd = mulberry32(seed);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = String.fromCharCode(97 + Math.floor(rnd() * k));
  return out.join('');
}

/** A seeded block of `period` letters (from the first k) repeated to length n. */
function periodic(seed, n, period, k) {
  return randomString(seed, period, k).repeat(Math.ceil(n / period)).slice(0, n);
}

const visible = [
  { args: ['babab'], expected: 9, note: 'Suffix scores: "babab" 5, "abab" 0, "bab" 3, "ab" 0, "b" 1. Total 9.' },
  { args: ['azbazbzaz'], expected: 14, note: 'Scores 9, 0, 0, 3, 0, 0, 0, 2, 0 add up to 14: "azbzaz" shares "azb" with s.' },
  { args: ['a'], expected: 1, note: 'The only suffix is the whole string.' },
  { args: ['aaaa'], expected: 10, note: 'Every suffix is a prefix: 4 + 3 + 2 + 1.' },
  { args: ['abcd'], expected: 4, note: 'Only the full string shares its first letter with s.' },
];

// Hidden tests: a mismatch in the last letter, nested borders, then 10^5-letter strings: one letter
// repeated (total about 5 * 10^9, past 32 bits, and quadratic for direct comparison), one letter
// with a different last letter, short and long periods, and random text over 2 and 26 letters.
const hiddenArgs = [
  ['aaaab'],
  ['abacabadabacaba'],
  ['zz'],
  ['a'.repeat(MAX_N)],
  [`${'a'.repeat(MAX_N - 1)}b`],
  [periodic(73, MAX_N, 7, 3)],
  [periodic(79, MAX_N, 999, 2)],
  [randomString(83, MAX_N, 2)],
  [randomString(89, MAX_N, 26)],
  [`${'ab'.repeat(MAX_N / 4)}${'a'.repeat(MAX_N / 2)}`],
];

export const problem = {
  id: 'prefix-score-sum',
  title: 'Prefix Score Sum',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['String Matching', 'Z-function'],
  milestone: 2,
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a string <code>s</code> of length <code>n</code>, look at each of its suffixes
    <code>s[i..n-1]</code> for <code>i = 0, 1, ..., n - 1</code>. The <em>score</em> of a
    suffix is the length of the longest common prefix of that suffix and the whole string
    <code>s</code>.</p>
    <p>Return the sum of the scores of all <code>n</code> suffixes, as a 64-bit integer.</p>
    <p>For example, for <code>s = "babab"</code> the suffix <code>"bab"</code> scores 3 because
    <code>"bab"</code> is also how <code>s</code> starts, while <code>"abab"</code> scores 0.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of lowercase English letters',
    'The answer can reach about 5 * 10^9: use a 64-bit integer',
    'Target complexity: O(n) time; O(n^2) times out',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How long does comparing every suffix with s take when s is a single letter repeated?',
    'Suppose you already know that s[l..r) equals s[0..r-l). For a position i inside that window, which earlier position looks the same?',
    'How much of the answer at i can you copy from that earlier position, and when do you still have to compare characters?',
    'Why does the right end of the window only ever move to the right, and what does that say about the total work?',
    'What is the largest possible total for n = 10^5, and which type can hold it?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'prefixScoreSum',
    params: [{ name: 's', type: 'string' }],
    returns: 'long',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: s on one line, with or without quotes.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s = raw.trim();
    if (s.startsWith('"')) {
      try {
        s = JSON.parse(s);
      } catch {
        return { ok: false, error: 'Enter s as plain text or a JSON string, for example "babab".' };
      }
    }
    if (typeof s !== 'string' || !VALID.test(s)) return { ok: false, error: 's must be non-empty and use lowercase letters only.' };
    if (s.length > MAX_N) return { ok: false, error: 's can have at most 10^5 letters.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
