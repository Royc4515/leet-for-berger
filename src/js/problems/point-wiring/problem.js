/**
 * Problem: Point Wiring
 *
 * Minimum spanning tree of up to 1000 points where every pair can be wired at its Manhattan
 * distance. The graph is complete (about 5 * 10^5 edges), so Prim's algorithm with a plain
 * distance array, O(n^2) and no edge list at all, beats Kruskal's sort of every edge. A Prim
 * that rescans every edge of the tree to pick the next point is O(n^3) and times out.
 *
 * Targeted mistakes: Euclidean instead of Manhattan distance, greedy nearest-neighbour chaining
 * (a path, not a tree), counting a single point as needing a wire, and negative coordinates.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 1000;
const MAX_C = 1000000;

/**
 * Reference: O(n^2) Prim, keeping for each outside point its cheapest wire into the tree.
 * @param {number[][]} points
 * @returns {number}
 */
export function reference(points) {
  const n = points.length;
  const best = new Array(n).fill(Infinity);
  const inTree = new Array(n).fill(false);
  best[0] = 0;
  let total = 0;
  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!inTree[v] && (u === -1 || best[v] < best[u])) u = v;
    inTree[u] = true;
    total += best[u];
    const [x, y] = points[u];
    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      const d = Math.abs(points[v][0] - x) + Math.abs(points[v][1] - y);
      if (d < best[v]) best[v] = d;
    }
  }
  return total;
}

/** `n` distinct seeded points in [-range, range]^2. */
function randomPoints(seed, n, range) {
  const rnd = mulberry32(seed);
  const seen = new Set();
  const pts = [];
  while (pts.length < n) {
    const x = Math.floor(rnd() * (2 * range + 1)) - range;
    const y = Math.floor(rnd() * (2 * range + 1)) - range;
    if (seen.has(`${x},${y}`)) continue;
    seen.add(`${x},${y}`);
    pts.push([x, y]);
  }
  return [pts];
}

/** Ten tight clusters spread over the whole plane: cheap wires inside, ten long ones between. */
function clusters(seed) {
  const rnd = mulberry32(seed);
  const seen = new Set();
  const centers = Array.from({ length: 10 }, () => [Math.floor(rnd() * 1800000) - 900000, Math.floor(rnd() * 1800000) - 900000]);
  const pts = [];
  while (pts.length < MAX_N) {
    const [cx, cy] = centers[pts.length % 10];
    const x = cx + Math.floor(rnd() * 2001) - 1000;
    const y = cy + Math.floor(rnd() * 2001) - 1000;
    if (seen.has(`${x},${y}`)) continue;
    seen.add(`${x},${y}`);
    pts.push([x, y]);
  }
  return [pts];
}

const visible = [
  { args: [[[1, 1], [4, 3], [2, 8], [6, 6], [9, 1]]], expected: 23, note: 'Wires [1,1]-[4,3] (5), [4,3]-[6,6] (5), [6,6]-[2,8] (6) and [4,3]-[9,1] (7) cost 23.' },
  { args: [[[4, -6], [-1, 2], [-3, 5]]], expected: 18, note: '[-1,2]-[-3,5] costs 5 and [4,-6]-[-1,2] costs 13; the direct [4,-6]-[-3,5] wire (18) is not needed.' },
  { args: [[[0, 0]]], expected: 0, note: 'A single point needs no wire.' },
  { args: [[[0, 0], [1, 1], [1, 0], [-1, 1]]], expected: 4, note: 'Distance is |dx| + |dy|, not the straight-line length.' },
  { args: [[[-1000000, -1000000], [1000000, 1000000]]], expected: 4000000, note: 'Opposite corners of the allowed range.' },
];

