/**
 * Problem: Shoreline View
 *
 * Equivalent to LeetCode 1762; statement and tests are written for this project. A row of
 * buildings stands along a shore, with the sea past the last one. A building sees the sea when
 * every building to its right is strictly shorter. Return the indices of those buildings in
 * increasing order. One pass with a monotonic stack: a building that is at least as tall as the
 * ones on top of the stack blocks them for good.
 *
 * Classic wrong answers: a building the same height as the one in front still has no view (a
 * non-strict comparison keeps it), looking at only the next building, answering for a sea on the
 * left, returning the indices in decreasing order, and dropping the last building (which always
 * has a view).
 *
 * At 10^5 buildings, a strictly decreasing row (every building has a view) makes scanning to the
 * right of each building quadratic, so the max-size tests separate it from the linear pass.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_H = 1000000000;

/**
 * Reference: scan from the sea inward, remembering the tallest building seen so far.
 * @param {number[]} heights building heights from left to right
 * @returns {number[]} indices of the buildings that see the sea, increasing
 */
export function reference(heights) {
  const out = [];
  let tallest = 0;
  for (let i = heights.length - 1; i >= 0; i--) {
    if (heights[i] > tallest) {
      out.push(i);
      tallest = heights[i];
    }
  }
  return out.reverse();
}

/** `n` seeded heights in [1, hi]. */
function randomHeights(seed, n, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => 1 + Math.floor(rnd() * hi));
}

/** Strictly decreasing from the maximum height: every building sees the sea. */
const decreasing = (n) => Array.from({ length: n }, (_, i) => MAX_H - i * 7);

/** A decreasing trend with seeded noise, so some buildings are blocked by a slightly taller one. */
function noisyDecreasing(seed, n) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => MAX_H - 9000 - i * 9000 + Math.floor(rnd() * 9000));
}

const visible = [
  { args: [[4, 2, 3, 1]], expected: [0, 2, 3], note: 'Building 1 (height 2) is hidden behind 3; the others see the sea.' },
  { args: [[4, 3, 2, 1]], expected: [0, 1, 2, 3], note: 'Strictly decreasing: every building sees the sea.' },
  { args: [[1, 3, 2, 4]], expected: [3], note: 'The last building is the tallest, so it hides all the others.' },
  { args: [[2, 2, 2, 2]], expected: [3], note: 'An equal height still blocks the view.' },
  { args: [[3, 5, 5, 2, 1]], expected: [2, 3, 4], note: 'Of the two 5s only the right one sees the sea.' },
];

// Hidden tests: one building, two equal giants, strictly rising and falling rows, a plateau in
// the middle, a small-range random row (many equal heights), and four rows of 10^5 buildings
// (strictly decreasing, all equal, random, decreasing with noise).
const hiddenInputs = [
  [1],
  [MAX_H, MAX_H],
  [1, 2, 3, 4, 5, 6, 7, 8],
  [8, 7, 6, 5, 4, 3, 2, 1],
  [1, 5, 2, 5, 3, 4],
  randomHeights(7, 1000, 50),
  decreasing(MAX_N),
  Array(MAX_N).fill(MAX_H),
  randomHeights(11, MAX_N, MAX_H),
  noisyDecreasing(13, MAX_N),
];

export const problem = {
  id: 'shoreline-view',
  title: 'Shoreline View',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Monotonic Stack', 'Array Scan'],
  timeLimitMs: 2000,
  argNames: ['heights'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A row of <code>n</code> buildings stands along a shore, and the sea lies just past the last
    building (to the right). You are given their heights from left to right in
    <code>heights</code>.</p>
    <p>A building has a sea view when every building to its right is strictly shorter than it. A
    building of the same height blocks the view. Return the indices (starting at 0) of all buildings
    that have a sea view, in increasing order.</p>
  `,
  constraints: [
    '1 <= heights.length <= 10^5',
    '1 <= heights[i] <= 10^9',
    'Target complexity: O(n) time, O(n) extra space for the answer',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `heights = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which building always has a sea view, whatever the heights are?',
    'For one building, what do you need to know about everything to its right? Does it have to be every single height?',
    'If you walk from the sea inward, what single number summarizes all the buildings you have passed?',
    'Is a building that is the same height as the tallest one so far allowed in? How does the statement decide?',
    'Walking from the left instead, which earlier buildings can a new building rule out for good, and what structure lets you drop them from the back?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Walk from the sea inward and keep the tallest height seen so far. A building sees the sea
    exactly when it is strictly taller than that height; then it becomes the new tallest. Collect the
    indices and reverse them at the end. The same thing from the left is a monotonic stack: for each
    new building, pop every building on the stack that is not taller, then push it. What remains is
    the answer, already in increasing order.</p>
    <h4>Why it works</h4>
    <p>A building is blocked only by a building to its right that is at least as tall. Everything
    to the right of it is summarized by the tallest height there, so one number is enough. In the
    stack version, a building that arrives later and is at least as tall blocks everything it pops,
    forever.</p>
    <h4>Complexity</h4>
    <p>O(n) time, each building is pushed and popped at most once. O(n) space for the answer.
    Scanning to the right of every building is O(n^2): on a strictly decreasing row each building
    must look at all the others.</p>
    <h4>Pitfall</h4>
    <p>The comparison is strict: equal heights block the view, so <code>&gt;=</code> keeps buildings
    it should drop. Mind the order of the output too, a right-to-left scan produces it reversed.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'shorelineView',
    params: [{ name: 'heights', type: 'int[]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((heights) => ({ args: [heights], expected: reference(heights) })),

  /**
   * Custom input: the heights as a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let heights;
    try {
      heights = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the heights as a JSON array, for example [4,2,3,1].' };
    }
    if (!Array.isArray(heights) || heights.length < 1 || heights.length > MAX_N) return { ok: false, error: 'heights must have 1 to 10^5 values.' };
    if (!heights.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_H)) return { ok: false, error: 'Every height must be an integer from 1 to 10^9.' };
    return { ok: true, args: [heights] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Every 64th building is a
  // tall one in strictly decreasing order and the rest are 1, so a solution that scans to the right
  // of each building is n^2 (the tall ones see the whole row) while the answer stays about n / 64
  // values: the output does not decide the time.
  growth: {
    target: 'n',
    n: 'heights.length',
    sizes: [250000, 500000, 1000000, 2000000, 4000000, 8000000],
    input: (n) => [Array.from({ length: n }, (_, i) => (i % 64 === 0 ? 1000000000 - i : 1))],
  },
};

export default problem;
