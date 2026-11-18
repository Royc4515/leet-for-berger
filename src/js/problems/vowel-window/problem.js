/**
 * Problem: Vowel Window
 *
 * The most vowels in any substring of exactly k characters. The entry-level fixed-size sliding
 * window: moving the window one step adds one character and drops one, so the count updates in
 * O(1) instead of being recounted in O(k). With n = 10^5 and k = n / 2, recounting every window
 * is about 5 * 10^9 character checks.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * Reference: count the first window, then add the entering and drop the leaving character.
 * @param {string} s
 * @param {number} k
 * @returns {number}
 */
export function reference(s, k) {
  let count = 0;
  for (let i = 0; i < k; i++) if (VOWELS.has(s[i])) count++;
  let best = count;
  for (let i = k; i < s.length; i++) {
    if (VOWELS.has(s[i])) count++;
    if (VOWELS.has(s[i - k])) count--;
    best = Math.max(best, count);
  }
  return best;
}

/** Seeded lowercase string of length n drawn from `alphabet`. */
function randomString(seed, n, alphabet) {
  const rnd = mulberry32(seed);
  let out = '';
  for (let i = 0; i < n; i++) out += alphabet[Math.floor(rnd() * alphabet.length)];
  return out;
}

const visible = [
  { args: ['abciiidef', 3], expected: 3, note: '"iii" is three vowels.' },
  { args: ['aeiou', 2], expected: 2, note: 'Every window of 2 is all vowels.' },
  { args: ['leetcode', 3], expected: 2, note: '"lee", "eet" and "ode" each hold 2 vowels.' },
  { args: ['rhythms', 4], expected: 0, note: 'No vowels at all; "y" is not a vowel here.' },
  { args: ['tryhard', 4], expected: 1, note: 'Windows "tryh", "ryha", "yhar", "hard": the best has one vowel.' },
];

// Hidden tests: k = 1 and k = n, the best window at the very end (an off-by-one that skips the
// last window), and 10^5 characters with large k, where recounting each window times out.
const hiddenArgs = [
  ['a', 1],
  ['b', 1],
  ['bbbbbaaa', 3],
  ['aaabbbbb', 8],
  ['novowelsxyz', 1],
  [randomString(7, 2000, 'abcdeiou'), 50],
  ['b'.repeat(MAX_N / 2) + 'a'.repeat(MAX_N / 2), MAX_N / 2],
  [randomString(11, MAX_N, 'abcdefghijklmnopqrstuvwxyz'), MAX_N / 2],
  [randomString(13, MAX_N, 'aeioubcd'), 77777],
  [randomString(17, MAX_N, 'abcdefghijklmnopqrstuvwxyz'), MAX_N],
];

export const problem = {
  id: 'vowel-window',
  title: 'Vowel Window',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Sliding Window'],
  timeLimitMs: 3000,
  argNames: ['s', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a lowercase string <code>s</code> and an integer <code>k</code>, look at every
    substring of <code>s</code> that is exactly <code>k</code> characters long and return the
    largest number of vowels any of them contains.</p>
    <p>The vowels are <code>a</code>, <code>e</code>, <code>i</code>, <code>o</code> and
    <code>u</code>.</p>
  `,
  constraints: [
    '1 <= k <= s.length <= 10^5',
    's consists of lowercase English letters',
    'Target complexity: O(n) time (O(n * k) times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How many characters differ between the window starting at i and the one starting at i + 1?',
    'If you know the vowel count of one window, how do you get the next one without recounting?',
    'Does your loop look at the very last window, the one that ends at the final character?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Count the vowels in the first <code>k</code> characters, then slide the window one step at a time:
    the character entering on the right may add a vowel and the one leaving on the left may remove one.
    Track the best count seen.</p>
    <h4>Why it works</h4>
    <p>Two neighboring windows of length <code>k</code> share <code>k - 1</code> characters, so the new
    count is the old count plus the entering character minus the leaving one. Every window from start
    <code>0</code> to start <code>n - k</code> is visited exactly once, so the maximum over them is the
    answer.</p>
    <h4>Complexity</h4>
    <p>O(n) time, a constant amount of work per step. O(1) space. Recounting each window costs O(n * k),
    about 5 * 10^9 checks when <code>n = 10^5</code> and <code>k = n / 2</code>.</p>
    <h4>Pitfall</h4>
    <p>Off-by-one at the boundaries: the character that leaves when position <code>i</code> enters is
    <code>s[i - k]</code>, not <code>s[i - k + 1]</code>. Also make sure the best count starts from the
    first window, so the case <code>k = s.length</code>, which has only one window, still returns its
    count.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maxVowels',
    params: [
      { name: 's', type: 'string' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: s as a JSON string, then k, one per line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter s on line 1 (a JSON string) and k on line 2.' };
    let s;
    let k;
    try {
      s = JSON.parse(lines[0]);
      k = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter s as a JSON string and k as an integer, for example "leetcode" then 3.' };
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_N) return { ok: false, error: 's must be a string of 1 to 10^5 characters.' };
    if (!/^[a-z]+$/.test(s)) return { ok: false, error: 's may only contain lowercase English letters.' };
    if (!Number.isInteger(k) || k < 1 || k > s.length) return { ok: false, error: 'k must be an integer from 1 to s.length.' };
    return { ok: true, args: [s, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
