/**
 * Problem: Covering Window
 *
 * The shortest substring of s that contains every character of t, duplicates included. The
 * variable-size window grows on the right until it covers t, then shrinks from the left while it
 * still covers t; a single counter of "still missing" characters makes the cover test O(1), so
 * the whole scan is O(m + n).
 *
 * Several windows can share the minimum length, so the statement fixes the leftmost one. The
 * scan meets minimal windows in order of their right edge (equivalently their left edge, since
 * they have the same length), and only a strictly shorter window replaces the best one.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Reference: grow right, shrink left while covered; keep the first window of each new minimum.
 * @param {string} s
 * @param {string} t
 * @returns {string}
 */
export function reference(s, t) {
  const need = new Int32Array(128);
  for (let i = 0; i < t.length; i++) need[t.charCodeAt(i)]++;
  let missing = t.length;
  let bestStart = -1;
  let bestLen = Infinity;
  for (let l = 0, r = 0; r < s.length; r++) {
    if (need[s.charCodeAt(r)]-- > 0) missing--;
    while (missing === 0) {
      if (r - l + 1 < bestLen) {
        bestLen = r - l + 1;
        bestStart = l;
      }
      if (++need[s.charCodeAt(l++)] > 0) missing++;
    }
  }
  return bestStart < 0 ? '' : s.slice(bestStart, bestStart + bestLen);
}

/** Seeded string of n characters drawn from `alphabet`. */
function randomString(seed, n, alphabet) {
  const rnd = mulberry32(seed);
  let out = '';
  for (let i = 0; i < n; i++) out += alphabet[Math.floor(rnd() * alphabet.length)];
  return out;
}

const visible = [
  { args: ['ADOBECODEBANC', 'ABC'], expected: 'BANC', note: '"ADOBEC" and "CODEBA" also cover A, B and C, but "BANC" is shorter.' },
  { args: ['a', 'a'], expected: 'a', note: 'The whole string is the window.' },
  { args: ['a', 'aa'], expected: '', note: 't needs two "a", s has only one, so no window exists.' },
  { args: ['xbaab', 'ab'], expected: 'ba', note: '"ba" and "ab" both have length 2; return the leftmost.' },
  { args: ['bBaAb', 'Ab'], expected: 'Ab', note: 'Case matters: "B" does not stand in for "b", nor "a" for "A".' },
];

// Hidden tests: t longer than s, duplicates in t that s cannot meet, a window that must keep
// two copies of a letter, ties resolved to the leftmost window, and 10^5-character strings where
// restarting the search from every left edge is O(m^2).
const hiddenArgs = [
  ['ab', 'abc'],
  ['aaflslflsldkalskaaa', 'aaa'],
  ['abcabdebac', 'cda'],
  ['cabwefgewcwaefgcf', 'cae'],
  ['abba', 'ab'],
  [randomString(7, 3000, 'abcde'), 'aabbc'],
  ['a'.repeat(MAX_N - 1) + 'b', 'ab'],
  [randomString(11, MAX_N, LETTERS), LETTERS],
  [randomString(13, MAX_N, 'abc'), 'a'.repeat(2000) + 'b'.repeat(2000) + 'c'.repeat(2000)],
  [randomString(17, MAX_N, LETTERS), randomString(19, 5000, LETTERS)],
];

export const problem = {
  id: 'covering-window',
  title: 'Covering Window',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Sliding Window', 'Hash Map'],
  timeLimitMs: 3000,
  argNames: ['s', 't'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given strings <code>s</code> and <code>t</code>, return the shortest substring of
    <code>s</code> that contains every character of <code>t</code>, counting repeats: if
    <code>t</code> has a letter three times, the substring must contain it at least three
    times.</p>
    <p>If several substrings share the shortest length, return the one that starts
    <strong>leftmost</strong> in <code>s</code>. If no substring works, return the empty string
    <code>""</code>. Uppercase and lowercase letters are different characters.</p>
  `,
  constraints: [
    '1 <= s.length, t.length <= 10^5',
    's and t consist of English letters (a-z, A-Z)',
    'Ties go to the leftmost window',
    'Target complexity: O(m + n) time',
  ],
  examples: visible.slice(0, 4).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}, t = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If s[l..r] covers t, does every longer window starting at l also cover it?',
    'Once a window covers t, how far can you move its left edge before it stops covering?',
    'Checking all letter counts on every step is slow. What single number could tell you the window covers t?',
    'When two windows have the same shortest length, which one does your scan find first, and does your update keep it?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Grow a window to the right until it covers <code>t</code>, then shrink it from the left for as long
    as it still covers <code>t</code>, recording each covering window. A single counter of how many
    needed characters the window currently supplies makes the "does it cover" test O(1).</p>
    <h4>Why it works</h4>
    <p>For each right edge, the inner loop pushes <code>l</code> to the last position where the window
    still covers <code>t</code>, so the shortest covering window ending at that right edge is seen. The
    counter rises only when a character fills a slot of <code>t</code> that was still empty, and drops only
    when removing a character empties one, so it equals <code>t.length</code> exactly when every count is
    met, repeats included.</p>
    <h4>Complexity</h4>
    <p>O(m + n) time: each index of <code>s</code> enters and leaves the window once, plus one pass over
    <code>t</code>. O(1) extra space for two 128-entry count tables. Checking every substring would be
    O(m^2) windows.</p>
    <h4>Pitfall</h4>
    <p>Ties must go to the leftmost window. The scan meets equal-length windows from left to right, so
    replace the best only on a strictly shorter length; using <code>&lt;=</code> returns the rightmost
    one. Return <code>""</code> when <code>t</code> is never covered, including when it is longer than
    <code>s</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'minWindow',
    params: [
      { name: 's', type: 'string' },
      { name: 't', type: 'string' },
    ],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: s and t as JSON strings, one per line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter s on line 1 and t on line 2, as JSON strings.' };
    let s;
    let t;
    try {
      s = JSON.parse(lines[0]);
      t = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be JSON strings, for example "ADOBECODEBANC" then "ABC".' };
    }
    for (const [name, v] of [['s', s], ['t', t]]) {
      if (typeof v !== 'string' || v.length < 1 || v.length > MAX_N) return { ok: false, error: `${name} must be a string of 1 to 10^5 characters.` };
      if (!/^[a-zA-Z]+$/.test(v)) return { ok: false, error: `${name} may only contain English letters.` };
    }
    return { ok: true, args: [s, t] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
