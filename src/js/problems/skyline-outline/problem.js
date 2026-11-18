/**
 * Problem: Skyline Outline
 *
 * The outline of overlapping rectangles, as the points where its height changes. Sweep the
 * distinct x coordinates in order, keep the buildings standing at x in a max-heap by height,
 * and drop finished buildings lazily when they reach the top. O(n log n).
 *
 * Output is fixed exactly as the classic problem: key points sorted by x, one per x, no two
 * consecutive points with the same height, the last one at height 0. Targeted mistakes: a
 * duplicate point where one building ends exactly where an equal one starts, a dip to 0
 * between touching buildings, two points at one x when buildings share a left edge, 32-bit
 * overflow on coordinates near 2^31 - 1, and removing finished buildings by linear search
 * (O(n^2) on 10^5 nested buildings).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 2147483647;

/**
 * Reference: sweep sorted x coordinates with a lazily cleaned max-heap of [height, right].
 * @param {number[][]} buildings
 * @returns {number[][]}
 */
export function reference(buildings) {
  const xs = [...new Set(buildings.flatMap(([l, r]) => [l, r]))].sort((a, b) => a - b);
  const heap = [];
  const higher = (a, b) => heap[a][0] > heap[b][0];
  const swap = (a, b) => ([heap[a], heap[b]] = [heap[b], heap[a]]);
  const push = (item) => {
    heap.push(item);
    for (let i = heap.length - 1; i > 0;) {
      const p = (i - 1) >> 1;
      if (!higher(i, p)) break;
      swap(i, p);
      i = p;
    }
  };
  const pop = () => {
    const last = heap.pop();
    if (!heap.length) return;
    heap[0] = last;
    for (let i = 0; ;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < heap.length && higher(l, m)) m = l;
      if (r < heap.length && higher(r, m)) m = r;
      if (m === i) break;
      swap(i, m);
      i = m;
    }
  };
  const out = [];
  let next = 0;
  for (const x of xs) {
    while (next < buildings.length && buildings[next][0] <= x) {
      push([buildings[next][2], buildings[next][1]]);
      next++;
    }
    while (heap.length && heap[0][1] <= x) pop();
    const h = heap.length ? heap[0][0] : 0;
    if (!out.length || out[out.length - 1][1] !== h) out.push([x, h]);
  }
  return out;
}

/** `n` buildings with seeded lefts in [0, span], sorted, widths up to `maxW`, heights up to `maxH`. */
function randomCity(seed, n, span, maxW, maxH) {
  const rnd = mulberry32(seed);
  const lefts = Array.from({ length: n }, () => Math.floor(rnd() * (span + 1))).sort((a, b) => a - b);
  return [lefts.map((l) => [l, Math.min(MAX_V, l + 1 + Math.floor(rnd() * maxW)), 1 + Math.floor(rnd() * maxH)])];
}

const visible = [
  { args: [[[1, 6, 4], [3, 9, 7], [10, 12, 2]]], expected: [[1, 4], [3, 7], [9, 0], [10, 2], [12, 0]], note: 'The taller middle building covers the end of the first; the ground shows between 9 and 10.' },
  { args: [[[0, 4, 3], [4, 8, 3]]], expected: [[0, 3], [8, 0]], note: 'Touching buildings of equal height form one flat stretch: no point at x = 4.' },
  { args: [[[0, 4, 3], [4, 8, 5]]], expected: [[0, 3], [4, 5], [8, 0]], note: 'Touching buildings of different heights: the height steps up at x = 4 without dropping to 0.' },
  { args: [[[2, 10, 6], [4, 6, 3]]], expected: [[2, 6], [10, 0]], note: 'A lower building hidden inside a taller one changes nothing.' },
  { args: [[[5, 7, 1]]], expected: [[5, 1], [7, 0]], note: 'One building: up at its left edge, down to 0 at its right edge.' },
];

