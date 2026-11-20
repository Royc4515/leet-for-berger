/**
 * Problem: Limited Paths
 *
 * For each query (p, q, limit): is there a path from p to q using only edges strictly shorter
 * than limit? Answering each query with its own search is O(Q * (V + E)). Offline, sort queries
 * by limit and edges by length; sweep the queries in increasing limit, adding every edge shorter
 * than the current limit to a union-find, and the answer is "same component". O(E log E +
 * Q log Q + (E + Q) alpha(V)).
 *
 * Targeted mistakes: "<=" instead of "<", answering queries in input order (the union-find only
 * grows, so limits must be increasing), losing the original query order in the output, and a
 * recursive find without union by size on an edge list given in path order (10^5 deep).
 */

import { mulberry32 } from '../../engine/rng.js';
import { edgeList, randInt } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_E = 100000;
const MAX_Q = 100000;
const MAX_W = 1000000000;

/**
 * Reference: offline queries by increasing limit over a growing union-find.
 * @param {number} n
 * @param {number[][]} edgeList
 * @param {number[][]} queries
 * @returns {boolean[]}
 */
export function reference(n, edgeList, queries) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = new Array(n).fill(1);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const edges = [...edgeList].sort((a, b) => a[2] - b[2]);
  const order = queries.map((_, i) => i).sort((a, b) => queries[a][2] - queries[b][2]);
  const ans = new Array(queries.length).fill(false);
  let j = 0;
  for (const i of order) {
    const [p, q, limit] = queries[i];
    while (j < edges.length && edges[j][2] < limit) {
      let a = find(edges[j][0]);
      let b = find(edges[j][1]);
      if (a !== b) {
        if (size[a] < size[b]) [a, b] = [b, a];
        parent[b] = a;
        size[a] += size[b];
      }
      j++;
    }
    ans[i] = find(p) === find(q);
  }
  return ans;
}

/** Random graph and queries; weights and limits drawn from [1, maxW] so ties do occur. */
function randomCase(seed, n, e, qCount, maxW) {
  const rnd = mulberry32(seed);
  const pick = () => Math.floor(rnd() * n);
  const edges = [];
  while (edges.length < e) {
    const u = pick();
    const v = pick();
    if (u !== v) edges.push([u, v, 1 + Math.floor(rnd() * maxW)]);
  }
  const queries = [];
  while (queries.length < qCount) {
    const p = pick();
    const q = pick();
    if (p !== q) queries.push([p, q, 1 + Math.floor(rnd() * maxW)]);
  }
  return [n, edges, queries];
}

/**
 * Path 0 - 1 - ... - (n-1) given in order with increasing lengths, so a union-find that links
 * root to root without balancing builds one long chain; queries span the whole path at limits
 * around the largest length, plus a mixed tail.
 */
function orderedPath(seed, n, qCount) {
  const rnd = mulberry32(seed);
  const edges = [];
  for (let v = 1; v < n; v++) edges.push([v - 1, v, v]);
  const queries = [];
  for (let i = 0; i < qCount; i++) {
    const p = Math.floor(rnd() * n);
    let q = Math.floor(rnd() * n);
    if (q === p) q = (p + 1) % n;
    // Limit n - 1 misses only the last edge; limit n allows every edge.
    const limit = i % 3 === 0 ? n : i % 3 === 1 ? n - 1 : 1 + Math.floor(rnd() * n);
    queries.push([p, q, limit]);
  }
  return [n, edges, queries];
}

const visible = [
  { args: [3, [[0, 1, 2], [1, 2, 4], [2, 0, 8], [1, 0, 16]], [[0, 1, 2], [0, 2, 5]]], expected: [false, true], note: 'No edge between 0 and 1 is shorter than 2. With limit 5, 0 -> 1 (2) -> 2 (4) works.' },
  { args: [5, [[0, 1, 10], [1, 2, 5], [2, 3, 9], [3, 4, 13]], [[0, 4, 14], [1, 4, 13]]], expected: [true, false], note: 'The edge 3-4 has length 13, which is not strictly less than 13.' },
  { args: [2, [[0, 1, 5]], [[0, 1, 5], [1, 0, 6]]], expected: [false, true], note: 'Strictly less: limit 5 does not allow the length-5 edge.' },
  { args: [4, [[0, 1, 1], [2, 3, 1]], [[0, 2, 100], [3, 2, 2]]], expected: [false, true], note: 'Nodes 0 and 2 are never connected, whatever the limit.' },
  { args: [3, [[0, 1, 7], [0, 1, 3], [1, 2, 4]], [[0, 2, 5], [0, 2, 4]]], expected: [true, false], note: 'Parallel edges: the length-3 edge between 0 and 1 is the one that counts.' },
];

// Hidden tests: limits equal to edge lengths, parallel edges, queries whose limits decrease in
// input order, a two-node graph, a mid-size random case, the ordered 10^5 path (chain depth for
// an unbalanced union-find), and random 10^5 x 10^5 x 10^5 inputs where per-query search is
// O(Q * (V + E)).
const hiddenArgs = [
  [3, [[0, 1, 4], [1, 2, 4]], [[0, 2, 4], [0, 2, 5], [0, 1, 5], [2, 1, 4]]],
  [2, [[0, 1, 1000000000], [1, 0, 1], [0, 1, 7]], [[0, 1, 1], [0, 1, 2], [1, 0, 1000000000]]],
  [6, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [3, 4, 4], [4, 5, 5]], [[0, 5, 6], [0, 5, 5], [0, 4, 5], [0, 3, 3], [1, 2, 3], [0, 1, 1]]],
  [4, [[0, 1, 3], [1, 2, 3], [2, 3, 3], [0, 3, 10]], [[0, 3, 4], [3, 0, 3], [1, 3, 11], [2, 0, 4]]],
  randomCase(5, 30, 40, 200, 50),
  randomCase(7, 2000, 3000, 3000, 1000),
  orderedPath(11, MAX_N, 30000),
  randomCase(13, MAX_N, MAX_E, MAX_Q, MAX_W),
  randomCase(17, MAX_N, MAX_E, MAX_Q, 1000),
  randomCase(19, 1000, 20000, 20000, 100000),
];

