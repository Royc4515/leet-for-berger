/**
 * Problem: No Adjacent Repeat
 *
 * Rearrange a string so no two neighbours are equal. Many arrangements are usually valid, so the
 * answer is fixed as the lexicographically smallest one, which turns a heap exercise into a
 * greedy-with-feasibility exercise.
 *
 * Feasibility: m letters can be arranged with no equal neighbours iff no letter occurs more than
 * ceil(m / 2) times, and a letter occurring exactly ceil(m / 2) times (m odd) must take every
 * even position, including the first. Building left to right, a letter is forced when it occurs
 * more than floor(m / 2) times among the m letters still to place; otherwise the smallest letter
 * that differs from the previous one is always safe. That is O(26) per position. Checking
 * feasibility by rescanning the rest of the string at every position is O(n^2).
 */

import { mulberry32 } from '../../engine/rng.js';
import { charString } from '../../engine/growth-inputs.js';

/**
 * Reference: the forced-or-smallest greedy described above.
 * @param {string} s lowercase letters
 * @returns {string} the smallest valid arrangement, or "" when none exists
 */
export function reference(s) {
  const cnt = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;
  if (Math.max(...cnt) > Math.ceil(s.length / 2)) return '';
  const out = [];
  let prev = -1;
  for (let m = s.length; m > 0; m--) {
    let pick = -1;
    for (let c = 0; c < 26; c++) {
      if (2 * cnt[c] > m) pick = c;
    }
    if (pick < 0) {
      for (let c = 0; c < 26; c++) {
        if (cnt[c] > 0 && c !== prev) {
          pick = c;
          break;
        }
      }
    }
    cnt[pick]--;
    out.push(String.fromCharCode(97 + pick));
    prev = pick;
  }
  return out.join('');
}

const MAX_LEN = 100000;

/** Seeded string of `len` letters drawn from the first `alphabet` letters. */
function randomString(seed, len, alphabet) {
  const rnd = mulberry32(seed);
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(97 + Math.floor(rnd() * alphabet));
  return s;
}

/** `heavy` copies of one letter plus seeded filler, shuffled with a seeded Fisher-Yates. */
function withHeavyLetter(seed, len, letter, heavy) {
  const rnd = mulberry32(seed);
  const chars = [];
  for (let i = 0; i < heavy; i++) chars.push(letter);
  while (chars.length < len) {
    const c = String.fromCharCode(97 + Math.floor(rnd() * 26));
    if (c !== letter) chars.push(c);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const visible = [
  { args: ['aab'], expected: 'aba', note: 'The only valid arrangement.' },
  { args: ['aaab'], expected: '', note: 'Three a among four letters: two of them must touch.' },
  { args: ['aabbcc'], expected: 'abacbc', note: '"ababcc" starts smaller but ends with "cc"; "abacbc" is the smallest valid one.' },
  { args: ['vvvlo'], expected: 'vlvov', note: 'v occurs 3 times in 5 letters, so it must take positions 0, 2 and 4.' },
  { args: ['z'], expected: 'z', note: 'A single letter has no neighbours.' },
];

// Hidden tests: two equal letters, a letter forced to the front although it is the largest, an
// even length where the heavy letter must wait, near-misses one letter over the limit, and inputs
// of 10^5 letters where rescanning the rest of the string at each position is far too slow.
const hiddenArgs = [
  ['aa'],
  ['zazbz'],
  ['zzzabc'],
  ['aaabbbbcc'],
  ['aaaaabbbb'],
  [randomString(3, 12, 3)],
  [randomString(5, MAX_LEN, 26)],
  [withHeavyLetter(7, MAX_LEN - 1, 'q', MAX_LEN / 2)],
  [withHeavyLetter(11, MAX_LEN, 'm', MAX_LEN / 2)],
  [withHeavyLetter(13, MAX_LEN, 'b', MAX_LEN / 2 + 1)],
];

export const problem = {
  id: 'no-adjacent-repeat',
  title: 'No Adjacent Repeat',
  difficulty: 'Medium',
  topics: ['greedy'],
  patterns: ['Greedy', 'Counting', 'Heap'],
  timeLimitMs: 3000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a string <code>s</code> of lowercase letters, rearrange its letters so that no two
    adjacent letters are equal.</p>
    <p>Usually several arrangements work. Return the <strong>lexicographically smallest</strong>
    one: the one that would come first in a dictionary. If no arrangement works, return the empty
    string <code>""</code>.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5 (raised from the usual 500)',
    's consists of lowercase English letters',
    'Output: the lexicographically smallest valid arrangement, or "" if none exists',
    'Target complexity: O(26 * n) time (rechecking the rest of the string at every position is O(n^2))',
  ],
  examples: visible.slice(0, 4).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If one letter fills more than half of the string, can you ever separate all its copies? What exactly is the limit?',
    'Building the answer left to right, you would like to write the smallest letter you can. When would that choice make the rest impossible?',
    'Suppose m letters are still to be placed. Which letter, if any, must go next no matter what?',
    'If no letter is forced, is the smallest letter that differs from the previous one always safe? Why?',
    'Can you decide each position by looking only at 26 counts, without rescanning the remaining string?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Build the answer left to right from the 26 letter counts. With <code>m</code> letters still
    to place, a letter with <code>2 * count &gt; m</code> must go next. Otherwise write the smallest
    letter that differs from the previous one.</p>
    <h4>Why it works</h4>
    <p>A set of letters can be arranged with no equal neighbours exactly when no letter fills more
    than <code>ceil(m / 2)</code> of it. A letter above half of what remains has to take this
    position or it can never be separated later. When no letter is that heavy, the smallest letter
    that differs from the previous one keeps the rest arrangeable, and choosing the smallest safe
    letter at each position gives the smallest string.</p>
    <h4>Complexity</h4>
    <p>O(26 * n) time, since each position looks at 26 counts, and O(26) extra space. Rechecking the
    remaining string at every position would be O(n^2).</p>
    <h4>Pitfall</h4>
    <p>Always taking the most frequent letter (the usual heap approach) produces a valid string but
    not the lexicographically smallest one. And the impossibility test is <code>count &gt; (n + 1) /
    2</code>, not <code>n / 2</code>: <code>"aab"</code> becomes <code>"aba"</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'reorganizeString',
    params: [{ name: 's', type: 'string' }],
    returns: 'string',
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
      return { ok: false, error: 'Enter s as a JSON string, for example "aab".' };
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_LEN) return { ok: false, error: 's must have 1 to 10^5 letters.' };
    if (!/^[a-z]+$/.test(s)) return { ok: false, error: 's may only contain lowercase letters a-z.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random letters over 26:
  // the most frequent one stays far below half, so an arrangement exists and every position is placed.
  growth: {
    target: 'n',
    n: 's.length',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => [charString(n, mulberry32(seed))],
  },
};

export default problem;