// Hidden tests: shared left edges, shared right edges, duplicates at the 32-bit limits, a step
// down inside a taller building, a small random city, three cities of 2 * 10^4 buildings
// (disjoint blocks, heavy overlap with few heights, full-range coordinates), and two of 10^5
// where O(n^2) times out: random overlaps, and nested buildings, each lower than the one
// around it, so every building stays in the heap until the outermost one ends.
const hiddenArgs = [
  [[[2, 9, 3], [2, 4, 10], [2, 6, 5]]],
  [[[1, 5, 7], [3, 5, 9], [4, 5, 2]]],
  [[[0, MAX_V, MAX_V], [0, MAX_V, MAX_V], [5, 10, 1], [MAX_V - 1, MAX_V, 3]]],
  [[[0, 10, 8], [2, 12, 5], [4, 14, 9], [14, 20, 9], [21, 22, 9]]],
  randomCity(7, 30, 100, 20, 10),
  randomCity(11, MAX_N, 10000000, 2000, 1000000),
  [Array.from({ length: MAX_N }, (_, i) => [i, 2 * MAX_N - i, MAX_N - i])],
  [Array.from({ length: 20000 }, (_, i) => [3 * i, 3 * i + 2, 1 + (i % 7)])],
  randomCity(13, 20000, 1000000, 500000, 5),
  randomCity(17, 20000, MAX_V - 1, MAX_V, MAX_V),
];

export const problem = {
  id: 'skyline-outline',
  title: 'Skyline Outline',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Sweep Line', 'Heap', 'Lazy Deletion'],
  timeLimitMs: 4000,
  argNames: ['buildings'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Each <code>buildings[i] = [left, right, height]</code> is a rectangle standing on the
    ground (height 0) from <code>x = left</code> to <code>x = right</code>. The buildings are
    sorted by <code>left</code>.</p>
    <p>Return the skyline, the outline seen from a distance, as a list of key points
    <code>[x, h]</code>: at each <code>x</code> where the height of the outline changes, the
    new height <code>h</code>. List the points by increasing <code>x</code>. The last point is
    where the rightmost building ends, with height 0.</p>
    <p>A point is listed only when the height really changes: never two consecutive points with
    the same height, and never two points at the same <code>x</code>.</p>
  `,
  constraints: [
    '1 <= buildings.length <= 10^5 (raised from the usual 10^4)',
    '0 <= left < right <= 2^31 - 1',
    '1 <= height <= 2^31 - 1',
    'buildings is sorted by left in non-decreasing order',
    'Target complexity: O(n log n) (O(n^2) times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `buildings = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'At which x coordinates can the height of the outline possibly change?',
    'At one such x, which buildings decide the height, and which one wins?',
    'As you sweep x from left to right, buildings start and stop: which structure gives the tallest one still standing?',
    'Removing a finished building from a heap is slow; what if you only remove it once it reaches the top?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'getSkyline',
    params: [{ name: 'buildings', type: 'int[][]' }],
    returns: 'int[][]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: buildings as a JSON array of [left, right, height], sorted by left.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let buildings;
    try {
      buildings = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter buildings as a JSON array, for example [[1,6,4],[3,9,7]].' };
    }
    if (!Array.isArray(buildings) || buildings.length < 1 || buildings.length > MAX_N) return { ok: false, error: 'buildings must have 1 to 10^5 entries.' };
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (!Array.isArray(b) || b.length !== 3 || !b.every(Number.isInteger)) return { ok: false, error: 'Each building must be three integers [left, right, height].' };
      if (b[0] < 0 || b[1] <= b[0] || b[1] > MAX_V) return { ok: false, error: 'Need 0 <= left < right <= 2^31 - 1.' };
      if (b[2] < 1 || b[2] > MAX_V) return { ok: false, error: 'height must be from 1 to 2^31 - 1.' };
      if (i > 0 && b[0] < buildings[i - 1][0]) return { ok: false, error: 'buildings must be sorted by left.' };
    }
    return { ok: true, args: [buildings] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
