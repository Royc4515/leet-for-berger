/**
 * Problem: DNA Repeats
 *
 * Every 10-letter window of a DNA string that occurs more than once. Comparing each window with
 * every other is O(n^2); one pass with a "seen" set and a "reported" set is O(n) windows. With
 * only four letters, a window also packs into 20 bits, which turns the set into a bit array and
 * the window into a rolling integer.
 *
 * Output order is fixed (lexicographic) so judging is exact.
 */

import { mulberry32 } from '../../engine/rng.js';

const WINDOW = 10;

/**
 * Reference: count every window in a map, keep those seen twice or more, sort.
 * @param {string} s
 * @returns {string[]}
 */
export function reference(s) {
  const counts = new Map();
  for (let i = 0; i + WINDOW <= s.length; i++) {
    const w = s.slice(i, i + WINDOW);
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  // Plain < comparison: the letters are ASCII, so this is byte order, the same in every language.
  return [...counts].filter(([, c]) => c > 1).map(([w]) => w).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

const MAX_N = 100000;
const VALID = /^[ACGT]+$/;

/** n seeded letters drawn from `letters`. */
function randomDna(seed, n, letters = 'ACGT') {
  const rnd = mulberry32(seed);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = letters[Math.floor(rnd() * letters.length)];
  return out.join('');
}

/** A seeded block of `period` letters repeated to length n: every window repeats. */
function periodic(seed, n, period) {
  const block = randomDna(seed, period);
  return block.repeat(Math.ceil(n / period)).slice(0, n);
}

const visible = [
  { args: ['AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT'], expected: ['AAAAACCCCC', 'CCCCCAAAAA'], note: 'Both windows occur twice. They are listed in lexicographic order.' },
  { args: ['AAAAAAAAAAAAA'], expected: ['AAAAAAAAAA'], note: 'Occurrences may overlap; each repeated window is listed once.' },
  { args: ['ACGTACGTAC'], expected: [], note: 'A string of length 10 has only one window.' },
  { args: ['ACGT'], expected: [], note: 'Shorter than 10 letters: no window at all.' },
  { args: ['GTACGTACGTACGTAC'], expected: ['ACGTACGTAC', 'GTACGTACGT', 'TACGTACGTA'], note: 'The letters repeat every 4, so the windows at 4, 5 and 6 equal those at 0, 1 and 2. The window at 3 occurs once.' },
];

// Hidden tests: exactly 11 equal letters, a near miss (two windows differing in the last letter),
// windows that repeat far apart, then 10^5-letter strings: uniform random (a few thousand repeats),
// a two-letter alphabet (every one of the 1024 windows repeats), a short period, a long period, and
// a run of one letter.
const hiddenArgs = [
  ['GGGGGGGGGGG'],
  ['ACGTTGCAACTACGTTGCAAG'],
  [`TTTTTCCCCCAG${'A'.repeat(30)}TTTTTCCCCC`],
  ['ACACACACACACACACACACA'],
  [randomDna(29, 2000)],
  [randomDna(31, MAX_N)],
  [randomDna(37, MAX_N, 'AC')],
  [periodic(41, MAX_N, 7)],
  [periodic(43, MAX_N, 49999)],
  ['T'.repeat(MAX_N)],
];

export const problem = {
  id: 'dna-repeats',
  title: 'DNA Repeats',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Hash Set', 'Sliding Window', 'Rolling Hash', 'Bit Manipulation'],
  milestone: 2,
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A DNA string is made of the letters <code>'A'</code>, <code>'C'</code>, <code>'G'</code>
    and <code>'T'</code>. Given a DNA string <code>s</code>, return every substring of length
    10 that occurs more than once in <code>s</code>. Occurrences may overlap.</p>
    <p>List each such substring once, and return the list sorted in lexicographic (alphabetical)
    order. Return an empty list if there is none.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5',
    "s[i] is 'A', 'C', 'G' or 'T'",
    'The answer is sorted lexicographically, without duplicates',
    'Target complexity: O(n) windows (O(n log n) with the final sort); O(n^2) times out',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How many windows of length 10 does a string of length n have?',
    'Walking left to right, how can you tell whether the current window has appeared before?',
    'A window that appears three times should still be reported once. What second set helps?',
    'With four letters, how many bits does one letter need? How many does a window need?',
    'When the window slides one step, how do you update its 20-bit code without rebuilding it?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'repeatedWindows',
    params: [{ name: 's', type: 'string' }],
    returns: 'string[]',
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
        return { ok: false, error: 'Enter s as plain text or a JSON string, for example "AAAAACCCCCAAAAACCCCC".' };
      }
    }
    if (typeof s !== 'string' || !VALID.test(s)) return { ok: false, error: "s must be non-empty and use only 'A', 'C', 'G' and 'T'." };
    if (s.length > MAX_N) return { ok: false, error: 's can have at most 10^5 letters.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
