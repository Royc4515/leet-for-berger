/**
 * Problem: Signal Spread
 *
 * A signal leaves node k and travels along weighted directed links; when has every node heard
 * it? That is the largest shortest-path distance from k, or -1 if some node is unreachable.
 * Weights are non-negative, so Dijkstra with a binary heap gives O((V + E) log V).
 *
 * Limits are raised past the usual 100 nodes to 10^5 nodes and 2 * 10^5 links, so the O(V^2)
 * array Dijkstra and Bellman-Ford both time out. Targeted mistakes: BFS by hop count, marking a
 * node done when it is pushed rather than popped, zero-weight links, parallel links, returning
 * the sum instead of the maximum, and forgetting the unreachable case.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_E = 200000;
const MAX_W = 10000;

/**
 * Reference: Dijkstra with a binary heap of [distance, node] and lazy deletion.
 * @param {number[][]} times
 * @param {number} n
 * @param {number} k
 * @returns {number}
 */
export function reference(times, n, k) {
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push(v, w);
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  const heap = [[0, k]];
  const less = (a, b) => heap[a][0] < heap[b][0];
  const swap = (a, b) => ([heap[a], heap[b]] = [heap[b], heap[a]]);
  while (heap.length) {
    const [d, u] = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && less(l, m)) m = l;
        if (r < heap.length && less(r, m)) m = r;
        if (m === i) break;
        swap(i, m);
        i = m;
      }
    }
    if (d > dist[u]) continue;
    const list = adj[u];
    for (let j = 0; j < list.length; j += 2) {
      const v = list[j];
      const nd = d + list[j + 1];
      if (nd < dist[v]) {
        dist[v] = nd;
        heap.push([nd, v]);
        for (let i = heap.length - 1; i > 0;) {
          const p = (i - 1) >> 1;
          if (!less(i, p)) break;
          swap(i, p);
          i = p;
        }
      }
    }
  }
  let worst = 0;
  for (let v = 1; v <= n; v++) worst = Math.max(worst, dist[v]);
  return worst === Infinity ? -1 : worst;
}

/** Random links on nodes 1..n (parallel links allowed), plus a spanning path when `connected`. */
function randomCase(seed, n, e, maxW, connected) {
  const rnd = mulberry32(seed);
  const times = [];
  const pick = () => 1 + Math.floor(rnd() * n);
  if (connected) {
    // A random order of the nodes, chained, so every node is reachable from the first.
    const order = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let i = 1; i < n; i++) times.push([order[i - 1], order[i], Math.floor(rnd() * (maxW + 1))]);
    while (times.length < e) {
      const u = pick();
      const v = pick();
      if (u !== v) times.push([u, v, Math.floor(rnd() * (maxW + 1))]);
    }
    return [shuffle(times, rnd), n, order[0]];
  }
  while (times.length < e) {
    const u = pick();
    const v = pick();
    if (u !== v) times.push([u, v, Math.floor(rnd() * (maxW + 1))]);
  }
  return [times, n, pick()];
}

/** Fisher-Yates with the seeded generator. */
function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * A 10^5-node path 1 -> 2 -> ... -> n of weight-1 links, plus 5 * 10^4 heavy shortcuts that look
 * good by hop count. Dijkstra settles it quickly; a label-correcting search that keeps improving nodes
 * along the path does quadratic work.
 */
function pathWithShortcuts(seed) {
  const rnd = mulberry32(seed);
  const times = [];
  for (let v = 2; v <= MAX_N; v++) times.push([v - 1, v, 1]);
  while (times.length < MAX_N + 50000) {
    const u = 1 + Math.floor(rnd() * (MAX_N - 1));
    const v = Math.min(MAX_N, u + 1 + Math.floor(rnd() * 1000));
    times.push([u, v, (v - u) * 2 + Math.floor(rnd() * 5)]);
  }
  times.reverse();
  return [times, MAX_N, 1];
}

const visible = [
  { args: [[[1, 2, 4], [1, 3, 1], [3, 2, 1], [2, 4, 2]], 4, 1], expected: 4, note: '1 -> 3 -> 2 reaches node 2 at time 2, then node 4 hears it at time 4.' },
  { args: [[[1, 2, 3], [1, 3, 4]], 3, 2], expected: -1, note: 'Links are one-way: from node 2 the signal reaches neither node 1 nor node 3.' },
  { args: [[[2, 1, 5], [2, 3, 5]], 3, 2], expected: 5, note: 'Both neighbours hear it at time 5; the answer is the latest arrival, not the sum.' },
  { args: [[[1, 2, 1], [2, 3, 1], [1, 3, 10]], 3, 1], expected: 2, note: 'Two cheap links beat one expensive direct link.' },
  { args: [[[1, 2, 0], [2, 3, 0]], 3, 1], expected: 0, note: 'Zero-delay links: every node hears it immediately.' },
];

