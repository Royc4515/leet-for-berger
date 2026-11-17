/**
 * Problem: Rain Trap
 *
 * How much water stays on top of a bar skyline after rain. The water above a bar is decided by
 * the lower of the tallest walls on its two sides, and the two-pointer version notices that the
 * side with the lower current wall already knows its answer, so it needs no extra arrays.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: two pointers moving inward, always advancing the side with the lower wall.
 * @param {number[]} heights
 * @returns {number} total trapped water (can exceed 2^31, still exact as a double)
 */
export function reference(heights) {
  let lo = 0;
  let hi = heights.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (lo < hi) {
    if (heights[lo] <= heights[hi]) {
      leftMax = Math.max(leftMax, heights[lo]);
      water += leftMax - heights[lo];
      lo++;
    } else {
      rightMax = Math.max(rightMax, heights[hi]);
      water += rightMax - heights[hi];
      hi--;
    }
  }
  return water;
}

const MAX_N = 200000;
const MAX_H = 100000;

/** Seeded random heights in [0, maxH]. */
function randomHeights(seed, n, maxH) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * (maxH + 1)));
}

/** Rises to a single peak and falls again: no water at all, but every bar is scanned. */
function mountain(n) {
  const peak = Math.floor(n / 2);
  return Array.from({ length: n }, (_, i) => Math.floor(((i <= peak ? i : n - 1 - i) * MAX_H) / peak));
}

const visible = [
  { args: [[1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1, 0]], expected: 6, note: 'Water collects in the dips between taller bars.' },
  { args: [[5, 2, 1, 3, 2, 6]], expected: 12, note: 'The left wall of height 5 is the lower one, so it sets the level for the whole basin.' },
  { args: [[3]], expected: 0, note: 'A single bar cannot hold water.' },
  { args: [[1, 2, 3, 4, 5]], expected: 0, note: 'A staircase has no right wall, so the water runs off.' },
  { args: [[3, 0, 0, 2, 0, 4]], expected: 10, note: 'Inner bars lower than the level are submerged too.' },
];

// Hidden tests: a lower right wall, a descending staircase, a sawtooth, and 2 * 10^5 bars where
// an answer above 2^31 overflows 32-bit counters and a per-bar scan of both sides times out.
const hiddenArgs = [
  [[2, 0, 2]],
  [[5, 4, 3, 2, 1]],
  [[4, 2, 3]],
  [[0, 0, 0, 0]],
  [[5, 1, 1, 1, 1, 9, 1, 1, 1, 4]],
  [randomHeights(7, 1000, 50)],
  [[MAX_H, ...new Array(MAX_N - 2).fill(0), MAX_H]],
  [randomHeights(11, MAX_N, MAX_H)],
  [mountain(MAX_N)],
  [Array.from({ length: MAX_N }, (_, i) => (i % 2 === 0 ? MAX_H : 0))],
];

export const problem = {
  id: 'rain-trap',
  title: 'Rain Trap',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Prefix Maximum'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['heights'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A row of bars of width 1 stands side by side; <code>heights[i]</code> is the height of
    bar <code>i</code>. After a heavy rain, water settles wherever it is held in by taller bars
    on both sides. Anything that is not enclosed on both sides flows away over the edges.</p>
    <p>Return the total number of unit squares of water that stay trapped.</p>
    <p>The total can exceed the 32-bit range, so return it as a 64-bit integer.</p>
  `,
  constraints: [
    '1 <= heights.length <= 2 * 10^5',
    '0 <= heights[i] <= 10^5',
    'The answer can reach about 2 * 10^10 (use a 64-bit integer)',
    'Target complexity: O(n) time, O(1) extra space for the two-pointer version',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `heights = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Look at one bar on its own. What decides how high the water above it can rise?',
    'If you knew the tallest bar to its left and the tallest bar to its right, how much water sits on it?',
    'Could you compute those two maximums for every position in two passes instead of rescanning each time?',
    'With one pointer at each end, when do you already know the answer for the bar on the lower side?',
    'How large can the total get with 2 * 10^5 bars of height 10^5, and what type holds it?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'trapRain',
    params: [{ name: 'heights', type: 'int[]' }],
    returns: 'long',
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
      return { ok: false, error: 'Enter heights as a JSON array, for example [0,2,0,1].' };
    }
    if (!Array.isArray(heights) || heights.length < 1 || heights.length > MAX_N) return { ok: false, error: 'heights must have 1 to 2 * 10^5 elements.' };
    if (!heights.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_H)) return { ok: false, error: 'Heights must be integers from 0 to 10^5.' };
    return { ok: true, args: [heights] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