/** Validates a list of [x, y, w] triples on n nodes (x != y, 1 <= w <= 10^9). */
function checkTriples(list, n, max, what) {
  if (!Array.isArray(list) || list.length < 1 || list.length > max) return `${what} must have 1 to 10^5 entries.`;
  for (const t of list) {
    if (!Array.isArray(t) || t.length !== 3 || !t.every(Number.isInteger)) return `Each entry of ${what} must be three integers.`;
    if (t[0] < 0 || t[0] >= n || t[1] < 0 || t[1] >= n || t[0] === t[1]) return `In ${what}, the two nodes must differ and be from 0 to n - 1.`;
    if (t[2] < 1 || t[2] > MAX_W) return `In ${what}, lengths and limits must be from 1 to 10^9.`;
  }
  return null;
}

export const problem = {
  id: 'limited-paths',
  title: 'Limited Paths',
  difficulty: 'Hard',
  topics: ['graphs'],
  patterns: ['Union-Find', 'Offline Queries', 'Sorting'],
  timeLimitMs: 4000,
  argNames: ['n', 'edgeList', 'queries'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>An undirected graph has <code>n</code> nodes numbered <code>0</code> to
    <code>n - 1</code>. Each <code>edgeList[i] = [u, v, length]</code> is an edge between
    <code>u</code> and <code>v</code>; there may be several edges between the same two nodes.</p>
    <p>Each <code>queries[j] = [p, q, limit]</code> asks: is there a path from <code>p</code> to
    <code>q</code> on which every edge is <strong>strictly shorter</strong> than
    <code>limit</code>?</p>
    <p>Return a boolean array whose <code>j</code>-th entry answers <code>queries[j]</code>.</p>
  `,
  constraints: [
    '2 <= n <= 10^5',
    '1 <= edgeList.length, queries.length <= 10^5',
    '0 <= u, v, p, q < n; u != v; p != q',
    '1 <= length, limit <= 10^9',
    'Edge lists can form a 10^5-long chain: recursion that deep fails in Python and browsers',
    'Target complexity: O(E log E + Q log Q) (a search per query times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}, edgeList = ${JSON.stringify(t.args[1])}, queries = ${JSON.stringify(t.args[2])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For one query alone, which edges may you use, and what question about the remaining graph is left?',
    'If two queries have limits 5 and 9, how do their usable edge sets relate?',
    'Can you answer the queries in a different order than given, if you remember where each answer goes?',
    'Which structure answers "are these two nodes connected?" while edges are only ever added?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Answer the queries offline, sorted by <code>limit</code>. Sort the edges by length and sweep: before
    each query, add to a union-find every edge strictly shorter than its limit, then check whether
    <code>p</code> and <code>q</code> are in the same set.</p>
    <h4>Why it works</h4>
    <p>For one query, the usable edges are exactly those shorter than its limit, and the question is
    whether <code>p</code> and <code>q</code> are connected using them. A larger limit allows a superset of
    edges, so in increasing limit order the union-find only ever grows, which is the one thing it does
    well. Sorting query indexes rather than queries keeps track of where each answer goes.</p>
    <h4>Complexity</h4>
    <p>O(E log E + Q log Q) for the two sorts, plus nearly O(1) per union and find. O(V + E + Q) space.
    A separate search per query is O(Q * (V + E)), too slow at 10^5 each.</p>
    <h4>Pitfall</h4>
    <p>The comparison is strict: an edge whose length equals the limit is not usable. Also, return the
    answers in the original query order, not the sorted one.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'distanceLimitedPathsExist',
    params: [
      { name: 'n', type: 'int' },
      { name: 'edgeList', type: 'int[][]' },
      { name: 'queries', type: 'int[][]' },
    ],
    returns: 'bool[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: three lines of JSON, n, edgeList and queries.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 3) return { ok: false, error: 'Enter three lines: n, then edgeList and queries as JSON arrays of triples.' };
    let n;
    let edges;
    let queries;
    try {
      [n, edges, queries] = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'All three lines must be valid JSON.' };
    }
    if (!Number.isInteger(n) || n < 2 || n > MAX_N) return { ok: false, error: 'n must be an integer from 2 to 10^5.' };
    const error = checkTriples(edges, n, MAX_E, 'edgeList') ?? checkTriples(queries, n, MAX_Q, 'queries');
    if (error) return { ok: false, error };
    return { ok: true, args: [n, edges, queries] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1], args[2]),
  growth: {
    target: 'n log n',
    n: 'nodes = edges = queries',
    sizes: [4000, 8000, 16000, 32000, 64000, 128000, 256000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const edges = edgeList(n, n, rnd, { weights: [1, MAX_W] });
      const queries = [];
      while (queries.length < n) {
        const p = randInt(rnd, 0, n - 1);
        const q = randInt(rnd, 0, n - 1);
        if (p !== q) queries.push([p, q, randInt(rnd, 1, MAX_W)]);
      }
      return [n, edges, queries];
    },
  },
};

export default problem;
