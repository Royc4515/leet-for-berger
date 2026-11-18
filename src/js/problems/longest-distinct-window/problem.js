/**
 * Problem: Longest Distinct Window
 *
 * Length of the longest substring with no repeated character. The canonical variable-size
 * sliding window: grow the right edge, and when the new character is already inside the window,
 * move the left edge just past its previous occurrence. Each index enters and leaves the window
 * once, so the scan is O(n).
 *
 * The classic bug is moving the left edge backwards ("abba": the last 'a' was seen before the
 * current left edge), which the hidden tests target.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;

/**
 * Reference: remember the last index of every character; the left edge only moves forward.
 * @param {string} s
 * @returns {number}
 */
export function reference(s) {
  const last = new Map();
  let left = 0;
  let best = 0;
  for (let r = 0; r < s.length; r++) {
    const prev = last.get(s[r]);
    if (prev !== undefined && prev >= left) left = prev + 1;
    last.set(s[r], r);
    best = Math.max(best, r - left + 1);
  }
  return best;
}

/** Seeded string of n characters drawn from `alphabet`. */
function randomString(seed, n, alphabet) {
  const rnd = mulberry32(seed);
  let out = '';
  for (let i = 0; i < n; i++) out += alphabet[Math.floor(rnd() * alphabet.length)];
  return out;
}

/** Every printable ASCII character, space (32) to tilde (126). */
const PRINTABLE = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');

const visible = [
  { args: ['abcabcbb'], expected: 3, note: '"abc" is the longest run without a repeat.' },
  { args: ['bbbbb'], expected: 1, note: 'Every window longer than one character repeats "b".' },
  { args: ['pwwkew'], expected: 3, note: '"wke". "pwke" is not a substring, so it does not count.' },
  { args: [''], expected: 0, note: 'The empty string has only the empty substring.' },
  { args: ['dvdf'], expected: 3, note: '"vdf": after the second "d" the window restarts just past the first one, not at it.' },
];

// Hidden tests: the left edge must never move backwards ("abba", "tmmzuxt"), spaces and symbols
// count as characters, the whole string distinct, and 10^5 characters where the O(n^2) "restart
// from every index" approach is far too slow on a large alphabet.
const hiddenArgs = [
  ['a'],
  ['abba'],
  ['tmmzuxt'],
  [' a b!'],
  ['abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'],
  [randomString(7, 2000, 'abcdef')],
  ['x'.repeat(MAX_N)],
  [PRINTABLE.repeat(Math.ceil(MAX_N / 95)).slice(0, MAX_N)],
  [randomString(11, MAX_N, PRINTABLE)],
  [randomString(13, MAX_N, 'abcdefghijklmnopqrstuvwxyz')],
];

export const problem = {
  id: 'longest-distinct-window',
  title: 'Longest Distinct Window',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Sliding Window', 'Hash Map'],
  timeLimitMs: 3000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a string <code>s</code>, return the length of its longest <strong>substring</strong>
    (a contiguous run of characters) in which no character appears more than once.</p>
    <p>Every character counts, including spaces, digits and punctuation, and uppercase and
    lowercase letters are different characters.</p>
  `,
  constraints: [
    '0 <= s.length <= 10^5 (raised from LeetCode\'s 5 * 10^4)',
    's consists of printable ASCII characters (space to ~)',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If s[l..r] has no repeats, what do you know about s[l+1..r]?',
    'When the next character is already in your window, which characters must leave before it can join?',
    'What would you need to remember about each character to jump the left edge in one step?',
    'In "abba", where is the left edge when you reach the last "a", and where was the first "a"?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'lengthOfLongestSubstring',
    params: [{ name: 's', type: 'string' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: s as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter s as a JSON string, for example "abcabcbb".' };
    }
    if (typeof s !== 'string') return { ok: false, error: 's must be a JSON string.' };
    if (s.length > MAX_N) return { ok: false, error: 's must have at most 10^5 characters.' };
    if (!/^[\x20-\x7e]*$/.test(s)) return { ok: false, error: 's may only contain printable ASCII characters.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
