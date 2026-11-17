/**
 * Problem: Course Finish Time
 *
 * Courses take time[i] months, any number run in parallel, and a course starts only after all
 * of its prerequisites end. The finish time of a course is its own time plus the latest finish
 * among its prerequisites, so the answer is the heaviest path in a DAG. Kahn's topological
 * order computes every finish time in O(n + m).
 *
 * Targeted mistakes: summing all times (no parallelism), the longest path by number of courses
 * instead of by months, taking the first prerequisite instead of the latest, a recursive
 * memoised DFS on a 5 * 10^4-course chain (too deep), and a DFS without memoisation on a
 * layered graph with 2^(layers) paths.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 50000;
const MAX_M = 50000;
const MAX_T = 10000;

/**
 * Reference: Kahn's algorithm; a course's finish time is final once its last prerequisite is
 * processed.
 * @param {number} n
 * @param {number[][]} relations
 * @param {number[]} time
 * @returns {number}
 */
export function reference(n, relations, time) {
  const next = Array.from({ length: n + 1 }, () => []);
  const indeg = new Array(n + 1).fill(0);
  for (const [a, b] of relations) {
    next[a].push(b);
    indeg[b]++;
  }
  const start = new Array(n + 1).fill(0);
  const queue = [];
  for (let v = 1; v <= n; v++) if (indeg[v] === 0) queue.push(v);
  let answer = 0;
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    const finish = start[u] + time[u - 1];
    answer = Math.max(answer, finish);
    for (const v of next[u]) {
      start[v] = Math.max(start[v], finish);
      if (--indeg[v] === 0) queue.push(v);
    }
  }
  return answer;
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
 * Random DAG: a hidden random order of the courses, and `m` distinct relations that always go
 * forward in it. `span` limits how far forward a relation may reach.
 */
function randomDag(seed, n, m, span, maxT) {
  const rnd = mulberry32(seed);
  const order = shuffle(Array.from({ length: n }, (_, i) => i + 1), rnd);
  const seen = new Set();
  const relations = [];
  while (relations.length < m) {
    const i = Math.floor(rnd() * (n - 1));
    const j = Math.min(n - 1, i + 1 + Math.floor(rnd() * span));
    const key = order[i] * (n + 1) + order[j];
    if (seen.has(key)) continue;
    seen.add(key);
    relations.push([order[i], order[j]]);
  }
  const time = Array.from({ length: n }, () => 1 + Math.floor(rnd() * maxT));
  return [n, relations, time];
}

/** One chain of every course, numbered backwards, so recursion along it goes n deep. */
function chain(seed, n) {
  const rnd = mulberry32(seed);
  const relations = [];
  for (let v = n; v > 1; v--) relations.push([v, v - 1]);
  const time = Array.from({ length: n }, () => 1 + Math.floor(rnd() * MAX_T));
  return [n, shuffle(relations, rnd), time];
}

/**
 * Layers of two courses, each layer fully after the previous one: 2^layers paths from the
 * first layer to the last, which a DFS without memoisation walks one by one.
 */
function lattice(seed, layers) {
  const rnd = mulberry32(seed);
  const n = 2 * layers;
  const relations = [];
  for (let l = 0; l + 1 < layers; l++) {
    for (const a of [2 * l + 1, 2 * l + 2]) for (const b of [2 * l + 3, 2 * l + 4]) relations.push([a, b]);
  }
  const time = Array.from({ length: n }, () => 1 + Math.floor(rnd() * MAX_T));
  return [n, relations, time];
}

const visible = [
  { args: [3, [[1, 3], [2, 3]], [4, 6, 2]], expected: 8, note: 'Courses 1 and 2 run together; course 3 starts when course 2 ends at month 6.' },
  { args: [5, [[1, 2], [1, 3], [3, 4], [2, 5], [4, 5]], [2, 9, 1, 3, 4]], expected: 15, note: 'Course 5 waits for its later prerequisite: course 2 ends at month 2 + 9 = 11.' },
  { args: [4, [], [2, 7, 1, 3]], expected: 7, note: 'No prerequisites: everything runs in parallel.' },
  { args: [4, [[1, 2], [2, 3], [1, 4]], [1, 1, 1, 10]], expected: 11, note: 'The longest path counts months, not courses: 1 -> 4 beats 1 -> 2 -> 3.' },
  { args: [1, [], [10000]], expected: 10000, note: 'A single course.' },
];

