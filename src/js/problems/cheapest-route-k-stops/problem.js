/**
 * Problem: Cheapest Route Within K Stops
 *
 * Cheapest directed route from src to dst using at most k + 1 flights. A plain Dijkstra on cost
 * alone is wrong: the cheapest way into a city may already have used too many flights, while a
 * pricier way in with fewer flights is the one that still reaches dst. Bellman-Ford limited to
 * k + 1 rounds is exact, provided every round relaxes from a copy of the previous round's
 * costs (relaxing in place lets one round chain several flights). O(k * E).
 *
 * Targeted mistakes: in-place relaxation on flights listed in route order, Dijkstra that closes a
 * city on its cheapest cost, stops counted as flights (off by one), a reversed flight, and path
 * enumeration on a complete 100-city graph (exponential).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100;
const MAX_PRICE = 10000;

/**
 * Reference: k + 1 rounds of Bellman-Ford, each reading the previous round's costs.
 * @param {number} n
 * @param {number[][]} flights
 * @param {number} src
 * @param {number} dst
 * @param {number} k
 * @returns {number}
 */
export function reference(n, flights, src, dst, k) {
  let dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  for (let round = 0; round <= k; round++) {
    const next = [...dist];
    for (const [from, to, price] of flights) {
      if (dist[from] + price < next[to]) next[to] = dist[from] + price;
    }
    dist = next;
  }
  return dist[dst] === Infinity ? -1 : dist[dst];
}

/** Random directed graph with distinct (from, to) pairs; `density` is the chance of each pair. */
function randomCase(seed, n, density, k, maxPrice) {
  const rnd = mulberry32(seed);
  const flights = [];
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      if (u !== v && rnd() < density) flights.push([u, v, 1 + Math.floor(rnd() * maxPrice)]);
    }
  }
  shuffle(flights, rnd);
  return [n, flights, 0, n - 1, k];
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
 * Complete graph on every city except dst, which nobody flies to: the answer is -1, but a
 * search that enumerates routes up to k + 1 flights explores 98^k of them.
 */
function noWayIn(seed) {
  const rnd = mulberry32(seed);
  const flights = [];
  for (let u = 0; u < MAX_N; u++) {
    for (let v = 0; v < MAX_N - 1; v++) {
      if (u !== v) flights.push([u, v, 1 + Math.floor(rnd() * MAX_PRICE)]);
    }
  }
  return [MAX_N, shuffle(flights, rnd), 0, MAX_N - 1, MAX_N - 2];
}

/**
 * A cheap 100-city chain 0 -> 1 -> ... -> 99 listed in route order, plus pricier shortcuts. With
 * k = 5, relaxing in place walks the whole chain in one round and reports a too-cheap price.
 */
function chainWithShortcuts(seed) {
  const rnd = mulberry32(seed);
  const flights = [];
  for (let v = 1; v < MAX_N; v++) flights.push([v - 1, v, 1]);
  for (let i = 0; i < 400; i++) {
    const u = Math.floor(rnd() * MAX_N);
    const v = u + 10 + Math.floor(rnd() * 40);
    if (v < MAX_N && !flights.some(([a, b]) => a === u && b === v)) flights.push([u, v, 50 + Math.floor(rnd() * 500)]);
  }
  return [MAX_N, flights, 0, MAX_N - 1, 5];
}

const visible = [
  { args: [4, [[0, 1, 50], [1, 2, 50], [2, 3, 50], [1, 3, 300], [0, 3, 500]], 0, 3, 1], expected: 350, note: 'One stop allowed: 0 -> 1 -> 3 costs 350. The 150 route needs two stops.' },
  { args: [4, [[0, 1, 50], [1, 2, 50], [2, 3, 50], [1, 3, 300], [0, 3, 500]], 0, 3, 2], expected: 150, note: 'Two stops allowed: 0 -> 1 -> 2 -> 3 costs 150.' },
  { args: [4, [[0, 1, 50], [1, 2, 50], [2, 3, 50], [1, 3, 300], [0, 3, 500]], 0, 3, 0], expected: 500, note: 'No stops: only the direct flight counts.' },
  { args: [3, [[0, 1, 10], [1, 2, 10]], 0, 2, 0], expected: -1, note: 'Reaching 2 needs one stop, and none is allowed.' },
  { args: [2, [[1, 0, 5]], 0, 1, 1], expected: -1, note: 'Flights are one-way: 1 -> 0 does not take you from 0 to 1.' },
];

// Hidden tests: Dijkstra-on-cost trap, in-place relaxation trap (flights in route order), a
// route that exists only with too many stops, k larger than needed, a cycle back through src,
// mid-size random graphs, and three 100-city inputs where enumerating routes explodes.
const hiddenArgs = [
  [4, [[0, 1, 1], [1, 2, 1], [0, 2, 5], [2, 3, 1]], 0, 3, 1],
  [5, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [0, 4, 100]], 0, 4, 1],
  [5, [[0, 1, 5], [1, 2, 5], [2, 3, 5], [3, 4, 5]], 0, 4, 2],
  [3, [[0, 1, 2], [1, 0, 1], [1, 2, 7], [0, 2, 10]], 0, 2, 2],
  [5, [[3, 0, 1], [0, 1, 4], [1, 2, 4], [2, 0, 1], [2, 4, 3], [1, 4, 20]], 3, 4, 3],
  randomCase(7, 15, 0.25, 3, 50),
  randomCase(11, 60, 0.15, 10, 1000),
  randomCase(13, MAX_N, 1, MAX_N - 1, MAX_PRICE),
  noWayIn(17),
  chainWithShortcuts(19),
];

