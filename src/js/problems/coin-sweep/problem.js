/**
 * Problem: Coin Sweep
 *
 * Equivalent to LeetCode 2603 (Collect Coins in a Tree); statement and tests are written for this
 * project. A walk that returns to its start and visits a connected set T of nodes crosses every edge
 * of T exactly twice, so the answer is 2 * (|T| - 1) for the smallest T such that every coin is within
 * distance 2 of T. Leaf trimming finds it: drop leaves without a coin until every leaf has one, then
 * drop all current leaves twice (a coin on a leaf is picked up from two edges away), and count what
 * is left. O(n) with the neighbour-xor trick, or with adjacency lists.
 *
 * Classic wrong answers: trimming only coinless leaves (forgetting the reach of 2), trimming only
 * one layer of leaves, counting the walk once instead of twice, trying every start with a search
 * (O(n^2): 10^10 steps at 10^5 nodes), and a recursive search on a 10^5-node path (too deep). The
 * limit is raised from 3 * 10^4 nodes to 10^5 for the quadratic start-by-start approach.
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt, shuffle } from '../../engine/growth-inputs.js';

const MAX_N = 100000;

/**
 * Reference: leaf trimming, using degree and the xor of neighbour ids (a leaf's xor is its parent).
 * @param {number[]} coins
 * @param {number[][]} edges
 * @returns {number}
 */
export function reference(coins, edges) {
  const n = coins.length;
  if (!coins.includes(1)) return 0;
  const deg = new Array(n).fill(0);
  const xr = new Array(n).fill(0);
  for (const [a, b] of edges) {
    deg[a]++;
    deg[b]++;
    xr[a] ^= b;
    xr[b] ^= a;
  }
  const gone = new Array(n).fill(false);
  let alive = n;
  const queue = [];
  for (let v = 0; v < n; v++) {
    if (deg[v] === 1 && coins[v] === 0) {
      gone[v] = true;
      queue.push(v);
    }
  }
  // Pass 1: coinless leaves are never worth visiting. Removing one may expose another.
  for (let head = 0; head < queue.length; head++) {
    const v = queue[head];
    alive--;
    const p = xr[v];
    xr[p] ^= v;
    deg[p]--;
    if (deg[p] === 1 && coins[p] === 0 && !gone[p]) {
      gone[p] = true;
      queue.push(p);
    }
  }
  // Pass 2, twice: a coin within distance 2 of the walk is collected, so the two outermost layers
  // of nodes need not be visited, whatever they hold.
  for (let round = 0; round < 2; round++) {
    const leaves = [];
    for (let v = 0; v < n; v++) if (!gone[v] && deg[v] === 1) leaves.push(v);
    for (const v of leaves) {
      gone[v] = true;
      alive--;
      // A leaf whose only neighbour was a leaf too (two nodes left) has no neighbour any more.
      if (deg[v] === 1) {
        const p = xr[v];
        xr[p] ^= v;
        deg[p]--;
      }
    }
  }
  return Math.max(0, 2 * (alive - 1));
}

/**
 * A random tree: node i (in a random labelling) hangs from `parentOf(rnd, i)`, an earlier node. Edges
 * come out shuffled and randomly oriented.
 */
function randomTree(seed, n, parentOf) {
  const rnd = mulberry32(seed);
  const label = shuffle(Array.from({ length: n }, (_, i) => i), rnd);
  const edges = [];
  for (let i = 1; i < n; i++) {
    const [a, b] = [label[i], label[parentOf(rnd, i)]];
    edges.push(rnd() < 0.5 ? [a, b] : [b, a]);
  }
  return shuffle(edges, rnd);
}

/** Coins on each node with probability `p`, seeded. */
function randomCoins(seed, n, p) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => (rnd() < p ? 1 : 0));
}

