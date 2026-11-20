/**
 * Problem: Undo Running Xor
 *
 * Equivalent to LeetCode 2433 with larger limits; statement and tests are written for this
 * project. pref[i] is the XOR of arr[0..i]; recover arr. XOR is its own inverse, so
 * pref[i] ^ pref[i - 1] cancels everything before position i and leaves arr[i]: the XOR
 * analogue of recovering values from running sums by subtraction.
 *
 * Classic wrong answers: XORing with the previous output instead of the previous prefix
 * (pref[i] ^ arr[i - 1]), and subtracting (pref[i] - pref[i - 1]), which only works for sums.
 * Rebuilding each prefix from the answer so far is correct but O(n^2), about 5 * 10^9 XORs at
 * 10^5 elements.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_V = 1000000000;

/**
 * Reference: each element is the XOR of two neighboring prefixes.
 * @param {number[]} pref running XORs
 * @returns {number[]} the original array
 */
export function reference(pref) {
  // don't touch / the first element equals pref[0]; pref[-1] is the empty XOR, 0, so one rule fits all.
  return pref.map((v, i) => (i === 0 ? v : v ^ pref[i - 1]));
}

/** n seeded values in [lo, hi]. */
function randomValues(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[5, 2, 0, 3, 1]], expected: [5, 7, 2, 3, 2], note: 'arr = [5, 7, 2, 3, 2]: 5, 5^7 = 2, 2^2 = 0, 0^3 = 3, 3^2 = 1 gives back [5, 2, 0, 3, 1].' },
  { args: [[13]], expected: [13], note: 'One element is its own prefix.' },
  { args: [[7, 7, 7, 7]], expected: [7, 0, 0, 0], note: 'The prefix never changes, so every later element is 0.' },
  { args: [[1, 3, 2]], expected: [1, 2, 1], note: '1, 1^2 = 3, 3^1 = 2.' },
  { args: [[0, 0, 0]], expected: [0, 0, 0], note: 'All zeros.' },
];

// Hidden tests: a single zero, two elements, an alternating prefix, small seeded arrays, and five
// arrays at the maximum 10^5 elements (random values to 10^9, a constant maximum, a ramp, a wide
// random spread and a sparse one), where rebuilding prefixes from scratch needs about 5 * 10^9 XORs.
const hiddenArgs = [
  [[0]],
  [[MAX_V, 0]],
  [[6, 9, 6, 9, 6, 9]],
  [randomValues(7, 12, 0, 15)],
  [randomValues(11, 200, 0, MAX_V)],
  [randomValues(13, MAX_N, 0, MAX_V)],
  [Array(MAX_N).fill(MAX_V)],
  [Array.from({ length: MAX_N }, (_, i) => i)],
  [randomValues(17, MAX_N, 0, 1000)],
  [randomValues(19, MAX_N, 0, 1)],
];

export const problem = {
  id: 'undo-running-xor',
  title: 'Undo Running Xor',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Bit Manipulation', 'XOR', 'Prefix'],
  timeLimitMs: 2000,
  argNames: ['pref'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A hidden array <code>arr</code> was turned into an array <code>pref</code> of the same length
    by writing down running XORs:</p>
    <p><code>pref[i] = arr[0] ^ arr[1] ^ ... ^ arr[i]</code></p>
    <p>You are given <code>pref</code>. Return the array <code>arr</code>. Exactly one array fits.</p>
  `,
  constraints: [
    '1 <= pref.length <= 10^5',
    '0 <= pref[i] <= 10^9',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `pref = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which value of arr can you read straight off pref without any work?',
    'What is pref[i] ^ pref[i - 1] in terms of arr? Write both sides out as XORs of arr values.',
    'What happens when you XOR a value with itself, and with 0?',
    'If you rebuilt the prefix from the answer so far at every index, how many XORs would you do in total, and can the work be shared?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Two neighboring prefixes differ by exactly one element:
    <code>pref[i] = pref[i - 1] ^ arr[i]</code>. XOR both sides with <code>pref[i - 1]</code> and the
    equal terms cancel, leaving <code>arr[i] = pref[i] ^ pref[i - 1]</code>. The first element is
    <code>pref[0]</code> (nothing comes before it).</p>
    <h4>Why it works</h4>
    <p>XOR is its own inverse: <code>x ^ x = 0</code> and <code>x ^ 0 = x</code>, and the order of the
    terms does not matter. So <code>pref[i - 1]</code>, which is every element before i XORed
    together, removes itself from <code>pref[i]</code>.</p>
    <h4>Complexity</h4>
    <p>O(n) time; the output array is the only extra space.</p>
    <h4>Pitfall</h4>
    <p>XORing with the previous <em>answer</em> (<code>pref[i] ^ arr[i - 1]</code>) removes only one
    element, not the whole prefix. Subtracting (<code>pref[i] - pref[i - 1]</code>) is the
    running-sum recovery and gives other numbers here. Recomputing each prefix of the answer from
    scratch is correct but takes about 5 * 10^9 XORs at 10^5 elements.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'undoRunningXor',
    params: [{ name: 'pref', type: 'int[]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: pref as a JSON array, for example [5,2,0,3,1].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let pref;
    try {
      pref = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter pref as a JSON array, for example [5,2,0,3,1].' };
    }
    if (!Array.isArray(pref) || pref.length < 1 || pref.length > MAX_N) return { ok: false, error: 'pref must have 1 to 10^5 values.' };
    if (!pref.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_V)) return { ok: false, error: 'Values must be integers from 0 to 10^9.' };
    return { ok: true, args: [pref] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Any prefix values below 2^30; the pass reads each neighbour pair once and builds a result of the same length.
  growth: {
    target: 'n',
    n: 'pref.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 0, max: 1e9 })],
  },
};

export default problem;
