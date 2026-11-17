/**
 * Problem: Visit All Nodes
 *
 * Shortest walk that visits every node of a small connected graph, starting and ending
 * anywhere, nodes and edges reusable. The state that matters is (current node, set of nodes
 * seen so far); with n <= 12 there are n * 2^n of them, and a BFS from all n single-node states
 * at once finds the first state that has seen everything. O(2^n * n^2).
 *
 * Targeted mistakes: a visited set on nodes only (a walk must revisit nodes), BFS from one
 * start node, a DFS that tries every walk, assuming a Hamiltonian path (n - 1), and trying
 * every order of the nodes (12! orders).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 12;

/**
 * Reference: multi-source BFS over (node, visited mask) states.
 * @param {number} n
 * @param {number[][]} edges
 * @returns {number}
 */
export function reference(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  const full = (1 << n) - 1;
  const seen = new Uint8Array(n << n);
  let frontier = [];
  for (let v = 0; v < n; v++) {
    seen[(v << n) | (1 << v)] = 1;
    frontier.push([v, 1 << v]);
  }
  for (let steps = 0; ; steps++) {
    const next = [];
    for (const [v, mask] of frontier) {
      if (mask === full) return steps;
      for (const w of adj[v]) {
        const m = mask | (1 << w);
        if (!seen[(w << n) | m]) {
          seen[(w << n) | m] = 1;
          next.push([w, m]);
        }
      }
    }
    frontier = next;
  }
}

/** Connected random graph: a random spanning tree plus each other pair with chance `density`. */
function randomGraph(seed, n, density) {
  const rnd = mulberry32(seed);
  const label = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [label[i], label[j]] = [label[j], label[i]];
  }
  const has = new Set();
  const edges = [];
  const add = (a, b) => {
    const key = Math.min(a, b) * n + Math.max(a, b);
    if (a === b || has.has(key)) return;
    has.add(key);
    edges.push(rnd() < 0.5 ? [a, b] : [b, a]);
  };
  for (let i = 1; i < n; i++) add(label[i], label[Math.floor(rnd() * i)]);
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (rnd() < density) add(a, b);
  return [n, edges];
}

/** Every pair of nodes, for a complete graph. */
function completeEdges(n) {
  const edges = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) edges.push([a, b]);
  return edges;
}

const visible = [
  { args: [5, [[2, 0], [2, 1], [2, 3], [3, 4]]], expected: 5, note: 'Start at a short leg and end on the long one: 0 -> 2 -> 1 -> 2 -> 3 -> 4. Node 2 is visited twice.' },
  { args: [5, [[0, 1], [1, 2], [1, 4], [2, 3], [3, 4]]], expected: 4, note: '0 -> 1 -> 4 -> 3 -> 2 visits each node once.' },
  { args: [1, []], expected: 0, note: 'One node: the walk is already complete.' },
  { args: [3, [[0, 1], [1, 2], [0, 2]]], expected: 2, note: 'A triangle: any two edges visit all three nodes.' },
  { args: [4, [[3, 1], [1, 0], [0, 2]]], expected: 3, note: 'A path: start at one end (node 3) and walk to the other (node 2).' },
];

// Hidden tests: two nodes, a star of 12 (every leaf but one costs two steps), a spider with
// legs of different lengths (the longest leg should be walked last), a complete graph, a cycle,
// a small random graph, and four 12-node graphs where trying all 12! orders times out.
const hiddenArgs = [
  [2, [[1, 0]]],
  [MAX_N, Array.from({ length: MAX_N - 1 }, (_, i) => [0, i + 1])],
  [10, [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [0, 6], [6, 7], [7, 8], [8, 9]]],
  [6, completeEdges(6)],
  [8, Array.from({ length: 8 }, (_, i) => [i, (i + 1) % 8])],
  randomGraph(7, 7, 0.2),
  randomGraph(11, MAX_N, 0.15),
  randomGraph(13, MAX_N, 0.05),
  randomGraph(17, MAX_N, 0.6),
  [MAX_N, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 6], [3, 7], [7, 8], [3, 9], [9, 10], [10, 11]]],
];

export const problem = {
  id: 'visit-all-nodes',
  title: 'Visit All Nodes',
  difficulty: 'Hard',
  topics: ['graphs', 'dp'],
  patterns: ['Bitmask', 'BFS', 'State Space Search'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['n', 'edges'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>An undirected, connected graph has <code>n</code> nodes numbered <code>0</code> to
    <code>n - 1</code>. Each <code>edges[i] = [a, b]</code> connects nodes <code>a</code> and
    <code>b</code>.</p>
    <p>Return the length (number of edges traversed) of the shortest walk that visits every
    node. You may start and end at any node, revisit nodes, and reuse edges.</p>
  `,
  constraints: [
    '1 <= n <= 12',
    '0 <= edges.length <= n * (n - 1) / 2',
    '0 <= a, b < n; a != b; each pair of nodes appears at most once',
    'The graph is connected',
    'Target complexity: O(2^n * n^2) (trying every order of the nodes, 12!, times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}, edges = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'A walk may revisit nodes, so "visited node" alone cannot be your BFS state. What else must the state remember?',
    'With n <= 12, how can you store a set of visited nodes in a single integer?',
    'How many (node, visited set) states are there, and is that small enough to search them all?',
    'You may start anywhere: how can one BFS try every starting node at once?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'shortestPathLength',
    params: [
      { name: 'n', type: 'int' },
      { name: 'edges', type: 'int[][]' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, n and edges (JSON). The graph must be connected.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: n, then edges as a JSON array of [a, b].' };
    let n;
    let edges;
    try {
      [n, edges] = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON.' };
    }
    if (!Number.isInteger(n) || n < 1 || n > MAX_N) return { ok: false, error: 'n must be an integer from 1 to 12.' };
    if (!Array.isArray(edges)) return { ok: false, error: 'edges must be a JSON array.' };
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const seen = new Set();
    for (const e of edges) {
      if (!Array.isArray(e) || e.length !== 2 || !e.every(Number.isInteger)) return { ok: false, error: 'Each edge must be two integers [a, b].' };
      const [a, b] = e;
      if (a < 0 || a >= n || b < 0 || b >= n || a === b) return { ok: false, error: 'a and b must differ and be from 0 to n - 1.' };
      const key = Math.min(a, b) * n + Math.max(a, b);
      if (seen.has(key)) return { ok: false, error: 'Each pair of nodes may be connected at most once.' };
      seen.add(key);
      parent[find(a)] = find(b);
    }
    if (parent.some((_, v) => find(v) !== find(0))) return { ok: false, error: 'The graph must be connected.' };
    return { ok: true, args: [n, edges] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