const visible = [
  { args: [[1, 0, 0, 0, 0, 1], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]], expected: 2, note: 'Start at node 2: it reaches the coin at node 0 (two away). Walk to node 3 and collect node 5, then return: 2 edges.' },
  { args: [[0, 0, 0, 1, 1, 0, 0, 1], [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [5, 6], [5, 7]]], expected: 2, note: 'Start at node 2: it reaches the coin at node 7 (distance 2). Step to node 0 to reach the coins at nodes 3 and 4, then come back: 2 edges.' },
  { args: [[0, 1, 1, 1, 1], [[0, 1], [0, 2], [0, 3], [0, 4]]], expected: 0, note: 'From the centre every coin is one edge away, so no moves are needed.' },
  { args: [[1, 0, 0, 0, 0, 0, 0, 0, 0, 1], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]]], expected: 10, note: 'Only the middle six nodes (5 edges) must be walked, out and back.' },
  { args: [[1], []], expected: 0, note: 'One node: nothing to walk.' },
];

// Hidden tests: two nodes with coins, a coinless tree of 10^3 nodes (answer 0), all coins in a
// random tree, a 10^5-node path with coins only at the ends and with coins everywhere (a recursive
// search is too deep), a star with random coins, random sparse-coin trees at full size (random
// parents and a deep tree where parents come from the last few nodes), and a complete binary tree
// with coins only on the leaves.
const hiddenArgs = (() => {
  const randomParent = (r, i) => Math.floor(r() * i);
  const deepParent = (r, i) => Math.max(0, i - 1 - Math.floor(r() * 4));
  // Complete binary tree in heap numbering (node i hangs from (i - 1) >> 1), edges shuffled. The
  // labels stay as numbered because the coins are placed by label: on the leaves, nodes >= MAX_N / 2.
  const binary = shuffle(Array.from({ length: MAX_N - 1 }, (_, k) => [k + 1, k >> 1]), mulberry32(41));
  const path = Array.from({ length: MAX_N - 1 }, (_, i) => [i, i + 1]);
  const ends = Array(MAX_N).fill(0);
  ends[0] = 1;
  ends[MAX_N - 1] = 1;
  const leafCoins = Array.from({ length: MAX_N }, (_, i) => (2 * i + 1 >= MAX_N ? 1 : 0));
  return [
    [[1, 1], [[1, 0]]],
    [Array(1000).fill(0), randomTree(5, 1000, randomParent)],
    [Array(1000).fill(1), randomTree(7, 1000, randomParent)],
    [randomCoins(11, 12, 0.3), randomTree(13, 12, randomParent)],
    [ends, path],
    [Array(MAX_N).fill(1), path],
    [randomCoins(17, MAX_N, 0.5), randomTree(19, MAX_N, () => 0)],
    [randomCoins(23, MAX_N, 0.05), randomTree(29, MAX_N, randomParent)],
    [randomCoins(31, MAX_N, 0.1), randomTree(37, MAX_N, deepParent)],
    [leafCoins, binary],
  ];
})();

