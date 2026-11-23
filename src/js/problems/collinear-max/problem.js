/**
 * Problem: Collinear Max
 *
 * Equivalent to LeetCode 149 (Max Points on a Line); statement and tests are written for this
 * project. Fix one point as an anchor: every other point lies on exactly one line through it, named
 * by the direction (dx, dy) reduced by their gcd and given a canonical sign. The largest group of
 * equal directions, plus the anchor, is the best line through that anchor; the best over all
 * anchors is the answer. O(n^2) with a hash map per anchor.
 *
 * Classic wrong answers: directions not reduced by the gcd ((2, 2) and (1, 1) are the same line),
 * reduced but without a canonical sign ((1, -1) and (-1, 1) are the same line), forgetting that a
 * single point is a line of 1, and floating-point slopes in languages where -0.0 and 0.0 hash
 * differently (Java's Double). Checking every pair against every point is O(n^3).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt } from '../../engine/growth-inputs.js';

const MAX_N = 300;
const LIMIT = 10000;

/**
 * Reference: exact collinearity by cross products over every pair (O(n^3), independent of the
 * slope-hashing solutions; n is at most 300).
 * @param {number[][]} points
 * @returns {number}
 */
export function reference(points) {
  const n = points.length;
  if (n <= 2) return n;
  let best = 2;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const [x1, y1] = points[i];
      const dx = points[j][0] - x1;
      const dy = points[j][1] - y1;
      let count = 0;
      for (let k = 0; k < n; k++) if (dx * (points[k][1] - y1) - dy * (points[k][0] - x1) === 0) count++;
      if (count > best) best = count;
    }
  }
  return best;
}