export const problem = {
  id: 'cheapest-route-k-stops',
  title: 'Cheapest Route Within K Stops',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['Bellman-Ford', 'Shortest Path', 'Bounded Hops'],
  timeLimitMs: 3000,
  argNames: ['n', 'flights', 'src', 'dst', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>There are <code>n</code> cities numbered <code>0</code> to <code>n - 1</code>. Each
    <code>flights[i] = [from, to, price]</code> is a one-way flight from <code>from</code> to
    <code>to</code> costing <code>price</code>.</p>
    <p>Return the cheapest total price to travel from <code>src</code> to <code>dst</code> with
    <strong>at most <code>k</code> stops</strong>, that is, at most <code>k + 1</code> flights.
    The cities you change planes in are the stops; <code>src</code> and <code>dst</code> are
    not. Return <code>-1</code> if no such route exists.</p>
  `,
  constraints: [
    '2 <= n <= 100',
    '0 <= flights.length <= n * (n - 1)',
    '0 <= from, to < n; from != to; at most one flight per ordered pair (from, to)',
    '1 <= price <= 10^4',
    '0 <= src, dst, k < n; src != dst',
    'Target complexity: O(k * flights.length) (enumerating routes is exponential)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}, flights = ${JSON.stringify(t.args[1])}, src = ${t.args[2]}, dst = ${t.args[3]}, k = ${t.args[4]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you knew the cheapest cost to every city using at most j flights, how would you get the costs for j + 1 flights?',
    'Why can the cheapest way into a city be the wrong one to keep, when stops are limited?',
    'While you update costs for round j + 1, which round\'s costs should a flight read from?',
    'How many rounds does a limit of k stops allow?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>At most <code>k</code> stops means at most <code>k + 1</code> flights. Run Bellman-Ford for exactly
    <code>k + 1</code> rounds: after round <code>j</code>, <code>dist</code> holds the cheapest cost to each
    city using at most <code>j</code> flights.</p>
    <h4>Why it works</h4>
    <p>A route with <code>j + 1</code> flights is a route with <code>j</code> flights plus one more. Each
    round extends every best <code>j</code>-flight cost by one flight. To make a round add only one
    flight, every flight reads its source cost from a copy of the previous round. If a round changes
    nothing, later rounds cannot either, so the loop stops early.</p>
    <h4>Complexity</h4>
    <p>O(k * E) time: up to <code>k + 1</code> passes over the flights. O(n) space for the two cost
    arrays. Enumerating every route is exponential on a dense graph.</p>
    <h4>Pitfall</h4>
    <p>Relaxing in place lets one round chain several flights listed in route order, breaking the stop
    limit. A plain Dijkstra on cost alone is also wrong: the cheapest way into a city may have used
    too many flights, while a pricier one with fewer flights still reaches <code>dst</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'findCheapestPrice',
    params: [
      { name: 'n', type: 'int' },
      { name: 'flights', type: 'int[][]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: five lines, n, flights (JSON), src, dst and k.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 5) return { ok: false, error: 'Enter five lines: n, flights as a JSON array of [from, to, price], then src, dst and k.' };
    let values;
    try {
      values = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'Every line must be valid JSON.' };
    }
    const [n, flights, src, dst, k] = values;
    if (!Number.isInteger(n) || n < 2 || n > MAX_N) return { ok: false, error: 'n must be an integer from 2 to 100.' };
    if (!Array.isArray(flights) || flights.length > n * (n - 1)) return { ok: false, error: 'flights must be an array of at most n * (n - 1) flights.' };
    const seen = new Set();
    for (const f of flights) {
      if (!Array.isArray(f) || f.length !== 3 || !f.every(Number.isInteger)) return { ok: false, error: 'Each flight must be three integers [from, to, price].' };
      const [u, v, p] = f;
      if (u < 0 || u >= n || v < 0 || v >= n || u === v) return { ok: false, error: 'from and to must differ and be from 0 to n - 1.' };
      if (p < 1 || p > MAX_PRICE) return { ok: false, error: 'price must be from 1 to 10^4.' };
      if (seen.has(u * MAX_N + v)) return { ok: false, error: 'At most one flight per ordered pair (from, to).' };
      seen.add(u * MAX_N + v);
    }
    for (const [name, v] of [['src', src], ['dst', dst], ['k', k]]) {
      if (!Number.isInteger(v) || v < 0 || v >= n) return { ok: false, error: `${name} must be an integer from 0 to n - 1.` };
    }
    if (src === dst) return { ok: false, error: 'src and dst must differ.' };
    return { ok: true, args: [n, flights, src, dst, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1], args[2], args[3], args[4]),
};

export default problem;
