/**
 * Problem: Cover Area
 *
 * Equivalent to LeetCode 223 (Rectangle Area); statement and tests are written for this project.
 * The area covered by two axis-aligned rectangles is the sum of their areas minus the overlap,
 * and the overlap is itself a rectangle: its width is min(right edges) - max(left edges), its
 * height likewise, each clamped at 0 when the rectangles do not meet on that axis.
 *
 * Classic wrong answers: subtracting a "negative overlap" for disjoint rectangles (forgetting the
 * clamp, or clamping only the product), clamping only one axis (two negative sides multiply to a
 * positive), assuming the second rectangle starts to the right of the first, and returning only
 * the overlap or only the sum. Coordinates up to 10^4 keep every area within 32 bits.
 */

const LIMIT = 10000;

/**
 * Reference: two areas minus the clamped overlap.
 * @returns {number} total area covered by the two rectangles
 */
export function reference(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  const width = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
  const height = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
  return (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - width * height;
}

const visible = [
  { args: [-3, 0, 3, 4, 0, -1, 9, 2], expected: 45, note: '24 + 27 - 6: the rectangles overlap in a 3 by 2 region.' },
  { args: [-2, -2, 2, 2, -2, -2, 2, 2], expected: 16, note: 'The same 4 by 4 square twice covers only 16.' },
  { args: [0, 0, 2, 2, 5, 5, 7, 8], expected: 10, note: 'Far apart: 4 + 6, nothing to subtract.' },
  { args: [0, 0, 4, 4, 1, 1, 2, 2], expected: 16, note: 'The second rectangle lies inside the first.' },
  { args: [0, 0, 3, 3, 3, 0, 5, 3], expected: 15, note: 'They share an edge, which has no area: 9 + 6.' },
];

// Hidden tests: two segments (zero area), a cross where neither corner is inside the other, the
// whole coordinate range twice, apart on x but overlapping on y, apart on both axes to the
// lower left (both clamps matter), corners that only touch, the second rectangle to the left of the
// first, a thin strip through a square, one rectangle of zero width inside the other, and two
// full-range halves that meet on the y axis.
const hiddenArgs = [
  [0, 0, 0, 5, 0, 0, 5, 0],
  [-1, -5, 1, 5, -5, -1, 5, 1],
  [-LIMIT, -LIMIT, LIMIT, LIMIT, -LIMIT, -LIMIT, LIMIT, LIMIT],
  [0, 0, 2, 10, 5, 3, 9, 6],
  [5, 5, 9, 9, -9, -9, -5, -5],
  [0, 0, 2, 2, 2, 2, 4, 4],
  [10, 0, 20, 5, -4, 2, 12, 9],
  [-100, -1, 100, 1, -3, -3, 3, 3],
  [0, 0, 10, 10, 5, 0, 5, 10],
  [-LIMIT, -LIMIT, 0, LIMIT, 0, -LIMIT, LIMIT, LIMIT],
];

export const problem = {
  id: 'cover-area',
  title: 'Cover Area',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Geometry', 'Inclusion-Exclusion', 'Interval Overlap'],
  timeLimitMs: 1000,
  argNames: ['ax1', 'ay1', 'ax2', 'ay2', 'bx1', 'by1', 'bx2', 'by2'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Two rectangles lie in the plane with their sides parallel to the axes. The first has its bottom-left
    corner at <code>(ax1, ay1)</code> and its top-right corner at <code>(ax2, ay2)</code>; the second has
    corners <code>(bx1, by1)</code> and <code>(bx2, by2)</code>.</p>
    <p>Return the total area covered by the two rectangles. A region covered by both counts once.</p>
  `,
  constraints: [
    '-10^4 <= every coordinate <= 10^4',
    'ax1 <= ax2, ay1 <= ay2, bx1 <= bx2, by1 <= by2',
    'Target complexity: O(1)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `ax1 = ${t.args[0]}, ay1 = ${t.args[1]}, ax2 = ${t.args[2]}, ay2 = ${t.args[3]}, bx1 = ${t.args[4]}, by1 = ${t.args[5]}, bx2 = ${t.args[6]}, by2 = ${t.args[7]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you add the two areas, which part did you count twice?',
    'What shape is the part covered by both rectangles, when there is one?',
    'Look at the x axis alone: the two rectangles cover two intervals. How long is the part the intervals share?',
    'What does that formula give when the intervals do not meet at all, and what should it be?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Add the two areas and subtract the part counted twice, the overlap. The overlap of two axis-aligned
    rectangles is a rectangle too: on the x axis it runs from the larger left edge to the smaller right edge,
    and the same holds for y.</p>
    <h4>Why it works</h4>
    <p>The overlap width is <code>min(ax2, bx2) - max(ax1, bx1)</code>. When the rectangles do not meet on x,
    that value is zero or negative, and the overlap is empty, so clamp it at 0. Do the same for the height and
    multiply. Clamping each axis separately matters: two negative sides would multiply to a positive area.</p>
    <h4>Complexity</h4>
    <p>O(1) time and space. With coordinates up to 10<sup>4</sup>, each area is at most 4 * 10<sup>8</sup>
    and the sum at most 8 * 10<sup>8</sup>, so 32-bit integers are enough.</p>
    <h4>Pitfall</h4>
    <p>Without the clamp, disjoint rectangles subtract a made-up overlap. Assuming the second rectangle starts
    to the right of the first, or testing "corner inside" cases one by one, misses crosses where no corner of
    either rectangle lies inside the other.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'computeArea',
    params: ['ax1', 'ay1', 'ax2', 'ay2', 'bx1', 'by1', 'bx2', 'by2'].map((name) => ({ name, type: 'int' })),
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: eight integers, separated by commas or spaces, in the order of the signature.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const parts = raw.trim().replace(/^\[|\]$/g, '').split(/[\s,]+/).filter(Boolean);
    if (parts.length !== 8 || !parts.every((p) => /^-?\d+$/.test(p))) {
      return { ok: false, error: 'Enter 8 integers: ax1 ay1 ax2 ay2 bx1 by1 bx2 by2, e.g. -3 0 3 4 0 -1 9 2.' };
    }
    const v = parts.map(Number);
    if (!v.every((x) => x >= -LIMIT && x <= LIMIT)) return { ok: false, error: 'Every coordinate must be from -10^4 to 10^4.' };
    if (v[0] > v[2] || v[1] > v[3] || v[4] > v[6] || v[5] > v[7]) return { ok: false, error: 'Each rectangle needs its bottom-left corner first: x1 <= x2 and y1 <= y2.' };
    return { ok: true, args: v };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(...args),
};

export default problem;
