/**
 * Problem: Extra Link
 *
 * A tree on n nodes got one extra edge, so the graph has exactly one cycle. Return the edge to
 * remove, the one of the cycle that appears last in the input. Union-find processes edges in
 * order; the first edge whose ends are already connected closes the cycle, and since every other
 * cycle edge came earlier, it is exactly the last cycle edge in the input. O(n alpha(n)).
 *
 * The limit is raised from LeetCode's 1000 to 10^5 edges. That makes "remove each edge and test
 * connectivity" (O(n^2)) and "DFS between the ends before adding each edge" time out, and it
 * makes a union-find without union by size or rank, with a recursive find, overflow the stack
 * on an edge list given in path order.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;

/**
 * Reference: union-find with union by size and an iterative, path-halving find.
 * @param {number[][]} edges
 * @returns {number[]}
 */
export function reference(edges) {
  const n = edges.length;
  const parent = Array.from({ length: n + 1 }, (_, i) => i);
  const size = new Array(n + 1).fill(1);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (const [a, b] of edges) {
    let ra = find(a);
    let rb = find(b);
    if (ra === rb) return [a, b];
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    size[ra] += size[rb];
  }
  throw new Error('no cycle: input is not a tree plus one edge');
}

/** Fisher-Yates shuffle with a seeded generator. */
function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const edge = (a, b) => (a < b ? [a, b] : [b, a]);

/** A random tree on n nodes plus one random extra edge, everything shuffled. */
function randomCase(seed, n) {
  const rnd = mulberry32(seed);
  const label = shuffle(Array.from({ length: n }, (_, i) => i + 1), rnd);
  const edges = [];
  const seen = new Set();
  // Attaching node i to a random earlier node gives a random recursive tree.
  for (let i = 1; i < n; i++) {
    const j = Math.floor(rnd() * i);
    edges.push(edge(label[i], label[j]));
    seen.add(Math.min(label[i], label[j]) * (n + 1) + Math.max(label[i], label[j]));
  }
  for (;;) {
    const a = 1 + Math.floor(rnd() * n);
    const b = 1 + Math.floor(rnd() * n);
    const key = Math.min(a, b) * (n + 1) + Math.max(a, b);
    if (a !== b && !seen.has(key)) {
      edges.push(edge(a, b));
      break;
    }
  }
  return shuffle(edges, rnd);
}

/** A triangle first, then a long path hanging off it: the answer is found early and is not last. */
function triangleFirst(n) {
  const edges = [[1, 2], [2, 3], [1, 3]];
  for (let v = 4; v <= n; v++) edges.push([v - 1, v]);
  return edges;
}

/** A path 1 - 2 - ... - n in order, closed by [1, n]: chains a naive union-find to depth n. */
function orderedRing(n) {
  const edges = [];
  for (let v = 2; v <= n; v++) edges.push([v - 1, v]);
  edges.push([1, n]);
  return edges;
}

