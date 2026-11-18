/**
 * Problem: First Match Index
 *
 * Find where a pattern first occurs in a text. Comparing the pattern at every position is
 * O(n * m), which is fine on ordinary text but quadratic on inputs like "aaaa...a" searched for
 * "aaa...ab": every position matches almost the whole pattern before failing. KMP (a prefix
 * function) or the Z-function never re-reads text it has already matched, so the search is
 * O(n + m).
 *
 * Limits are raised well past the usual 10^4 so that the quadratic scan times out: both strings
 * can be 5 * 10^5 characters long and the hidden tests include the adversarial shapes. Some
 * built-in substring searches are quadratic on exactly these inputs, so the problem is a reason
 * to write KMP or Z yourself.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: the prefix function of needle + '#' + haystack; the first position where it reaches
 * needle.length ends the first match.
 * @param {string} haystack
 * @param {string} needle
 * @returns {number}
 */
export function reference(haystack, needle) {
  const m = needle.length;
  if (m > haystack.length) return -1;
  // '#' never occurs in the input, so no border can run across it.
  const t = `${needle}#${haystack}`;
  const pi = new Int32Array(t.length);
  for (let i = 1; i < t.length; i++) {
    let k = pi[i - 1];
    while (k > 0 && t[i] !== t[k]) k = pi[k - 1];
    if (t[i] === t[k]) k++;
    pi[i] = k;
    if (k === m) return i - 2 * m;
  }
  return -1;
}

const MAX_LEN = 500000;
const VALID = /^[a-z]+$/;

/** n seeded letters drawn from the first k lowercase letters. */
function randomString(seed, n, k) {
  const rnd = mulberry32(seed);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = String.fromCharCode(97 + Math.floor(rnd() * k));
  return out.join('');
}

const A = (n) => 'a'.repeat(n);
const HALF = MAX_LEN / 2;

// A random two-letter text with its own slice planted near the end as the needle, so the first
// match is found only after a long scan full of partial matches.
const plantedText = randomString(53, MAX_LEN, 2);
const plantedNeedle = plantedText.slice(MAX_LEN - 3000, MAX_LEN - 1000);

const visible = [
  { args: ['sadbutsad', 'sad'], expected: 0, note: '"sad" occurs at 0 and at 6; the first occurrence is at 0.' },
  { args: ['leetcode', 'leeto'], expected: -1, note: '"leeto" does not occur.' },
  { args: ['hello', 'll'], expected: 2, note: 'The match starts at index 2.' },
  { args: ['aaa', 'aaaa'], expected: -1, note: 'A needle longer than the haystack cannot occur.' },
  { args: ['mississippi', 'issip'], expected: 4, note: 'The attempt at 1 matches "issi" and then fails; the real match starts at 4.' },
];

// Hidden tests: whole-string match, a match at the very end, a self-overlapping needle, then
// 5 * 10^5-character texts where comparing at every position is quadratic: a run of 'a' searched
// for a run ending in 'b' (with and without a match), a 'b' in the middle of the needle (defeats
// "check the last character first"), and a long planted needle in random two-letter text.
const hiddenArgs = [
  ['a', 'a'],
  ['abcabcabd', 'abcabd'],
  ['aabaaabaaac', 'aabaaac'],
  ['xyz', 'z'],
  [A(MAX_LEN), `${A(HALF - 1)}b`],
  [`${A(MAX_LEN - 1)}b`, `${A(HALF - 1)}b`],
  [A(MAX_LEN), `${A(HALF / 2)}b${A(HALF / 2)}`],
  [`${A(HALF)}b${A(HALF - 1)}`, `${A(HALF / 2)}b${A(HALF / 2)}`],
  [plantedText, plantedNeedle],
  [randomString(59, MAX_LEN, 26), randomString(61, 5, 3)],
];

export const problem = {
  id: 'first-match-index',
  title: 'First Match Index',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['String Matching', 'KMP', 'Z-function'],
  milestone: 1,
  timeLimitMs: 3000,
  argNames: ['haystack', 'needle'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given two strings <code>haystack</code> and <code>needle</code>, return the index of the
    first occurrence of <code>needle</code> as a contiguous substring of <code>haystack</code>,
    or <code>-1</code> if it does not occur.</p>
    <p>Both strings can be half a million characters long, and the hidden tests include texts
    such as <code>"aaaa...a"</code> searched for <code>"aaa...ab"</code>. Comparing the needle
    at every position is quadratic on those inputs and runs out of time; some built-in substring
    searches behave the same way. Aim for a linear-time search.</p>
  `,
  constraints: [
    '1 <= haystack.length, needle.length <= 5 * 10^5',
    'Both strings consist of lowercase English letters',
    'Target complexity: O(n + m) time (KMP or Z-function); O(n * m) times out',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `haystack = ${JSON.stringify(t.args[0])}, needle = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How much work does comparing at every position do when the text is all "a" and the needle is "aaa...ab"?',
    'After a mismatch, you already know the characters you just matched. Do you have to read them again?',
    'For each prefix of the needle, what is the longest proper prefix that is also a suffix of it? How does that tell you where to resume?',
    'What happens if you run the same computation on needle + "#" + haystack?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'firstMatchIndex',
    params: [
      { name: 'haystack', type: 'string' },
      { name: 'needle', type: 'string' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, haystack then needle, with or without quotes.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: haystack, then needle.' };
    const args = [];
    for (const line of lines) {
      let s = line;
      if (s.startsWith('"')) {
        try {
          s = JSON.parse(s);
        } catch {
          return { ok: false, error: 'Each line must be plain text or a JSON string.' };
        }
      }
      if (typeof s !== 'string' || !VALID.test(s)) return { ok: false, error: 'Both strings must be non-empty and use lowercase letters only.' };
      if (s.length > MAX_LEN) return { ok: false, error: 'Each string can have at most 5 * 10^5 characters.' };
      args.push(s);
    }
    return { ok: true, args };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
