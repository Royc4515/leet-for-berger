/**
 * Problem: Two Wall Tank
 *
 * Pick two walls of a row; the water they hold is the shorter wall times the distance between
 * them. Find the most water. The two-pointer classic: start at both ends and always move the
 * shorter wall inward, because that wall can never do better with any closer partner.
 *
 * Limits: up to 10^5 walls, so the O(n^2) check of every pair (about 5 * 10^9 pairs) times out.
 * Heights stay at most 10^4 so the answer (at most 10^4 * (10^5 - 1)) fits in a 32-bit int.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_H = 10000;

/**
 * Reference O(n): two pointers moving inward, always from the shorter side.
 * @param {number[]} heights
 * @returns {number}
 */
export function reference(heights) {
  let l = 0;
  let r = heights.length - 1;
  let best = 0;
  while (l < r) {
    best = Math.max(best, Math.min(heights[l], heights[r]) * (r - l));
    if (heights[l] < heights[r]) l++;
    else r--;
  }
  return best;
}

/** Seeded random heights; `maxH` keeps some tests low so ties and zeros show up. */
function randomHeights(seed, n, maxH) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * (maxH + 1)));
}

/** A valley: high at both ends, low in the middle, so the widest pair is the answer. */
function valley(n) {
  return Array.from({ length: n }, (_, i) => Math.min(MAX_H, Math.abs(i - (n >> 1)) >> 3));
}

/**
 * Two tall walls side by side in the middle, two medium walls at the far ends, noise between:
 * "take the two tallest walls" loses to the wide medium pair.
 */
function tallPairInMiddle(seed, n) {
  const h = randomHeights(seed, n, 50);
  h[0] = 3000;
  h[n - 1] = 3000;
  h[n >> 1] = MAX_H;
  h[(n >> 1) + 1] = MAX_H;
  return h;
}

const visible = [
  { args: [[2, 7, 4, 1, 6, 3, 7, 2, 5]], expected: 35, note: 'The two walls of height 7 at indices 1 and 6: 7 * 5 = 35.' },
  { args: [[3, 3]], expected: 3, note: 'Two walls of height 3, one apart.' },
  { args: [[1, 9, 9, 1]], expected: 9, note: 'The tall middle pair beats the wide short pair (1 * 3 = 3).' },
  { args: [[5, 1, 1, 1, 1, 5]], expected: 25, note: 'The outer walls hold 5 * 5 = 25.' },
  { args: [[0, 4, 0]], expected: 0, note: 'Every pair includes a wall of height 0.' },
];

// Hidden tests: the smallest rows, zeros, monotone rows (one pointer must walk all the way),
// a case where the two tallest walls are the wrong pair, random rows, and four rows at 10^5.
const hiddenInputs = [
  [1, 1],
  [0, 0],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  tallPairInMiddle(5, 300),
  randomHeights(7, 200, 20),
  randomHeights(11, MAX_N, MAX_H),
  Array.from({ length: MAX_N }, () => MAX_H),
  valley(MAX_N),
  tallPairInMiddle(13, MAX_N),
];

export const problem = {
  id: 'two-wall-tank',
  title: 'Two Wall Tank',
  difficulty: 'Medium',
  topics: ['arrays-strings', 'greedy'],
  patterns: ['Two Pointers', 'Greedy'],
  timeLimitMs: 2000,
  argNames: ['heights'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A row of vertical walls stands on flat ground, one unit apart. <code>heights[i]</code> is the
    height of wall <code>i</code>.</p>
    <p>Choose any two walls. Together with the ground they form a tank, and the water it holds is
    the height of the <em>shorter</em> wall times the distance between the two walls
    (<code>j - i</code> for walls <code>i &lt; j</code>). Walls between them do not get in the way.</p>
    <p>Return the largest amount of water any pair of walls can hold.</p>
  `,
  constraints: [
    '2 <= heights.length <= 10^5',
    '0 <= heights[i] <= 10^4',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `heights = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which pair of walls is the widest possible? What does it hold?',
    'If you give up some width by moving one end inward, which end could possibly lead to more water?',
    'Can the shorter of the two current walls ever hold more water with any partner closer than the one it has now?',
    'Once you can rule out one wall per step, how many steps does the whole search take?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Start with the widest tank: the first and last walls. Record its water, then move the
    <em>shorter</em> of the two walls one step inward, and repeat until the two ends meet. The best
    value seen is the answer.</p>
    <h4>Why it works</h4>
    <p>Say the left wall is the shorter one. Every tank that uses it with a right wall closer than the
    current one is narrower, and its water is still capped by the left wall's height, so none of them
    can beat the tank just measured. The left wall can be dropped for good. Each step discards one
    wall this way without skipping the best pair.</p>
    <h4>Complexity</h4>
    <p>O(n) time: every step moves one end, so there are n - 1 steps. O(1) extra space. Trying every
    pair is O(n^2), about 5 * 10^9 pairs at n = 10^5.</p>
    <h4>Pitfall</h4>
    <p>Moving the taller wall instead. The water is limited by the shorter wall, so moving the taller
    one can only shrink the width while the cap stays the same, and the best pair gets skipped. On a
    tie either side may move.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'maxWater',
    params: [{ name: 'heights', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((heights) => ({ args: [heights], expected: reference(heights) })),

  /**
   * Custom input: the heights as one JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let heights;
    try {
      heights = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the heights as a JSON array, for example [2,7,4,1,6].' };
    }
    if (!Array.isArray(heights) || heights.length < 2 || heights.length > MAX_N) {
      return { ok: false, error: 'heights must be an array of 2 to 10^5 integers.' };
    }
    if (!heights.every((h) => Number.isInteger(h) && h >= 0 && h <= MAX_H)) {
      return { ok: false, error: 'Each height is an integer from 0 to 10^4.' };
    }
    return { ok: true, args: [heights] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random heights: the two pointers drop one wall per step until they meet, so every wall is visited.
  growth: {
    target: 'n',
    n: 'heights.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 0, max: 1e4 })],
  },
};

export default problem;
