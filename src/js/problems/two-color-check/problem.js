/**
 * Problem: Two-Color Check
 *
 * Can the nodes of an undirected graph be split into two sides so that every edge crosses
 * between them? Color each component by BFS, alternating colors level by level; the graph is
 * bipartite exactly when no edge joins two nodes of the same color (no odd cycle). O(V + E).
 *
 * Two classic bugs are targeted: starting the coloring only from node 0 (the graph may be
 * disconnected) and recursing (paths here are 10^5 nodes long). LeetCode's limit of 100 nodes is
 * raised to 10^5 so recursion depth actually matters.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_DEGREE_SUM = 200000;

/**
 * Reference: BFS 2-coloring of every component.
 * @param {number[][]} graph adjacency lists
 * @returns {boolean}
 */
export function reference(graph) {
  const color = new Int8Array(graph.length);
  for (let s = 0; s < graph.length; s++) {
    if (color[s]) continue;
    color[s] = 1;
    const queue = [s];
    for (let h = 0; h < queue.length; h++) {
      const u = queue[h];
      for (const v of graph[u]) {
        if (color[v] === color[u]) return false;
        if (!color[v]) {
          color[v] = -color[u];
          queue.push(v);
        }
      }
    }
  }
  return true;
}

/** Fisher-Yates shuffle with a seeded generator. */
function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Adjacency lists from an undirected edge list, each list shuffled so order carries no hint. */
function fromEdges(n, edges, rnd) {
  const g = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    g[a].push(b);
    g[b].push(a);
  }
  for (const list of g) shuffle(list, rnd);
  return g;
}

/** A cycle through n nodes in random label order (bipartite exactly when n is even). */
function cycle(seed, n) {
  const rnd = mulberry32(seed);
  const order = shuffle(Array.from({ length: n }, (_, i) => i), rnd);
  return fromEdges(n, order.map((v, i) => [v, order[(i + 1) % n]]), rnd);
}

/** A path through n nodes in random label order: bipartite, and as deep as a graph gets. */
function path(seed, n) {
  const rnd = mulberry32(seed);
  const order = shuffle(Array.from({ length: n }, (_, i) => i), rnd);
  return fromEdges(n, order.slice(1).map((v, i) => [order[i], v]), rnd);
}

/**
 * Random graph with e distinct edges between two hidden sides (so bipartite); with `spoil`, one
 * extra edge inside a side whose ends are already connected, creating an odd cycle.
 */
function randomBipartite(seed, n, e, spoil) {
  const rnd = mulberry32(seed);
  const side = Array.from({ length: n }, () => rnd() < 0.5);
  const seen = new Set();
  const edges = [];
  while (edges.length < e) {
    const a = Math.floor(rnd() * n);
    const b = Math.floor(rnd() * n);
    if (side[a] === side[b] || seen.has(Math.min(a, b) * n + Math.max(a, b))) continue;
    seen.add(Math.min(a, b) * n + Math.max(a, b));
    edges.push([a, b]);
  }
  if (spoil) {
    // An edge between the two ends of an existing path a - b - c, both on one side.
    const g = fromEdges(n, edges, rnd);
    for (let b = 0; b < n; b++) {
      if (g[b].length >= 2) {
        edges.push([g[b][0], g[b][1]]);
        break;
      }
    }
  }
  return fromEdges(n, edges, rnd);
}

const visible = [
  { args: [[[1, 3], [0, 2], [1, 3], [0, 2]]], expected: true, note: 'Sides {0, 2} and {1, 3}.' },
  { args: [[[1, 2, 3], [0, 2], [0, 1, 3], [0, 2]]], expected: false, note: 'Nodes 0, 1 and 2 form a triangle: two of them must share a side.' },
  { args: [[[]]], expected: true, note: 'A single node with no edges.' },
  { args: [[[1], [0], [3], [2]]], expected: true, note: 'Two separate edges.' },
  { args: [[[1, 4], [0, 2], [1, 3], [2, 4], [3, 0]]], expected: false, note: 'A cycle of 5 nodes cannot alternate sides all the way round.' },
];