// Hidden tests: a single node, an unreachable node among reachable ones, parallel links, the
// push-time "visited" trap, hop count versus weight, a small random graph, two graphs of
// 2 * 10^4 nodes (one with unreachable nodes, one with tiny weights), and two at 10^5 nodes
// (2 * 10^5 random links, and a long path with shortcuts) where O(V^2) Dijkstra or Bellman-Ford
// times out.
const hiddenArgs = [
  [[], 1, 1],
  [[[1, 2, 1], [2, 3, 1], [3, 1, 1], [4, 1, 1]], 4, 1],
  [[[1, 2, 9], [1, 2, 3], [2, 1, 1], [1, 2, 7]], 2, 1],
  [[[1, 2, 1], [1, 3, 10], [2, 4, 1], [4, 3, 1], [3, 5, 1]], 5, 1],
  [[[3, 1, 100], [3, 2, 1], [2, 4, 1], [4, 5, 1], [5, 1, 1], [1, 6, 0]], 6, 3],
  randomCase(7, 200, 1000, 50, true),
  randomCase(11, MAX_N, MAX_E, MAX_W, true),
  randomCase(13, 20000, 40000, MAX_W, false),
  randomCase(17, 20000, 40000, 3, true),
  pathWithShortcuts(19),
];

export const problem = {
  id: 'signal-spread',
  title: 'Signal Spread',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ["Dijkstra's Algorithm", 'Shortest Path', 'Heap'],
  milestone: 2,
  timeLimitMs: 5000,
  argNames: ['times', 'n', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A network has <code>n</code> nodes labelled <code>1</code> to <code>n</code>. Each
    <code>times[i] = [u, v, w]</code> is a one-way link: a signal at <code>u</code> reaches
    <code>v</code> <code>w</code> time units later. There may be several links between the same
    two nodes.</p>
    <p>At time 0, node <code>k</code> sends a signal, which spreads along every link. Return the
    time at which the last node receives it, or <code>-1</code> if some node never does.</p>
  `,
  constraints: [
    '1 <= n <= 10^5 (raised from the usual 100)',
    '0 <= times.length <= 2 * 10^5',
    '1 <= u, v, k <= n; u != v',
    '0 <= w <= 10^4',
    'Target complexity: O((V + E) log V) (O(V^2) or O(V * E) times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `times = ${JSON.stringify(t.args[0])}, n = ${t.args[1]}, k = ${t.args[2]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'When does the last node hear the signal, in terms of each node\'s earliest arrival time?',
    'Why does plain BFS, counting links, give wrong arrival times here?',
    'Among the nodes not yet settled, which one\'s arrival time can no longer improve?',
    'How do you find that node quickly when there are 10^5 of them?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'networkDelayTime',
    params: [
      { name: 'times', type: 'int[][]' },
      { name: 'n', type: 'int' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: three lines, times (JSON), n and k.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 3) return { ok: false, error: 'Enter three lines: times as a JSON array of [u, v, w], then n and k.' };
    let times;
    let n;
    let k;
    try {
      [times, n, k] = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'All three lines must be valid JSON.' };
    }
    if (!Number.isInteger(n) || n < 1 || n > MAX_N) return { ok: false, error: 'n must be an integer from 1 to 10^5.' };
    if (!Number.isInteger(k) || k < 1 || k > n) return { ok: false, error: 'k must be an integer from 1 to n.' };
    if (!Array.isArray(times) || times.length > MAX_E) return { ok: false, error: 'times must be an array of at most 2 * 10^5 links.' };
    for (const t of times) {
      if (!Array.isArray(t) || t.length !== 3 || !t.every(Number.isInteger)) return { ok: false, error: 'Each link must be three integers [u, v, w].' };
      if (t[0] < 1 || t[0] > n || t[1] < 1 || t[1] > n || t[0] === t[1]) return { ok: false, error: 'u and v must differ and be from 1 to n.' };
      if (t[2] < 0 || t[2] > MAX_W) return { ok: false, error: 'w must be from 0 to 10^4.' };
    }
    return { ok: true, args: [times, n, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1], args[2]),
};

export default problem;