/** n distinct random points in [lo, hi]^2, seeded. */
function randomPoints(seed, n, lo = -LIMIT, hi = LIMIT) {
  const rnd = mulberry32(seed);
  const seen = new Set();
  const out = [];
  while (out.length < n) {
    const p = [randInt(rnd, lo, hi), randInt(rnd, lo, hi)];
    const key = `${p[0]},${p[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/** Random points plus `onLine` points on y = slopeNum / slopeDen * x + 3 (kept distinct). */
function withLine(seed, n, onLine, slopeNum, slopeDen) {
  const line = [];
  for (let t = -Math.floor(onLine / 2); line.length < onLine; t++) line.push([slopeDen * t, slopeNum * t + 3]);
  const taken = new Set(line.map((p) => `${p[0]},${p[1]}`));
  const rest = randomPoints(seed, n, -LIMIT, LIMIT).filter((p) => !taken.has(`${p[0]},${p[1]}`)).slice(0, n - onLine);
  return [...line, ...rest].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
}

const visible = [
  { args: [[[1, 1], [2, 2], [3, 3]]], expected: 3, note: 'All three points lie on y = x.' },
  { args: [[[1, 1], [3, 2], [5, 3], [4, 1], [2, 3], [1, 4]]], expected: 4, note: '(3, 2), (4, 1), (2, 3) and (1, 4) lie on x + y = 5.' },
  { args: [[[0, 0]]], expected: 1, note: 'One point is always on a line of its own.' },
  { args: [[[0, 0], [2, 4], [1, 2], [3, 5]]], expected: 3, note: 'Directions (1, 2) and (2, 4) are the same line once reduced.' },
  { args: [[[5, 1], [5, 7], [5, -3], [2, 2]]], expected: 3, note: 'A vertical line: dx is 0 for the three points with x = 5.' },
];

// Hidden tests: two points, 300 points on one line y = x, 300 points on a horizontal line, 300
// random points (the best line is usually 2 or 3), 300 points with 40 of them on a line of slope
// -3/7 hidden among random ones, a vertical line and a horizontal line crossing, points on a line
// whose reduced direction needs the sign fix ((1, -1) against (-1, 1)), slopes that differ by about
// 10^-8 at the edge of the range, a small random grid, and the four corners with the centre.
const hiddenArgs = [
  [[[-10000, 10000], [10000, -10000]]],
  [Array.from({ length: MAX_N }, (_, i) => [i * 33 - 4950, i * 33 - 4950])],
  [Array.from({ length: MAX_N }, (_, i) => [i * 60 - 9000, -7])],
  [randomPoints(149, MAX_N)],
  [withLine(150, MAX_N, 40, -3, 7)],
  [[...Array.from({ length: 30 }, (_, i) => [4, i - 15]), ...Array.from({ length: 30 }, (_, i) => [i - 10, 6]).filter((p) => p[0] !== 4)]],
  [[[0, 0], [1, -1], [-1, 1], [2, -2], [-2, 2], [3, 3], [0, 5]]],
  [[[0, 0], [9999, 10000], [9998, 9999], [-9999, -10000], [1, 2]]],
  [randomPoints(151, 60, -4, 4)],
  [[[-10000, -10000], [10000, 10000], [-10000, 10000], [10000, -10000], [0, 0]]],
];

export const problem = {
  id: 'collinear-max',
  title: 'Collinear Max',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Geometry', 'Hash Map', 'GCD'],
  timeLimitMs: 2000,
  argNames: ['points'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array <code>points</code> of distinct points in the plane, where
    <code>points[i] = [x<sub>i</sub>, y<sub>i</sub>]</code>.</p>
    <p>Return the largest number of the given points that lie on one straight line.</p>
  `,
  constraints: [
    '1 <= points.length <= 300',
    'points[i].length == 2',
    '-10^4 <= x_i, y_i <= 10^4',
    'All points are distinct',
    'Target complexity: O(n^2)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `points = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you fix one point, what single property tells you whether two other points are on the same line through it?',
    'Slopes as floating-point numbers can be risky. How can you describe a direction exactly with two integers?',
    '(2, 4) and (1, 2) point the same way. How do you make sure equal directions get equal keys? What about (1, -1) and (-1, 1)?',
    'Which directions need special care: vertical lines, horizontal lines?',
    'What should you return when there is only one point?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Fix an anchor point. Every other point is on exactly one line through the anchor, given by the direction
    <code>(dx, dy)</code> from the anchor to it. Count points per direction in a hash map; the largest count plus
    one (the anchor) is the best line through that anchor. Take the best over all anchors.</p>
    <h4>Why it works</h4>
    <p>Two points are on the same line through the anchor exactly when their directions are multiples of each
    other. Dividing <code>(dx, dy)</code> by <code>gcd(|dx|, |dy|)</code> and flipping the sign so that
    <code>dx &gt; 0</code> (or <code>dx = 0</code> and <code>dy &gt; 0</code>) gives every line through the anchor
    one exact integer key: no floating point, and vertical and horizontal lines need no special case.</p>
    <h4>Complexity</h4>
    <p>O(n^2) direction keys, each in O(log C) for the gcd, with an O(n) map per anchor. Checking every pair against
    every point is O(n^3), which is fine for 300 points but grows a power of n faster.</p>
    <h4>Pitfall</h4>
    <p>Without the gcd, (2, 4) and (1, 2) look different. Without the canonical sign, (1, -1) and (-1, 1) look
    different. Floating-point slopes can work, but in Java a <code>Double</code> key keeps -0.0 and 0.0 apart, so
    horizontal lines split. A single point is a line of 1, not 0 or 2.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maxPoints',
    params: [{ name: 'points', type: 'int[][]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one JSON array of distinct [x, y] points.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let points;
    try {
      points = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter a JSON array of [x, y] points, e.g. [[1,1],[2,2],[3,3]].' };
    }
    if (!Array.isArray(points) || points.length < 1 || points.length > MAX_N) return { ok: false, error: 'points must hold 1 to 300 pairs.' };
    const ok = (p) => Array.isArray(p) && p.length === 2 && p.every((v) => Number.isInteger(v) && v >= -LIMIT && v <= LIMIT);
    if (!points.every(ok)) return { ok: false, error: 'Each point is [x, y] with integers from -10^4 to 10^4.' };
    if (new Set(points.map((p) => `${p[0]},${p[1]}`)).size !== points.length) return { ok: false, error: 'The points must be distinct.' };
    return { ok: true, args: [points] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Distinct random points: almost every direction is unique, so every anchor fills its map with
  // n - 1 keys and nothing can stop early. The size passes 300 on purpose (lengths may exceed the
  // limit; coordinates stay inside it) so the quadratic growth is measurable.
  growth: {
    target: 'n^2',
    n: 'points.length',
    sizes: [125, 250, 500, 1000],
    input: (n, seed) => [randomPoints(seed, n)],
  },
};

export default problem;