// Hidden tests: odd cycles hidden in a component away from node 0 (a coloring that starts only
// at node 0 says true), an even cycle, a complete bipartite block, a 10^5-node path (recursion
// depth), a 99,999-node odd cycle, and random 10^5-node graphs with and without an odd cycle.
const hiddenArgs = [
  [[[], [], [3, 4], [2, 4], [2, 3]]],
  [[[1], [0], [3, 6], [2, 4], [3, 5], [4, 6], [5, 2]]],
  [cycle(3, 6)],
  [Array.from({ length: 100 }, (_, i) => Array.from({ length: 50 }, (_, j) => (i < 50 ? 50 + j : j)))],
  [cycle(5, 101)],
  [path(7, MAX_N)],
  [cycle(11, MAX_N - 1)],
  [randomBipartite(13, MAX_N, MAX_N - 1, false)],
  [randomBipartite(17, MAX_N, MAX_N - 1, true)],
  [randomBipartite(19, 500, 3000, false)],
];

export const problem = {
  id: 'two-color-check',
  title: 'Two-Color Check',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['BFS', 'Graph Coloring', 'Bipartite'],
  timeLimitMs: 3000,
  argNames: ['graph'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>An undirected graph has <code>n</code> nodes numbered <code>0</code> to
    <code>n - 1</code>. It is given as adjacency lists: <code>graph[u]</code> lists every node
    that shares an edge with <code>u</code>. Edges are symmetric (if <code>v</code> is in
    <code>graph[u]</code>, then <code>u</code> is in <code>graph[v]</code>), and there are no
    self-loops or repeated edges. The graph may be disconnected.</p>
    <p>Return <code>true</code> if the nodes can be split into two groups so that every edge
    connects a node of one group with a node of the other, and <code>false</code> otherwise.</p>
    <p>Note: paths can be 10^5 nodes long, deeper than a recursive search can safely go in
    Python or a browser.</p>
  `,
  constraints: [
    '1 <= n <= 10^5 (raised from LeetCode\'s 100)',
    'The total length of all lists is at most 2 * 10^5',
    '0 <= graph[u][i] < n, graph[u][i] != u, no repeats within a list',
    'Symmetric: v in graph[u] exactly when u in graph[v]',
    'Target complexity: O(V + E) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `graph = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you put one node in group A, where must all its neighbours go? And their neighbours?',
    'While spreading groups like that, what observation proves the split is impossible?',
    'What if some nodes are never reached from the node you started at?',
    'Which shape of graph makes a recursive version run out of stack, and how do you avoid recursion?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'isBipartite',
    params: [{ name: 'graph', type: 'int[][]' }],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: graph as a JSON array of adjacency lists.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let graph;
    try {
      graph = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter graph as a JSON array of adjacency lists, for example [[1],[0]].' };
    }
    if (!Array.isArray(graph) || graph.length < 1 || graph.length > MAX_N) return { ok: false, error: 'graph must have 1 to 10^5 lists.' };
    const n = graph.length;
    let total = 0;
    const edges = new Set();
    for (let u = 0; u < n; u++) {
      const list = graph[u];
      if (!Array.isArray(list)) return { ok: false, error: 'Every entry must be a list of node numbers.' };
      total += list.length;
      if (total > MAX_DEGREE_SUM) return { ok: false, error: 'The lists may hold at most 2 * 10^5 entries in total.' };
      const seen = new Set();
      for (const v of list) {
        if (!Number.isInteger(v) || v < 0 || v >= n || v === u) return { ok: false, error: 'Neighbours must be node numbers from 0 to n - 1, never the node itself.' };
        if (seen.has(v)) return { ok: false, error: 'A list must not repeat a neighbour.' };
        seen.add(v);
        edges.add(u * n + v);
      }
    }
    for (const key of edges) {
      const u = Math.floor(key / n);
      const v = key % n;
      if (!edges.has(v * n + u)) return { ok: false, error: `Edges must be symmetric: ${v} lists no ${u}.` };
    }
    return { ok: true, args: [graph] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