const visible = [
  { args: [[[1, 2], [1, 3], [2, 3]]], expected: [2, 3], note: 'All three edges form the cycle; [2, 3] comes last.' },
  { args: [[[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]], expected: [1, 4], note: 'The cycle is 1-2-3-4. [1, 5] is not on it, so removing it would disconnect node 5.' },
  { args: [[[1, 3], [3, 4], [1, 2], [2, 4], [4, 5]]], expected: [2, 4], note: 'Cycle 1-3-4-2; [2, 4] is its last edge in the input.' },
  { args: [[[2, 3], [1, 2], [1, 3], [3, 4]]], expected: [1, 3], note: 'Removing [1, 3] leaves a tree.' },
  { args: [[[1, 4], [3, 4], [1, 3], [1, 2], [4, 5]]], expected: [1, 3], note: 'Cycle 1-4-3.' },
];

// Hidden tests: a cycle through every node, a cycle closed early with tree edges after it (the
// answer is not the last edge), a star with an edge between two leaves, a 10^5-edge path in
// order closed at the end (deep chain for a naive union-find), the triangle-first shape at 10^5
// (O(n^2) "remove and recheck" from the back), and random trees with one extra edge.
const hiddenArgs = [
  [[[1, 2], [2, 3], [3, 4], [4, 5], [1, 5]]],
  [[[1, 2], [2, 3], [1, 3], [3, 4], [4, 5], [2, 6]]],
  [[[1, 2], [1, 3], [1, 4], [1, 5], [3, 5], [1, 6]]],
  [[[4, 5], [1, 2], [2, 4], [3, 4], [2, 3]]],
  [randomCase(5, 12)],
  [randomCase(7, 1000)],
  [orderedRing(MAX_N)],
  [triangleFirst(MAX_N)],
  [randomCase(11, MAX_N)],
  [randomCase(13, MAX_N)],
];

export const problem = {
  id: 'extra-link',
  title: 'Extra Link',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['Union-Find', 'Cycle Detection'],
  timeLimitMs: 3000,
  argNames: ['edges'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A network started as a tree: <code>n</code> nodes labeled <code>1</code> to
    <code>n</code>, connected with no cycles. Then one extra link was added between two nodes
    that were not already directly linked. The result is given as <code>edges</code>, where
    <code>edges[i] = [a, b]</code> is an undirected link and <code>edges.length == n</code>.</p>
    <p>Return a link whose removal turns the network back into a tree. Several links may work;
    return the one that appears <strong>last</strong> in <code>edges</code>, written as it
    appears there.</p>
  `,
  constraints: [
    '3 <= n == edges.length <= 10^5 (raised from LeetCode\'s 1000)',
    '1 <= a < b <= n; no link appears twice',
    'The links form a connected graph with exactly one cycle',
    'Links can form a 10^5-long chain: recursion that deep fails in Python and browsers',
    'Target complexity: O(n alpha(n)) with union-find (O(n^2) times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `edges = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which links could be removed without disconnecting anything? What do they have in common?',
    'If you add links one at a time in input order, when do you first notice the cycle?',
    'Why is that link also the last cycle link in the input?',
    'How can you tell quickly whether two nodes are already connected while links keep being added?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Add the links one by one, in input order, to a union-find. The first link whose two ends are
    already connected closes the cycle, and that is the link to return.</p>
    <h4>Why it works</h4>
    <p>Only links on the single cycle can be removed while keeping the network connected. Before the
    cycle closes, every link joins two separate pieces. The link that finds its ends already connected
    must lie on the cycle, and since all the other cycle links were added before it, it is the cycle link
    that appears last in <code>edges</code>.</p>
    <h4>Complexity</h4>
    <p>O(n alpha(n)) time with union by size and path halving, practically linear. O(n) space.
    Removing each link in turn and testing connectivity is O(n^2).</p>
    <h4>Pitfall</h4>
    <p>Links can form a chain of 10^5 nodes. A union-find without union by size, and with a recursive
    <code>find</code>, builds a tree that deep and overflows the stack. Keep <code>find</code> iterative
    and attach the smaller tree under the larger.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'findRedundantConnection',
    params: [{ name: 'edges', type: 'int[][]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: edges as a JSON array of pairs.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let edges;
    try {
      edges = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter edges as a JSON array of pairs, for example [[1,2],[1,3],[2,3]].' };
    }
    if (!Array.isArray(edges) || edges.length < 3 || edges.length > MAX_N) return { ok: false, error: 'edges must have 3 to 10^5 links.' };
    const n = edges.length;
    const seen = new Set();
    for (const e of edges) {
      if (!Array.isArray(e) || e.length !== 2 || !e.every(Number.isInteger) || e[0] < 1 || e[0] >= e[1] || e[1] > n) return { ok: false, error: 'Each link must be [a, b] with 1 <= a < b <= n, where n = edges.length.' };
      const key = e[0] * (n + 1) + e[1];
      if (seen.has(key)) return { ok: false, error: 'A link must not appear twice.' };
      seen.add(key);
    }
    // n nodes and n distinct links form "one tree plus one link" exactly when connected.
    const parent = Array.from({ length: n + 1 }, (_, i) => i);
    const find = (x) => {
      while (parent[x] !== x) x = parent[x] = parent[parent[x]];
      return x;
    };
    let components = n;
    for (const [a, b] of edges) {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) {
        parent[ra] = rb;
        components--;
      }
    }
    if (components !== 1) return { ok: false, error: 'The links must connect all n nodes.' };
    return { ok: true, args: [edges] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
