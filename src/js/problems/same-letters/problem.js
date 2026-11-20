/**
 * Problem: Same Letters
 *
 * Decide whether two strings are made of exactly the same letters with the same counts, in any
 * order (an anagram check). Count letters in one string, subtract for the other, and require
 * every count to end at zero. Sorting both strings also works, at O(n log n).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Reference: one frequency table. O(n) time, O(1) space for a 26-letter alphabet.
 * @param {string} s
 * @param {string} t
 * @returns {boolean}
 */
export function reference(s, t) {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
    count[t.charCodeAt(i) - 97]--;
  }
  return count.every((c) => c === 0);
}

/** Seeded random string of `len` letters from `alphabet`. */
function randomString(rnd, len, alphabet = LETTERS) {
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(rnd() * alphabet.length)];
  return out;
}

/** Seeded Fisher-Yates shuffle of the characters of `s`. */
function shuffled(rnd, s) {
  const a = s.split('');
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join('');
}

/** A long random string and a shuffle of it: true. */
function longShuffle(seed) {
  const rnd = mulberry32(seed);
  const s = randomString(rnd, MAX_LEN);
  return [s, shuffled(rnd, s)];
}

/** A long random string and a shuffle of it with one letter replaced: same length, one count off. */
function longOneOff(seed) {
  const rnd = mulberry32(seed);
  const s = randomString(rnd, MAX_LEN, 'abc');
  const t = shuffled(rnd, s).split('');
  t[MAX_LEN - 1] = t[MAX_LEN - 1] === 'a' ? 'b' : 'a';
  return [s, t.join('')];
}

const visible = [
  { args: ['anagram', 'nagaram'], expected: true, note: 'Both use a three times, n once, g once, r once, m once.' },
  { args: ['rat', 'car'], expected: false, note: 't has a c, s has a t.' },
  { args: ['a', 'a'], expected: true, note: 'Identical strings are anagrams of each other.' },
  { args: ['ab', 'a'], expected: false, note: 'Different lengths can never match.' },
  { args: ['aab', 'abb'], expected: false, note: 'Same length and the same set of letters, but the counts differ.' },
];

// Hidden tests target the classic wrong answers: comparing letter sets, comparing sums of letter
// codes ("ad" and "bc" add up the same), and comparing lengths only; plus 10^5-character inputs
// where an O(n^2) matching (remove each letter from the other string) times out.
const hiddenArgs = [
  ['ad', 'bc'],
  ['aabb', 'abab'],
  ['listen', 'silent'],
  ['abcd', 'abcdd'],
  ['ad'.repeat(MAX_LEN / 2), 'bc'.repeat(MAX_LEN / 2)],
  ['a'.repeat(MAX_LEN), `${'a'.repeat(MAX_LEN - 1)}b`],
  longShuffle(51),
  longOneOff(53),
  (() => {
    const rnd = mulberry32(57);
    return [randomString(rnd, MAX_LEN), randomString(rnd, MAX_LEN - 1)];
  })(),
  (() => {
    const s = randomString(mulberry32(59), MAX_LEN);
    return [s, s.split('').reverse().join('')];
  })(),
];

export const problem = {
  id: 'same-letters',
  title: 'Same Letters',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Hash Map', 'Frequency Count'],
  timeLimitMs: 2000,
  argNames: ['s', 't'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Two strings are <em>rearrangements</em> of each other when one can be obtained from the other
    by reordering its characters, using every character exactly once.</p>
    <p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if they are
    rearrangements of each other, and <code>false</code> otherwise.</p>
    <p>For example, <code>"listen"</code> and <code>"silent"</code> qualify. <code>"aab"</code> and
    <code>"abb"</code> do not: they have the same letters, but not the same number of each.</p>
  `,
  constraints: [
    '1 <= s.length, t.length <= 10^5',
    's and t consist of lowercase English letters',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}, t = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'What must be true about the lengths of two strings that are rearrangements of each other? Can you answer some inputs immediately?',
    'If you only compare which letters appear, which pair of strings fools you? What extra information do you need per letter?',
    'How could you count the letters of s in a small table, and what would you do with t to compare without building a second table?',
    'Another route: what do two rearrangements look like once each is sorted? What does it cost?',
    'The alphabet has 26 letters. What does that say about the memory your table needs as n grows?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>If the lengths differ, the answer is <code>false</code>. Otherwise keep one table of 26 counters: add one
    for each letter of <code>s</code> and subtract one for each letter of <code>t</code>. The strings
    are rearrangements of each other exactly when every counter ends at zero.</p>
    <h4>Why it works</h4>
    <p>A rearrangement keeps the number of every letter and changes only the positions. So two strings
    are rearrangements when their letter counts are the same, and the counter table is exactly the
    difference of those counts.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(1) extra space (26 counters). Sorting both strings and comparing is simpler and
    O(n log n).</p>
    <h4>Pitfall</h4>
    <p>Comparing only the set of letters says <code>"aab"</code> and <code>"abb"</code> match. Comparing the
    sum of letter codes says <code>"ad"</code> and <code>"bc"</code> match. Checking each letter of
    <code>s</code> with a search through <code>t</code> and removing it is O(n<sup>2</sup>), too slow at
    10<sup>5</sup> characters.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'sameLetters',
    params: [
      { name: 's', type: 'string' },
      { name: 't', type: 'string' },
    ],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, each a JSON string (s, then t).
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim());
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: s and t, each as a JSON string like "listen".' };
    let s;
    let t;
    try {
      s = JSON.parse(lines[0]);
      t = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be JSON strings, e.g. "listen".' };
    }
    for (const [name, v] of [['s', s], ['t', t]]) {
      if (typeof v !== 'string') return { ok: false, error: `${name} must be a JSON string.` };
      if (v.length < 1 || v.length > MAX_LEN) return { ok: false, error: `${name} must have 1 to 10^5 characters.` };
      if (!/^[a-z]+$/.test(v)) return { ok: false, error: `${name} must contain only lowercase English letters.` };
    }
    return { ok: true, args: [s, t] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