export const problem = {
  id: 'coin-sweep',
  title: 'Coin Sweep',
  difficulty: 'Hard',
  topics: ['graphs', 'trees'],
  patterns: ['Leaf Trimming', 'Topological Peeling', 'Tree'],
  timeLimitMs: 3000,
  argNames: ['coins', 'edges'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>There is an undirected tree with <code>n</code> nodes numbered <code>0</code> to <code>n - 1</code>.
    <code>edges[i] = [a, b]</code> joins nodes <code>a</code> and <code>b</code>, and
    <code>coins[i]</code> is <code>1</code> if node <code>i</code> holds a coin and <code>0</code> if it does
    not.</p>
    <p>You choose any node to start from. Any number of times you may do either of these:</p>
    <ul>
      <li>collect every coin on nodes within distance 2 of your current node (at most two edges away);</li>
      <li>move along one edge to an adjacent node.</li>
    </ul>
    <p>You must collect all the coins and end at the node where you started. Return the minimum number of
    edges you have to move along; an edge crossed again counts again.</p>
  `,
  constraints: [
    '1 <= n = coins.length <= 10^5',
    'coins[i] is 0 or 1',
    'edges.length = n - 1 and the edges form a tree',
    '0 <= a, b < n',
    'Target complexity: O(n)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `coins = ${JSON.stringify(t.args[0])}\nedges = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'A coinless leaf: could any best walk ever need to step onto it? What happens to the tree if you cut it off, and what might that expose?',
    'After no such leaf is left, every leaf holds a coin. If you can collect from two edges away, how many of the outermost nodes can the walk skip?',
    'Which nodes must the walk actually reach, and what shape do they form? Is it connected?',
    'How many times does a walk that comes back to where it started cross each edge of that shape?',
    'Instead of trying every starting node, how can you find the leaves layer by layer from the outside in?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>The walk only has to visit a connected part of the tree, as long as every coin is within distance 2 of it.
    Peel the tree from the outside: remove leaves without a coin, repeatedly; then remove all current leaves, and
    once more all the new leaves. If <code>m</code> nodes are left, a closed walk crosses each of their
    <code>m - 1</code> edges twice: the answer is <code>2 * (m - 1)</code>, or 0 if nothing is left.</p>
    <h4>Why it works</h4>
    <p>A coinless leaf is useless: stepping onto it never reaches a coin its neighbour could not. Once every leaf
    holds a coin, that coin is collected from two edges away, so the walk may stop two nodes short of every leaf,
    which is two rounds of removing leaves. Every node that remains is needed.</p>
    <h4>Complexity</h4>
    <p>O(n): each node is removed once. Keeping each node's degree and the xor of its neighbours' numbers lets a
    leaf name its only neighbour without adjacency lists; ordinary lists work too.</p>
    <h4>Pitfall</h4>
    <p>Trimming one layer, or none, over-counts; forgetting to double gives half the answer. Trying every start
    is O(n<sup>2</sup>), and a recursive search on a path of 10<sup>5</sup> nodes is too deep.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'collectCoins',
    params: [
      { name: 'coins', type: 'int[]' },
      { name: 'edges', type: 'int[][]' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, coins (JSON) and edges (JSON). The edges must form a tree.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: coins as a JSON array of 0 and 1, then edges as a JSON array of [a, b].' };
    let coins;
    let edges;
    try {
      [coins, edges] = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON.' };
    }
    if (!Array.isArray(coins) || coins.length < 1 || coins.length > MAX_N) return { ok: false, error: 'coins must have 1 to 10^5 values.' };
    if (!coins.every((c) => c === 0 || c === 1)) return { ok: false, error: 'Every coin value must be 0 or 1.' };
    const n = coins.length;
    if (!Array.isArray(edges) || edges.length !== n - 1) return { ok: false, error: 'edges must hold exactly n - 1 pairs.' };
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x) => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    };
    for (const e of edges) {
      if (!Array.isArray(e) || e.length !== 2 || !e.every((v) => Number.isInteger(v) && v >= 0 && v < n)) return { ok: false, error: 'Each edge must be two integers from 0 to n - 1.' };
      const [ra, rb] = [find(e[0]), find(e[1])];
      // n - 1 edges that never close a loop are connected: a tree.
      if (ra === rb) return { ok: false, error: 'The edges must form a tree (no cycle, no repeated or self edge).' };
      parent[ra] = rb;
    }
    return { ok: true, args: [coins, edges] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // A long thin tree (node i hangs from one of the 3 nodes before it) with random coins at 10%: the
  // trimming touches a share of the nodes in each pass and has no early exit. Labels follow the
  // order of creation, so memory access stays local and the time follows n instead of the cache.
  growth: {
    target: 'n',
    n: 'coins.length',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const edges = [];
      for (let i = 1; i < n; i++) edges.push([i, i - 1 - Math.floor(rnd() * Math.min(i, 3))]);
      const coins = Array.from({ length: n }, () => (rnd() < 0.1 ? 1 : 0));
      coins[randInt(rnd, 0, n - 1)] = 1;
      return [coins, edges];
    },
  },
};

export default problem;
