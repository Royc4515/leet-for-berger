/**
 * Problem: View Cone
 *
 * Equivalent to LeetCode 1610 (Maximum Number of Visible Points); statement and tests are written
 * for this project. Turn every point (other than the viewer's own spot) into its polar angle around
 * the viewer, sort the angles, and slide a window whose width is the view angle. Appending every
 * angle again plus 2 * pi lets the window wrap past the negative x axis. Points standing on the
 * viewer are visible in every direction and are added on top.
 *
 * Angles come from atan2, whose last bit can differ between languages, so a point exactly on the
 * edge of the view must not depend on rounding: every solution, and the reference, treats an angle
 * difference within 1e-9 of the view angle as inside. With integer coordinates up to 100, two
 * different directions differ by far more than that (about 2.5 * 10^-5 radians at least).
 *
 * Classic wrong answers: no wrap-around (a view facing west splits into two ends of the sorted
 * list), giving the points on the viewer the angle atan2(0, 0) = 0 instead of counting them
 * separately, a strict comparison that drops points on the edge, and trying every starting point
 * with a linear scan (O(n^2), which times out at 10^5 points).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_C = 100;
// don't touch / the same tolerance is in every shipped solution: points on the edge of the view
// count as visible even when atan2 rounds them a hair outside.
const EPS = 1e-9;

/**
 * Reference: sorted polar angles, doubled for wrap-around, and a sliding window.
 * @param {number[][]} points
 * @param {number} angle view width in degrees
 * @param {number[]} location
 * @returns {number} the most points visible at once
 */
export function reference(points, angle, location) {
  const [x, y] = location;
  let here = 0;
  const angles = [];
  for (const [px, py] of points) {
    if (px === x && py === y) here++;
    else angles.push(Math.atan2(py - y, px - x));
  }
  angles.sort((a, b) => a - b);
  const m = angles.length;
  for (let i = 0; i < m; i++) angles.push(angles[i] + 2 * Math.PI);
  const width = (angle * Math.PI) / 180;
  let best = 0;
  for (let i = 0, j = 0; j < 2 * m; j++) {
    while (angles[j] - angles[i] > width + EPS) i++;
    best = Math.max(best, Math.min(m, j - i + 1));
  }
  return best + here;
}

/** n points with coordinates from 0 to 100, seeded. */
function randomPoints(seed, n, { lo = 0, hi = MAX_C } = {}) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => [randInt(rnd, lo, hi), randInt(rnd, lo, hi)]);
}

const visible = [
  { args: [[[2, 1], [2, 2], [3, 3]], 90, [1, 1]], expected: 3, note: 'All three points lie within 90 degrees of each other as seen from (1, 1).' },
  { args: [[[2, 1], [2, 2], [3, 4], [1, 1]], 90, [1, 1]], expected: 4, note: 'The point on the viewer at (1, 1) is visible whichever way you face.' },
  { args: [[[1, 0], [2, 1]], 13, [1, 1]], expected: 1, note: 'The two points are 90 degrees apart, so a 13-degree view sees one of them.' },
  { args: [[[0, 1], [2, 1], [1, 2], [1, 0]], 180, [1, 1]], expected: 3, note: 'Three of the four compass points fit in a half turn; the edges of the view count.' },
  { args: [[[0, 0], [0, 2], [0, 1]], 60, [2, 1]], expected: 3, note: 'Facing west, the view wraps past the -x axis, where angles jump from pi to -pi; the three points span about 53 degrees.' },
];

// Hidden tests: every point on the viewer (visible with angle 0), a zero-degree view along a line of
// points behind each other, a 359-degree view (it sees every direction, but each point only once), 10^5 random points
// with a 90-degree view from the centre, 10^5 random points with a narrow 1-degree view from a corner,
// 10^5 points with many duplicates and a wide view, a ring of points facing west across the wrap
// line, the four compass points with a 90-degree view (two exactly on the edges), a mix of points
// on the viewer and around it, and a small random case.
const hiddenArgs = [
  [[[5, 5], [5, 5], [5, 5]], 0, [5, 5]],
  [[[1, 1], [2, 2], [3, 3], [4, 4], [2, 3], [0, 0]], 0, [0, 0]],
  [[[1, 0], [0, 1], [0, 0], [1, 1], [2, 0]], 359, [1, 0]],
  [randomPoints(1610, MAX_N), 90, [50, 50]],
  [randomPoints(1611, MAX_N), 1, [0, 0]],
  [randomPoints(1612, MAX_N, { lo: 40, hi: 60 }), 200, [50, 50]],
  [Array.from({ length: 2000 }, (_, i) => [i % 2 === 0 ? 0 : 1, (i * 37) % 101]), 45, [100, 50]],
  [[[51, 50], [50, 51], [49, 50], [50, 49]], 90, [50, 50]],
  [[[3, 3], [3, 3], [4, 3], [3, 4], [2, 2], [10, 3]], 45, [3, 3]],
  [randomPoints(1613, 40, { lo: 0, hi: 8 }), 60, [4, 4]],
];

