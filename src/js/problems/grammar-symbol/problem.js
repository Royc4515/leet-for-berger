/**
 * Problem: Grammar Symbol
 *
 * Rows grow by rewriting 0 -> 01 and 1 -> 10, so row 30 has 2^29 symbols and building it is
 * hopeless. The recursion is on positions instead: symbol k of row n comes from symbol
 * ceil(k / 2) of row n - 1, unchanged when k is odd and flipped when k is even. Walking that
 * chain up to row 1 is at most 29 steps, and the answer is the parity of the flips, which is
 * also the parity of the 1 bits in k - 1.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: walk from position k up to the root, counting flips.
 * @param {number} n row number, 1-based
 * @param {number} k position in the row, 1-based, at most 2^(n-1)
 * @returns {number} 0 or 1
 */
export function reference(n, k) {
  let flips = 0;
  // Row n itself does not matter beyond bounding k: every row is a prefix of the next one.
  while (k > 1) {
    if (k % 2 === 0) flips ^= 1;
    k = Math.ceil(k / 2);
  }
  return flips;
}

const MAX_N = 30;

/** A seeded k in [1, 2^(n-1)]. */
const randomK = (seed, n) => 1 + Math.floor(mulberry32(seed)() * 2 ** (n - 1));

const visible = [
  { args: [1, 1], expected: 0, note: 'Row 1 is "0".' },
  { args: [2, 1], expected: 0, note: 'Row 2 is "01".' },
  { args: [2, 2], expected: 1, note: 'Row 2 is "01".' },
  { args: [3, 3], expected: 1, note: 'Row 3 is "0110".' },
  { args: [4, 6], expected: 0, note: 'Row 4 is "01101001".' },
];

// Hidden tests: the first and last symbol of row 30, positions one off a power of two (where
// off-by-one halving breaks), and seeded positions deep in rows 25 to 30 where building the
// row needs up to 2^29 symbols.
const hiddenArgs = [
  [3, 4],
  [5, 16],
  [10, 300],
  [MAX_N, 1],
  [MAX_N, 2 ** 29],
  [MAX_N, 2 ** 29 - 1],
  [MAX_N, 2 ** 28 + 1],
  [25, randomK(7, 25)],
  [MAX_N, randomK(11, MAX_N)],
  [MAX_N, randomK(13, MAX_N)],
];

export const problem = {
  id: 'grammar-symbol',
  title: 'Grammar Symbol',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Recursion', 'Divide and Conquer', 'Bit Manipulation'],
  timeLimitMs: 1000,
  argNames: ['n', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Build a table of rows of <code>0</code>s and <code>1</code>s. Row <code>1</code> is just
    <code>0</code>. Every later row is made from the row above it by replacing each
    <code>0</code> with <code>01</code> and each <code>1</code> with <code>10</code>. So row 2 is
    <code>01</code>, row 3 is <code>0110</code> and row 4 is <code>01101001</code>.</p>
    <p>Given <code>n</code> and <code>k</code>, return the <code>k</code>-th symbol (counting from
    <code>1</code>) of row <code>n</code>.</p>
  `,
  constraints: [
    '1 <= n <= 30',
    '1 <= k <= 2^(n - 1)',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(2, 5).map((t) => ({
    input: `n = ${t.args[0]}, k = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How long is row 30? Could you afford to build it?',
    'Which symbol in row n - 1 produced the k-th symbol of row n?',
    'Compare a parent symbol with the two symbols it turns into. When does the child match the parent, and when is it the opposite?',
    'If you keep asking for the parent until you reach row 1, what do you need to count along the way?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Never build a row. Symbol <code>k</code> of row <code>n</code> was produced by symbol
    <code>ceil(k / 2)</code> of the row above: it is the same as its parent when <code>k</code> is odd and
    the opposite when <code>k</code> is even. Follow that chain of parents up to row 1, counting flips.</p>
    <h4>Why it works</h4>
    <p>Each parent becomes two children, and the first child always copies it (<code>0</code> gives
    <code>01</code>, <code>1</code> gives <code>10</code>) while the second always flips it. Row 1 is
    <code>0</code>, so the answer is <code>0</code> flipped once per even position on the chain, which is
    the parity of the flip count. Note that <code>n</code> itself never enters the loop: it only bounds
    <code>k</code>.</p>
    <h4>Complexity</h4>
    <p>O(n) time, since <code>k</code> roughly halves each step and starts at most at
    <code>2^(n - 1)</code>, so there are at most 29 steps. O(1) space. Building row 30 would take 2^29
    symbols.</p>
    <h4>Pitfall</h4>
    <p>Positions are 1-based. Halving with <code>k / 2</code> rounded down sends odd positions to the wrong
    parent; the parent of <code>k</code> is <code>(k + 1) / 2</code> rounded down. Mixing a 0-based formula
    with the 1-based <code>k</code> gives the same off-by-one.</p>
  `,

  signature: {
    name: 'kthGrammar',
    params: [
      { name: 'n', type: 'int' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, n then k.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2 || !lines.every((l) => /^\d+$/.test(l))) return { ok: false, error: 'Enter two lines: n, then k, as whole numbers.' };
    const [n, k] = lines.map(Number);
    if (n < 1 || n > MAX_N) return { ok: false, error: 'n must be from 1 to 30.' };
    if (k < 1 || k > 2 ** (n - 1)) return { ok: false, error: 'k must be from 1 to 2^(n - 1), the length of row n.' };
    return { ok: true, args: [n, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