// Hidden tests: two points on a line, a star where chaining nearest neighbours costs more than
// the tree, collinear points given out of order, a grid with many equal-length wires, a small
// random set, and four 1000-point inputs where O(n^3) Prim times out.
const hiddenArgs = [
  [[[5, -5], [5, 5]]],
  [[[0, 0], [10, 0], [-10, 0], [0, 10], [0, -10], [21, 0]]],
  [[[7, 0], [-3, 0], [12, 0], [0, 0], [-20, 0], [1, 0]]],
  [Array.from({ length: 36 }, (_, i) => [(i % 6) * 3, Math.floor(i / 6) * 3])],
  randomPoints(7, 40, 50),
  randomPoints(11, 300, 1000),
  randomPoints(13, MAX_N, MAX_C),
  randomPoints(17, MAX_N, 40),
  clusters(19),
  [Array.from({ length: MAX_N }, (_, i) => [((i * 7919) % MAX_N) * 2000 - MAX_C, i % 2 ? MAX_C - i : -MAX_C + i])],
];

export const problem = {
  id: 'point-wiring',
  title: 'Point Wiring',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['Minimum Spanning Tree', "Prim's Algorithm", 'Dense Graph'],
  timeLimitMs: 4000,
  argNames: ['points'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given distinct points on a grid, <code>points[i] = [x, y]</code>. A wire between
    two points costs their <strong>Manhattan distance</strong>,
    <code>|x1 - x2| + |y1 - y2|</code>.</p>
    <p>Return the minimum total cost of wires so that every point is connected to every other,
    directly or through other points.</p>
  `,
  constraints: [
    '1 <= points.length <= 1000',
    '-10^6 <= x, y <= 10^6',
    'All points are distinct',
    'Every pair can be wired: about 5 * 10^5 candidate wires',
    'Target complexity: O(n^2) time (O(n^3) times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `points = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How many wires does a cheapest connection of n points use, and what shape do they form?',
    'If you grow a connected group one point at a time, which point should join next?',
    'For each point outside the group, what single number do you need to remember?',
    'With every pair a possible wire, do you need to build the list of wires at all?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>The cheapest wiring is a minimum spanning tree of the complete graph with Manhattan distances.
    Grow it with Prim's algorithm, keeping for every outside point the cheapest wire into the tree, and
    never build the edge list at all.</p>
    <h4>Why it works</h4>
    <p>At every step, the cheapest wire leaving the current tree belongs to some minimum spanning tree
    (the cut property), so adding that point is safe. After it joins, an outside point's best wire can
    only get cheaper through the new point, so one pass updates every <code>best</code> value. After
    <code>n - 1</code> additions all points are connected.</p>
    <h4>Complexity</h4>
    <p>O(n^2) time: <code>n</code> steps, each scanning the outside points once. O(n) space. Kruskal must
    sort about 5 * 10^5 edges, and a Prim that rescans tree edges to pick each point is O(n^3).</p>
    <h4>Pitfall</h4>
    <p>Use Manhattan distance <code>|x1 - x2| + |y1 - y2|</code>, not Euclidean. Chaining each point to its
    nearest unvisited neighbor builds a path, not a minimum tree. A single point needs no wire, so the
    answer is <code>0</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'minCostConnectPoints',
    params: [{ name: 'points', type: 'int[][]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: points as a JSON array of [x, y].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let points;
    try {
      points = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter points as a JSON array, for example [[0,0],[2,2],[3,10]].' };
    }
    if (!Array.isArray(points) || points.length < 1 || points.length > MAX_N) return { ok: false, error: 'points must have 1 to 1000 entries.' };
    const seen = new Set();
    for (const p of points) {
      if (!Array.isArray(p) || p.length !== 2 || !p.every((c) => Number.isInteger(c) && Math.abs(c) <= MAX_C)) return { ok: false, error: 'Each point must be two integers within +-10^6.' };
      if (seen.has(`${p[0]},${p[1]}`)) return { ok: false, error: 'Points must be distinct.' };
      seen.add(`${p[0]},${p[1]}`);
    }
    return { ok: true, args: [points] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Distinct random points in the full coordinate range: Prim without a heap scans every point
  // n times, so time is quadratic. A sorted list of all pair wires is n^2 log n.
  growth: {
    target: 'n^2',
    n: 'points.length',
    sizes: [250, 500, 1000, 2000, 4000],
    input: (n, seed) => randomPoints(seed, n, MAX_C),
  },
};

export default problem;