export const problem = {
  id: 'view-cone',
  title: 'View Cone',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Geometry', 'Sorting', 'Sliding Window', 'Circular Array'],
  timeLimitMs: 3000,
  argNames: ['points', 'angle', 'location'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You stand at <code>location = [x, y]</code> on a plane and cannot move, but you can turn to face any
    direction. Your view is a cone of <code>angle</code> degrees: facing direction <code>d</code>, you see every
    point whose direction from you is within <code>angle / 2</code> degrees of <code>d</code> on either side.
    The edges of the cone are included.</p>
    <p>You are given <code>points</code>, where <code>points[i] = [x<sub>i</sub>, y<sub>i</sub>]</code>.
    Several points may share a position, and a point may stand exactly where you are; such a point is
    visible whichever way you face. Points never block each other.</p>
    <p>Return the largest number of points you can see at once.</p>
  `,
  constraints: [
    '1 <= points.length <= 10^5',
    'points[i].length == 2 and location.length == 2',
    '0 <= angle < 360',
    '0 <= x_i, y_i, x, y <= 100',
    'Target complexity: O(n log n)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `points = ${JSON.stringify(t.args[0])}, angle = ${t.args[1]}, location = ${JSON.stringify(t.args[2])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Does the distance of a point from you matter, or only its direction?',
    'How can you turn each point into a single number describing its direction?',
    'Once those numbers are sorted, what does a view of width angle cover in the sorted list?',
    'What happens to a view that faces left, across the line where the direction jumps from 180 degrees to -180? How can you make that window contiguous?',
    'Which points have no direction at all, and how should they be counted?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Only directions matter, so replace every point by its polar angle around you,
    <code>atan2(y<sub>i</sub> - y, x<sub>i</sub> - x)</code>. Sort the angles. A view of width
    <code>angle</code> then covers a contiguous run of the sorted list, and a sliding window finds the longest
    run whose first and last angle are at most the width apart.</p>
    <h4>Why it works</h4>
    <p>The angles run from -pi to pi, so a view facing left wraps from the end of the list to the start. Append
    every angle again with 2 * pi added: every wrapping view is now a contiguous window. Points standing on you
    have no direction (atan2 of 0, 0 is meaningless here), so set them aside and add them to every answer.</p>
    <h4>Complexity</h4>
    <p>O(n log n) for the sort, then O(n) for the window over 2n angles. Space O(n).</p>
    <h4>Pitfall</h4>
    <p>Forgetting the wrap-around misses every view that faces west. Leaving the points on the viewer in the
    list gives them the angle 0 and counts them only when the view faces east. Points can sit exactly on the
    edge of the view, and atan2 may round them a hair outside, so compare with a small tolerance
    (1e-9 is plenty for coordinates up to 100). The window should never count more than n directions, even
    with a view of nearly 360 degrees.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'visiblePoints',
    params: [
      { name: 'points', type: 'int[][]' },
      { name: 'angle', type: 'int' },
      { name: 'location', type: 'int[]' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: points, angle and location as three JSON values separated by newlines or
   * semicolons, e.g. [[2,1],[2,2],[3,3]]; 90; [1,1].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const parts = raw.split(/\n|;/).map((s) => s.trim()).filter(Boolean);
    const usage = 'Enter points, angle and location on three lines (or separated by ;), e.g. [[2,1],[2,2],[3,3]]; 90; [1,1].';
    if (parts.length !== 3) return { ok: false, error: usage };
    let points;
    let angle;
    let location;
    try {
      points = JSON.parse(parts[0]);
      angle = JSON.parse(parts[1]);
      location = JSON.parse(parts[2]);
    } catch {
      return { ok: false, error: usage };
    }
    const coord = (v) => Number.isInteger(v) && v >= 0 && v <= MAX_C;
    const pair = (p) => Array.isArray(p) && p.length === 2 && p.every(coord);
    if (!Array.isArray(points) || points.length < 1 || points.length > MAX_N || !points.every(pair)) {
      return { ok: false, error: 'points must hold 1 to 10^5 pairs [x, y] with integers from 0 to 100.' };
    }
    if (!Number.isInteger(angle) || angle < 0 || angle >= 360) return { ok: false, error: 'angle must be an integer from 0 to 359.' };
    if (!pair(location)) return { ok: false, error: 'location must be [x, y] with integers from 0 to 100.' };
    return { ok: true, args: [points, angle, location] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(...args),

  // Random points all around the viewer (none on it), so every angle is sorted and the window walks
  // the whole doubled list; a 90-degree view keeps the window moving on both ends.
  growth: {
    target: 'n log n',
    n: 'points.length',
    sizes: [12500, 25000, 50000, 100000, 200000],
    input: (n, seed) => {
      const pts = randomPoints(seed, n).map(([px, py]) => (px === 50 && py === 50 ? [51, 50] : [px, py]));
      return [pts, 90, [50, 50]];
    },
  },
};

export default problem;
