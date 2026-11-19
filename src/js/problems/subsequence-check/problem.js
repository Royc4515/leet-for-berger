/**
 * Problem: Subsequence Check
 *
 * Decide whether one string can be read inside another by skipping characters, without
 * reordering. The classic greedy two-pointer: match each character of s at the earliest place
 * it can go in t, and never look back.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;

/**
 * Reference: two pointers, greedy earliest match. O(|s| + |t|) time.
 * @param {string} s
 * @param {string} t
 * @returns {boolean}
 */
export function reference(s, t) {
  let i = 0;
  for (let j = 0; i < s.length && j < t.length; j++) {
    if (s[i] === t[j]) i++;
  }
  return i === s.length;
}

/** Seeded random string of `len` letters from `alphabet`. */
function randomString(rnd, len, alphabet) {
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(rnd() * alphabet.length)];
  return out;
}

/** t random over `alphabet`; s keeps each character of t with probability `keep`. */
function keptPair(seed, len, alphabet, keep) {
  const rnd = mulberry32(seed);
  const t = randomString(rnd, len, alphabet);
  let s = '';
  for (const c of t) if (rnd() < keep) s += c;
  return [s, t];
}

/** Every other character of a long t, then one character t never has after that point: false at the very end. */
function failsOnLastChar(seed) {
  const rnd = mulberry32(seed);
  const t = randomString(rnd, MAX_LEN, 'ab');
  let s = '';
  for (let i = 0; i < t.length; i += 2) s += t[i];
  return [`${s}c`, t];
}

/** s equal to t at full length: every character must match, the last one included. */
function sameString(seed) {
  const t = randomString(mulberry32(seed), MAX_LEN, 'xyz');
  return [t, t];
}

const visible = [
  { args: ['ace', 'abcde'], expected: true, note: 'Keep a, c and e; drop b and d.' },
  { args: ['aec', 'abcde'], expected: false, note: 'All three letters are in t, but c comes before e there.' },
  { args: ['', 'wix'], expected: true, note: 'The empty string is a subsequence of every string.' },
  { args: ['aa', 'abc'], expected: false, note: 't has only one a to offer.' },
  { args: ['wix', 'wwiixx'], expected: true, note: 'Repeated letters in t are just more choices.' },
];

// Hidden tests target the classic wrong answers: checking membership instead of order, ignoring
// repeated letters, an s longer than t, an empty t, failing only on the very last character, and
// 10^5-character inputs that time out a solution which rescans t for every character of s.
const hiddenArgs = [
  ['a', ''],
  ['', ''],
  ['abc', 'abc'],
  ['abcd', 'abc'],
  ['ba', 'ab'],
  keptPair(7, 2000, 'abc', 0.3),
  keptPair(11, MAX_LEN, 'ab', 0.5),
  failsOnLastChar(13),
  sameString(17),
  ['a'.repeat(MAX_LEN), `${'a'.repeat(MAX_LEN / 2)}b${'a'.repeat(MAX_LEN / 2 - 1)}`],
];

export const problem = {
  id: 'subsequence-check',
  title: 'Subsequence Check',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Greedy'],
  timeLimitMs: 2000,
  argNames: ['s', 't'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>s</code>
    can be obtained from <code>t</code> by deleting zero or more characters of <code>t</code> while
    keeping the remaining characters in their original order. Otherwise return <code>false</code>.</p>
    <p>For example, <code>"wix"</code> can be read inside <code>"wwiixx"</code>, but <code>"xiw"</code>
    cannot: the letters are all there, just in the wrong order.</p>
  `,
  constraints: [
    '0 <= s.length <= 10^5',
    '0 <= t.length <= 10^5',
    's and t consist of lowercase English letters',
    'Target complexity: O(|s| + |t|) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}, t = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Is it enough to check that every letter of s appears somewhere in t?',
    'Take the first letter of s. Where in t should you match it, and why is that choice never worse than a later one?',
    'Once a letter of s is matched at some position of t, do you ever need to look at the part of t before it again?',
    'What should the answer be when s is empty? When t is empty but s is not?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep one pointer <code>i</code> into <code>s</code> and walk <code>t</code> from left to right.
    Whenever the current character of <code>t</code> equals <code>s[i]</code>, advance <code>i</code>.
    At the end, <code>s</code> is a subsequence exactly when <code>i</code> reached its length.</p>
    <h4>Why it works</h4>
    <p>Matching <code>s[i]</code> at the earliest possible position in <code>t</code> is always safe:
    any valid matching that uses a later position can be shifted to the earlier one, and that leaves
    more of <code>t</code> for the rest of <code>s</code>. So if the greedy scan fails, no other
    choice of positions could succeed.</p>
    <h4>Complexity</h4>
    <p>O(|s| + |t|) time: each pointer only moves forward. O(1) extra space. Restarting the search in
    <code>t</code> for each letter of <code>s</code>, or slicing strings in a recursion, is
    O(|s| * |t|), far too slow at 10^5 each.</p>
    <h4>Pitfall</h4>
    <p>Counting letters instead of following order. <code>"aec"</code> and <code>"abcde"</code> have
    the right letters, yet c comes before e in <code>t</code>, so the answer is false.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'isSubsequence',
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
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: s and t, each as a JSON string like "ace".' };
    let s;
    let t;
    try {
      s = JSON.parse(lines[0]);
      t = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be JSON strings, e.g. "ace" (use "" for an empty string).' };
    }
    for (const [name, v] of [['s', s], ['t', t]]) {
      if (typeof v !== 'string') return { ok: false, error: `${name} must be a JSON string.` };
      if (v.length > MAX_LEN) return { ok: false, error: `${name} must have at most 10^5 characters.` };
      if (!/^[a-z]*$/.test(v)) return { ok: false, error: `${name} must contain only lowercase English letters.` };
    }
    return { ok: true, args: [s, t] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
