/**
 * Problem: Backup Station
 *
 * Equivalent to LeetCode 3607; statement and tests are written for this project. Stations form
 * grids through cables. A check on an online station is handled by itself; on an offline one it
 * goes to the smallest online station of the same grid. Stations only ever go offline, and an
 * offline station still carries cables, so the grids never change.
 *
 * Reference: union-find once, then for every grid a list of its stations in increasing order and
 * a pointer to the first one that may still be online. Because stations never come back, the
 * pointer only moves forward, so all queries cost O(c + q) amortised.
 *
 * Classic wrong answers: deleting an offline station from the graph (splits a grid at a bridge),
 * answering with the smallest station of the grid without looking at who is offline, answering
 * with the smallest online station of the whole network, and scanning the grid on every query
 * (O(c * q) at 10^5 each).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt, shuffle } from '../../engine/growth-inputs.js';

const MAX_C = 100000;
const MAX_LINKS = 100000;
const MAX_Q = 100000;

/**
 * Reference solution.
 * @param {number} c
 * @param {number[][]} links
 * @param {number[][]} queries
 * @returns {number[]} one answer per type 1 query
 */
export function reference(c, links, queries) {
  const parent = Array.from({ length: c }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (const [u, v] of links) parent[find(u - 1)] = find(v - 1);
  // Stations grouped by grid in increasing order: ids are visited ascending, so every group is
  // already sorted. The stations of the grid with root r are order[start[r] .. start[r + 1]).
  const start = new Array(c + 1).fill(0);
  const root = new Array(c);
  for (let i = 0; i < c; i++) {
    root[i] = find(i);
    start[root[i] + 1]++;
  }
  for (let i = 0; i < c; i++) start[i + 1] += start[i];
  const fill = start.slice(0, c);
  const order = new Array(c);
  for (let i = 0; i < c; i++) order[fill[root[i]]++] = i;
  const ptr = start.slice(0, c);
  const online = new Array(c).fill(true);
  const answers = [];
  for (const [type, x0] of queries) {
    const x = x0 - 1;
    if (type === 2) {
      online[x] = false;
    } else if (online[x]) {
      answers.push(x0);
    } else {
      const r = root[x];
      // don't touch / the pointer only moves forward: a station never comes back online.
      while (ptr[r] < start[r + 1] && !online[order[ptr[r]]]) ptr[r]++;
      answers.push(ptr[r] < start[r + 1] ? order[ptr[r]] + 1 : -1);
    }
  }
  return answers;
}

/** Distinct random cables between `c` stations: `m` pairs, none repeated or reversed. */
function randomLinks(rnd, c, m) {
  const seen = new Set();
  const links = [];
  while (links.length < m) {
    const u = randInt(rnd, 1, c);
    const v = randInt(rnd, 1, c);
    if (u === v) continue;
    const key = Math.min(u, v) * (c + 1) + Math.max(u, v);
    if (seen.has(key)) continue;
    seen.add(key);
    links.push([u, v]);
  }
  return links;
}

/** `q` random queries; a type 1 query appears with probability `checkShare`. */
function randomQueries(rnd, c, q, checkShare) {
  return Array.from({ length: q }, () => [rnd() < checkShare ? 1 : 2, randInt(rnd, 1, c)]);
}

const visible = [
  { args: [5, [[1, 2], [2, 3], [3, 4], [4, 5]], [[1, 3], [2, 1], [2, 3], [1, 3], [1, 2]]], expected: [3, 2, 2], note: 'Station 3 handles its own check; once it and station 1 are offline, station 2 takes over.' },
  { args: [5, [[1, 2], [4, 5]], [[1, 3], [2, 3], [1, 3], [2, 4], [1, 4]]], expected: [3, -1, 5], note: 'Station 3 has no cables: once offline nobody can cover for it. Station 4 is covered by 5.' },
  { args: [3, [[1, 2], [2, 3]], [[2, 2], [1, 2], [1, 3]]], expected: [1, 3], note: 'Station 2 is offline but its cables still join 1 and 3 into one grid.' },
  { args: [4, [], [[2, 1], [1, 1], [1, 2], [1, 4]]], expected: [-1, 2, 4], note: 'No cables: every station is its own grid.' },
  { args: [3, [[1, 2], [2, 3], [1, 3]], [[2, 1], [2, 2], [2, 3], [1, 2], [1, 1]]], expected: [-1, -1], note: 'A whole grid offline has no backup.' },
];

// Hidden tests: one station, a bridge station that goes offline, small and mid random networks,
// a 10^5-station line where the first half goes offline (scanning the grid on each of the 5 * 10^4
// checks is quadratic), a star, 5 * 10^4 two-station grids, random 10^5 networks with mixed and
// check-heavy traffic, and a grid that goes completely offline before it is checked.
const hiddenArgs = (() => {
  const rnd = mulberry32(3607);
  const lineLinks = shuffle(Array.from({ length: MAX_C - 1 }, (_, i) => [i + 1, i + 2]), rnd);
  const lineQueries = [
    ...Array.from({ length: 50000 }, (_, i) => [2, i + 1]),
    ...Array.from({ length: 50000 }, (_, i) => [1, i + 1]),
  ];
  const starLinks = shuffle(Array.from({ length: MAX_C - 1 }, (_, i) => [1, i + 2]), rnd);
  const pairLinks = Array.from({ length: 50000 }, (_, i) => [2 * i + 1, 2 * i + 2]);
  const allOff = [...Array.from({ length: 999 }, (_, i) => [2, i + 1]), ...Array.from({ length: 999 }, (_, i) => [1, i + 1])];
  const treeLinks = Array.from({ length: 999 }, (_, i) => [i + 2, 1 + Math.floor(rnd() * (i + 1))]);
  return [
    [1, [], [[1, 1], [2, 1], [1, 1]]],
    [6, [[1, 2], [2, 3], [5, 6]], [[2, 2], [1, 3], [1, 1], [2, 1], [1, 1], [1, 6], [2, 5], [1, 5], [1, 4]]],
    [12, randomLinks(rnd, 12, 8), randomQueries(rnd, 12, 40, 0.5)],
    [2000, randomLinks(rnd, 2000, 1500), randomQueries(rnd, 2000, 3000, 0.5)],
    [MAX_C, lineLinks, lineQueries],
    [MAX_C, starLinks, randomQueries(rnd, MAX_C, MAX_Q, 0.4)],
    [MAX_C, pairLinks, randomQueries(rnd, MAX_C, MAX_Q, 0.5)],
    [MAX_C, randomLinks(rnd, MAX_C, MAX_LINKS), randomQueries(rnd, MAX_C, MAX_Q, 0.5)],
    [MAX_C, randomLinks(rnd, MAX_C, 30000), randomQueries(rnd, MAX_C, MAX_Q, 0.8)],
    [1000, treeLinks, allOff],
  ];
})();

export const problem = {
  id: 'backup-station',
  title: 'Backup Station',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['Union-Find', 'Pointer per Group', 'Offline Processing'],
  timeLimitMs: 3000,
  argNames: ['c', 'links', 'queries'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A region has <code>c</code> power stations numbered <code>1</code> to <code>c</code>, all
    online at the start. Each <code>links[i] = [u, v]</code> is a cable between stations
    <code>u</code> and <code>v</code>. Stations joined by cables, directly or through other
    stations, form one <em>grid</em>.</p>
    <p>Each <code>queries[j]</code> is one of:</p>
    <ul>
      <li><code>[1, x]</code>: a check is requested for station <code>x</code>. If
      <code>x</code> is online it handles the check itself and the answer is <code>x</code>.
      Otherwise the answer is the smallest-numbered online station in the grid of <code>x</code>,
      or <code>-1</code> if every station of that grid is offline.</li>
      <li><code>[2, x]</code>: station <code>x</code> goes offline. It never comes back, but its
      cables stay: it still belongs to the same grid and still connects its neighbours.</li>
    </ul>
    <p>Return the answers to the type 1 queries, in the order they were asked.</p>
  `,
  constraints: [
    '1 <= c <= 10^5',
    '0 <= links.length <= 10^5; 1 <= u, v <= c; u != v; no pair of stations is linked twice',
    '1 <= queries.length <= 10^5; each query is [1, x] or [2, x] with 1 <= x <= c',
    'The same station can be sent offline more than once',
    'Target complexity: near O(c + links.length + queries.length)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `c = ${t.args[0]}, links = ${JSON.stringify(t.args[1])}, queries = ${JSON.stringify(t.args[2])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Do the grids ever change while the queries run? What actually changes when a station goes offline?',
    'If you scanned the whole grid on every check, what would 10^5 checks on a 10^5-station grid cost?',
    'Could you work out each grid once, before answering anything, and keep its stations in increasing order?',
    'A station never comes back online. What does that tell you about the smallest online station of a grid as time passes: can it ever move backwards?',
    'How would a single pointer per grid, moved only forward, give the answer without rescanning?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Group the stations into grids once with union-find, and keep each grid's stations in increasing
    order. For each grid remember a pointer to the first station that might still be online. A check
    on an offline station moves that pointer past every offline station and reads the answer under it.</p>
    <h4>Why it works</h4>
    <p>Going offline never changes the cables, so the grids are fixed and one union-find pass is enough.
    Stations only go offline, never online, so a station skipped by the pointer stays offline: the
    pointer never needs to move back. Each station is skipped at most once, so all checks together
    cost O(c) plus O(1) per query.</p>
    <h4>Complexity</h4>
    <p>Nearly O(c + links) for the union-find and the ordered groups, and O(c + queries) for the
    queries. A heap or an ordered set per grid works too, at an extra log factor.</p>
    <h4>Pitfall</h4>
    <p>Do not delete an offline station from the graph: a station in the middle of a line carries
    the cables between its neighbours, and removing it would split one grid in two. Do not answer
    with the smallest station of the grid without checking whether it is offline, and an online
    <code>x</code> always answers itself even when a smaller station is online.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'backupStations',
    params: [
      { name: 'c', type: 'int' },
      { name: 'links', type: 'int[][]' },
      { name: 'queries', type: 'int[][]' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: three lines, c, links (JSON) and queries (JSON).
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 3) return { ok: false, error: 'Enter three lines: c, links as a JSON array of [u, v], then queries as a JSON array of [type, x].' };
    let c;
    let links;
    let queries;
    try {
      [c, links, queries] = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'All three lines must be valid JSON.' };
    }
    if (!Number.isInteger(c) || c < 1 || c > MAX_C) return { ok: false, error: 'c must be an integer from 1 to 10^5.' };
    if (!Array.isArray(links) || links.length > MAX_LINKS) return { ok: false, error: 'links must be an array of at most 10^5 pairs.' };
    const seen = new Set();
    for (const l of links) {
      if (!Array.isArray(l) || l.length !== 2 || !l.every(Number.isInteger)) return { ok: false, error: 'Each link must be two integers [u, v].' };
      if (l[0] < 1 || l[0] > c || l[1] < 1 || l[1] > c || l[0] === l[1]) return { ok: false, error: 'u and v must differ and be from 1 to c.' };
      const key = Math.min(l[0], l[1]) * (c + 1) + Math.max(l[0], l[1]);
      if (seen.has(key)) return { ok: false, error: 'No pair of stations may be linked twice.' };
      seen.add(key);
    }
    if (!Array.isArray(queries) || queries.length < 1 || queries.length > MAX_Q) return { ok: false, error: 'queries must be an array of 1 to 10^5 items.' };
    for (const q of queries) {
      if (!Array.isArray(q) || q.length !== 2 || !(q[0] === 1 || q[0] === 2) || !Number.isInteger(q[1]) || q[1] < 1 || q[1] > c) {
        return { ok: false, error: 'Each query must be [1, x] or [2, x] with x from 1 to c.' };
      }
    }
    return { ok: true, args: [c, links, queries] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1], args[2]),

  // Grids are chains of 8 stations, the first half of the stations goes offline in order, and the
  // checks then land on them (an offline station always, so every check walks a pointer). Labels
  // and checks are local, so memory access stays cache friendly and the time follows n: a random
  // graph read steeper than linear once its arrays outgrew the cache.
  growth: {
    target: 'n',
    n: 'c = queries.length',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const links = [];
      for (let i = 1; i < n; i++) if (i % 8 !== 0) links.push([i, i + 1]);
      const half = n >> 1;
      const queries = [];
      for (let i = 1; i <= half; i++) queries.push([2, i]);
      const checks = n - half;
      for (let i = 0; i < checks; i++) queries.push([1, 1 + Math.floor((i * half) / checks) + randInt(rnd, 0, 3)]);
      return [n, links, queries];
    },
  },
};

export default problem;
