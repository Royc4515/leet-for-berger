/**
 * Problem: Matching Bit Blocks
 *
 * Count the substrings of a binary string made of k zeros followed by k ones, or k ones followed by
 * k zeros. Every such substring sits on the border between two neighbouring runs of equal
 * characters, and a border contributes min(left run, right run) of them. So one pass over the run
 * lengths is enough. Checking every substring is about n^2 / 2 substrings times a scan each.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;

/**
 * Reference: each border between two runs adds the shorter run's length.
 * @param {string} s binary string
 * @returns {number}
 */
export function reference(s) {
  let prev = 0;
  let cur = 1;
  let total = 0;
  for (let i = 1; i < s.length; i++) {
    if (s[i] === s[i - 1]) {
      cur++;
    } else {
      total += Math.min(prev, cur);
      prev = cur;
      cur = 1;
    }
  }
  return total + Math.min(prev, cur);
}

/** Seeded binary string made of runs with lengths 1..maxRun. */
function runs(seed, n, maxRun) {
  const rnd = mulberry32(seed);
  let out = '';
  let bit = rnd() < 0.5 ? '0' : '1';
  while (out.length < n) {
    out += bit.repeat(Math.min(n - out.length, 1 + Math.floor(rnd() * maxRun)));
    bit = bit === '0' ? '1' : '0';
  }
  return out;
}

const visible = [
  { args: ['00110011'], expected: 6, note: '0011, 01, 1100, 10, 0011, 01: six in all, the two "0011" count separately.' },
  { args: ['10101'], expected: 4, note: 'Every adjacent pair 10 or 01 counts: 10, 01, 10, 01.' },
  { args: ['0011'], expected: 2, note: '"0011" and the "01" in its middle.' },
  { args: ['000111000'], expected: 6, note: 'The first border gives 01, 0011 and 000111; the second gives 10, 1100 and 111000.' },
  { args: ['0000'], expected: 0, note: 'No border between runs, so nothing is balanced.' },
];

// Hidden tests: one character, a lone border, an unequal pair of runs, a balanced string whose
// zeros and ones are not grouped ("0110" has two of each but is not valid), then max-size inputs:
// 5 * 10^4 zeros then 5 * 10^4 ones (a scan from every start is quadratic), alternating bits (the
// most borders), short seeded runs, longer seeded runs, and one huge run next to a small one.
const hiddenArgs = [
  ['1'],
  ['01'],
  ['0001'],
  ['0110'],
  ['1100110011'],
  ['0'.repeat(MAX_LEN / 2) + '1'.repeat(MAX_LEN / 2)],
  ['01'.repeat(MAX_LEN / 2)],
  [runs(31, MAX_LEN, 4)],
  [runs(32, MAX_LEN, 3000)],
  ['1'.repeat(MAX_LEN - 7) + '0'.repeat(7)],
];

export const problem = {
  id: 'matching-bit-blocks',
  title: 'Matching Bit Blocks',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Run Lengths'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a binary string <code>s</code>, count its non-empty substrings that have the same
    number of <code>0</code>s and <code>1</code>s <em>and</em> keep all the <code>0</code>s together
    and all the <code>1</code>s together. In other words, each counted substring is
    <code>k</code> zeros followed by <code>k</code> ones, or <code>k</code> ones followed by
    <code>k</code> zeros, for some <code>k &gt;= 1</code>.</p>
    <p>Substrings at different positions count separately, even if their text is the same.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5',
    's[i] is 0 or 1',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Split "000111" into runs of equal characters. Where do the counted substrings sit relative to those runs?',
    'Around one border between a run of 3 zeros and a run of 2 ones, how many counted substrings are there, and what limits that number?',
    'If you know the length of the previous run and the current run, what do you add when a run ends?',
    'Do you need to store every run, or only the last two lengths?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Group the string into maximal runs of the same character, for example
    <code>0011100</code> becomes runs 2, 3, 2. A counted substring is some zeros next to the same
    number of ones, so it always straddles exactly one border between two neighbouring runs: it
    takes <code>k</code> characters from the end of one run and <code>k</code> from the start of the
    next.</p>
    <h4>Why it works</h4>
    <p>For a border between runs of lengths <code>a</code> and <code>b</code>, every
    <code>k</code> from 1 to <code>min(a, b)</code> gives one valid substring, and no other
    substring touches that border. Each valid substring belongs to one border, so the answer is the
    sum of <code>min(a, b)</code> over all borders. Only the previous and the current run length are
    needed while scanning.</p>
    <h4>Complexity</h4>
    <p>O(n) time, one pass. O(1) space. Testing every substring takes about n^2 / 2 substrings,
    each with its own scan, which is far too slow for <code>n = 10^5</code>.</p>
    <h4>Pitfall</h4>
    <p>Do not count every substring with equal numbers of zeros and ones: <code>0110</code> has two
    of each but is not grouped. And remember the last border: the final run has no character after
    it to trigger the update, so add its <code>min</code> after the loop.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'countMatchingBlocks',
    params: [{ name: 's', type: 'string' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the binary string as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter s as a JSON string, for example "00110011".' };
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_LEN) return { ok: false, error: 's must be a string of 1 to 10^5 characters.' };
    if (!/^[01]+$/.test(s)) return { ok: false, error: 's may only contain the characters 0 and 1.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Runs of up to 64
  // characters: a check from every start scans a whole run each time, the run pass does not.
  growth: {
    target: 'n',
    n: 's.length',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => [runs(seed, n, 64)],
  },
};

export default problem;