// Hidden tests: prerequisites listed against numbering order, two independent chains, a
// course with many prerequisites, a diamond, small and mid-size random DAGs, a 2^20-path
// lattice, the 5 * 10^4 chain (too deep for recursion), and random DAGs at full size.
const hiddenArgs = [
  [3, [[3, 2], [2, 1]], [4, 5, 6]],
  [6, [[1, 2], [2, 3], [4, 5], [5, 6]], [5, 5, 5, 1, 1, 20]],
  [6, [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6]], [9, 3, 12, 1, 7, 2]],
  [4, [[1, 2], [1, 3], [2, 4], [3, 4]], [2, 6, 3, 1]],
  randomDag(7, 12, 20, 4, 20),
  randomDag(11, 2000, 4000, 50, 1000),
  lattice(13, 20),
  chain(17, MAX_N),
  randomDag(19, MAX_N, MAX_M, 3, MAX_T),
  randomDag(23, MAX_N, MAX_M, 2000, MAX_T),
];

export const problem = {
  id: 'course-finish-time',
  title: 'Course Finish Time',
  difficulty: 'Hard',
  topics: ['graphs', 'dp'],
  patterns: ['Topological Sort', 'DAG Longest Path', 'Dynamic Programming'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['n', 'relations', 'time'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>There are <code>n</code> courses numbered <code>1</code> to <code>n</code>. Course
    <code>i</code> takes <code>time[i - 1]</code> months. Each
    <code>relations[j] = [prev, next]</code> says course <code>prev</code> must be finished
    before course <code>next</code> can start. The prerequisites contain no cycle.</p>
    <p>Any number of courses can run at the same time, and a course may start as soon as all of
    its prerequisites are finished. Return the minimum number of months needed to finish every
    course.</p>
    <p>Note: prerequisites can form a chain of all 5 * 10^4 courses, deeper than a recursive
    search can go in Python or a browser.</p>
  `,
  constraints: [
    '1 <= n <= 5 * 10^4',
    '0 <= relations.length <= 5 * 10^4',
    '1 <= prev, next <= n; prev != next; all pairs distinct',
    'The prerequisite graph has no cycle',
    '1 <= time[i] <= 10^4',
    'Target complexity: O(n + relations.length)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}, relations = ${JSON.stringify(t.args[1])}, time = ${JSON.stringify(t.args[2])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'When is the earliest moment a course can start, given when its prerequisites end?',
    'In which order must you process the courses so that every prerequisite is done first?',
    'How does counting the unfinished prerequisites of each course give you that order?',
    'Is the answer the finish time of the last course processed, or something else?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'minimumTime',
    params: [
      { name: 'n', type: 'int' },
      { name: 'relations', type: 'int[][]' },
      { name: 'time', type: 'int[]' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: three lines, n, relations (JSON) and time (JSON). A cycle is rejected.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 3) return { ok: false, error: 'Enter three lines: n, relations as a JSON array of [prev, next], then time as a JSON array.' };
    let n;
    let relations;
    let time;
    try {
      [n, relations, time] = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'All three lines must be valid JSON.' };
    }
    if (!Number.isInteger(n) || n < 1 || n > MAX_N) return { ok: false, error: 'n must be an integer from 1 to 5 * 10^4.' };
    if (!Array.isArray(relations) || relations.length > MAX_M) return { ok: false, error: 'relations must be an array of at most 5 * 10^4 pairs.' };
    const seen = new Set();
    for (const r of relations) {
      if (!Array.isArray(r) || r.length !== 2 || !r.every(Number.isInteger)) return { ok: false, error: 'Each relation must be two integers [prev, next].' };
      if (r[0] < 1 || r[0] > n || r[1] < 1 || r[1] > n || r[0] === r[1]) return { ok: false, error: 'prev and next must differ and be from 1 to n.' };
      if (seen.has(r[0] * (n + 1) + r[1])) return { ok: false, error: 'Relations must be distinct.' };
      seen.add(r[0] * (n + 1) + r[1]);
    }
    if (!Array.isArray(time) || time.length !== n || !time.every((t) => Number.isInteger(t) && t >= 1 && t <= MAX_T)) return { ok: false, error: 'time must hold n integers from 1 to 10^4.' };
    if (hasCycle(n, relations)) return { ok: false, error: 'The prerequisites must not contain a cycle.' };
    return { ok: true, args: [n, relations, time] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1], args[2]),
};

/** Kahn's algorithm leaves some course unprocessed exactly when there is a cycle. */
function hasCycle(n, relations) {
  const next = Array.from({ length: n + 1 }, () => []);
  const indeg = new Array(n + 1).fill(0);
  for (const [a, b] of relations) {
    next[a].push(b);
    indeg[b]++;
  }
  const queue = [];
  for (let v = 1; v <= n; v++) if (indeg[v] === 0) queue.push(v);
  for (let head = 0; head < queue.length; head++) for (const v of next[queue[head]]) if (--indeg[v] === 0) queue.push(v);
  return queue.length !== n;
}

export default problem;
