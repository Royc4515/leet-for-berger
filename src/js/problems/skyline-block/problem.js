/**
 * Problem: Skyline Block
 *
 * Equivalent to LeetCode 84; statement and tests are written for this project. Bars of width 1 side
 * by side; find the largest rectangle that fits inside them. For each bar as the shortest bar of the
 * rectangle, the rectangle reaches left and right until a lower bar. A stack of bar indexes with
 * strictly increasing heights finds both limits at once: a bar that is lower than the top pops it,
 * and at that moment the popped bar's right limit is the current index and its left limit is the new
 * top of the stack.
 *
 * Classic wrong answers: expanding left and right from every bar (O(n^2), 10^10 steps on 10^5 equal
 * bars), forgetting the bars still on the stack at the end (an ascending skyline answers 0 or too
 * little), a width that is off by one, and looking only at one or two bars. The largest area is
 * 10^4 * 10^5 = 10^9 and fits in a 32-bit int.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_H = 10000;

/**
 * Reference: monotonic stack of indexes with increasing heights, and a zero-height sentinel at the
 * end that pops everything.
 * @param {number[]} heights
 * @returns {number}
 */
export function reference(heights) {
  const stack = [];
  let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];
    while (stack.length && heights[stack[stack.length - 1]] >= h) {
      const height = heights[stack.pop()];
      // The popped bar spans everything between the new top (exclusive) and i (exclusive).
      const left = stack.length ? stack[stack.length - 1] : -1;
      best = Math.max(best, height * (i - left - 1));
    }
    stack.push(i);
  }
  return best;
}

/** Seeded heights in [lo, hi]. */
function randomHeights(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[2, 1, 5, 6, 2, 3]], expected: 10, note: 'The bars of height 5 and 6 side by side hold a 5 x 2 rectangle.' },
  { args: [[2, 4]], expected: 4, note: 'Either the single bar of 4, or both bars at height 2 (2 x 2): the area is 4.' },
  { args: [[6, 6, 6]], expected: 18, note: 'Equal bars join into one wide rectangle.' },
  { args: [[4, 0, 4]], expected: 4, note: 'A bar of height 0 splits the skyline; nothing can cross it.' },
  { args: [[5, 4, 3, 2, 1]], expected: 9, note: 'Three bars at height 3 give 9, better than the single 5.' },
];

// Hidden tests: one bar, the tallest bar, zeros between bars, an ascending skyline (bars left on the
// stack at the end), a random mix, and at max size (10^5 bars): all bars of height 10^4 (area 10^9,
// and expanding from every bar is 5 * 10^9 steps), a staircase going up, random heights, random
// heights in 1..3 (many equal bars), and a deep valley.
const hiddenArgs = [
  [[1]],
  [[MAX_H]],
  [[1, 0, 1, 0, 1]],
  [[2, 3, 4, 5, 6]],
  [randomHeights(3, 1000, 0, 10)],
  [new Array(MAX_N).fill(MAX_H)],
  [Array.from({ length: MAX_N }, (_, i) => 1 + Math.floor((i * MAX_H) / MAX_N))],
  [randomHeights(11, MAX_N, 0, MAX_H)],
  [randomHeights(13, MAX_N, 1, 3)],
  [Array.from({ length: MAX_N }, (_, i) => 1 + Math.floor((Math.abs(i - MAX_N / 2) * (MAX_H - 1)) / (MAX_N / 2)))],
];

export const problem = {
  id: 'skyline-block',
  title: 'Skyline Block',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Stack', 'Monotonic Stack'],
  timeLimitMs: 2000,
  argNames: ['heights'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A skyline is drawn as bars of width <code>1</code> standing side by side, and
    <code>heights[i]</code> is the height of bar <code>i</code>. Find the area of the largest
    rectangle that fits completely inside the bars: it spans one or more neighbouring bars, and its
    height cannot exceed the shortest of them.</p>
    <p>Return that area.</p>
  `,
  constraints: [
    '1 <= heights.length <= 10^5',
    '0 <= heights[i] <= 10^4',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `heights = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Suppose the shortest bar of the best rectangle is bar i. How far can the rectangle reach to the left and to the right?',
    'Checking every bar by walking outwards costs how much when all 100,000 bars are equal?',
    'What do you need for each bar: the nearest lower bar on its left and the nearest lower bar on its right. Can one pass find both?',
    'While scanning, which earlier bars are still waiting for their right limit? What order are their heights in?',
    'What happens to the bars still waiting when the scan reaches the end of the skyline?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Every rectangle is limited by its shortest bar, so for each bar <code>i</code> compute the
    widest rectangle whose height is <code>heights[i]</code>: it extends left and right until a
    bar that is lower. Keep a stack of indexes whose heights increase from bottom to top. When bar
    <code>i</code> is not taller than the top bar, that top bar can go no further to the right: pop
    it, take the new top of the stack as its left limit, and its width is
    <code>i - left - 1</code>. After the scan, treat the end as a bar of height 0 so everything
    left on the stack is popped too.</p>
    <h4>Why it works</h4>
    <p>The stack holds exactly the bars that have no lower bar to their right yet, and each bar
    on it has the previous stack entry as its nearest lower bar on the left (anything between them
    was popped for being at least as tall). So a popped bar knows both limits when it leaves. Each
    bar is pushed once and popped once.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(n) space.</p>
    <h4>Pitfall</h4>
    <p>Skipping the final flush loses every rectangle ending at the right edge, as in an
    ascending skyline. When the stack becomes empty the left limit is -1, not 0, so the width is
    <code>i</code>. Walking outwards from every bar is correct but quadratic: on 10<sup>5</sup> equal
    bars it does about 5 * 10<sup>9</sup> steps.</p>
  `,

  // Neutral signature: starter code for all 8 languages is generated from it.
  signature: {
    name: 'largestBlock',
    params: [{ name: 'heights', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

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
      return { ok: false, error: 'Enter the heights as a JSON array, for example [2,1,5,6,2,3].' };
    }
    if (!Array.isArray(heights) || heights.length < 1 || heights.length > MAX_N) return { ok: false, error: 'Give 1 to 10^5 heights.' };
    if (!heights.every((h) => Number.isInteger(h) && h >= 0 && h <= MAX_H)) return { ok: false, error: 'Every height must be an integer from 0 to 10^4.' };
    return { ok: true, args: [heights] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random heights: the stack grows and collapses all along the array, and each bar is pushed and popped once.
  growth: {
    target: 'n',
    n: 'heights.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 0, max: 1e4 })],
  },
};

export default problem;
