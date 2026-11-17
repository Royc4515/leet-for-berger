/**
 * Problem: Course Check
 *
 * Can every course be finished, given "a needs b first" pairs? Exactly when the prerequisite
 * graph has no directed cycle. Kahn's algorithm takes courses whose prerequisites are all done
 * and counts them: O(V + E), and no recursion, which matters because chains here reach 10^5.
 *
 * Limits are raised from LeetCode's (2000 courses, 5000 pairs) to 10^5 each, so the naive
 * "rescan every pair until nothing changes" approach, O(V * E), times out on a long chain.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_E = 100000;

/**
 * Reference: Kahn's algorithm, counting how many courses can be taken.
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @returns {boolean}
 */
export function reference(numCourses, prerequisites) {
  const indeg = new Int32Array(numCourses);
  const next = Array.from({ length: numCourses }, () => []);
  for (const [a, b] of prerequisites) {
    next[b].push(a);
    indeg[a]++;
  }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  let taken = 0;
  for (let head = 0; head < queue.length; head++) {
    taken++;
    for (const a of next[queue[head]]) if (--indeg[a] === 0) queue.push(a);
  }
  return taken === numCourses;
}

/** Fisher-Yates shuffle with a seeded generator. */
function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** A chain through all n courses in a random label order: order[i] before order[i + 1]. */
function chain(seed, n, closeCycle) {
  const rnd = mulberry32(seed);
  const order = shuffle(Array.from({ length: n }, (_, i) => i), rnd);
  const pairs = [];
  for (let i = 0; i + 1 < n; i++) pairs.push([order[i + 1], order[i]]);
  // The last course becomes a prerequisite of the first: one cycle through every course.
  if (closeCycle) pairs.push([order[0], order[n - 1]]);
  return [n, shuffle(pairs, rnd)];
}

/**
 * e random unique pairs that always point from earlier to later in a hidden order, so the graph
 * is acyclic. With cycleLength > 0, a path through the first cycleLength courses of that order is
 * included and then closed by one backwards pair, giving one long cycle.
 */
function randomDag(seed, n, e, cycleLength) {
  const rnd = mulberry32(seed);
  const order = shuffle(Array.from({ length: n }, (_, i) => i), rnd);
  const seen = new Set();
  const pairs = [];
  const add = (i, j) => {
    if (seen.has(i * n + j)) return;
    seen.add(i * n + j);
    pairs.push([order[j], order[i]]);
  };
  for (let i = 0; i + 1 < cycleLength; i++) add(i, i + 1);
  while (pairs.length < e - (cycleLength ? 1 : 0)) {
    const i = Math.floor(rnd() * n);
    const j = Math.floor(rnd() * n);
    if (i < j) add(i, j);
    else if (j < i) add(j, i);
  }
  // Every other pair goes forwards in the hidden order, so this backwards one is unique.
  if (cycleLength) pairs.push([order[0], order[cycleLength - 1]]);
  return [n, shuffle(pairs, rnd)];
}

const visible = [
  { args: [2, [[1, 0]]], expected: true, note: 'Take course 0, then course 1.' },
  { args: [2, [[1, 0], [0, 1]]], expected: false, note: 'Each course waits for the other.' },
  { args: [3, []], expected: true, note: 'No prerequisites at all.' },
  { args: [4, [[1, 0], [2, 1], [3, 2], [1, 3]]], expected: false, note: 'Courses 1, 2 and 3 form a cycle, so only course 0 can be taken.' },
  { args: [5, [[1, 0], [2, 0], [3, 1], [3, 2], [4, 3]]], expected: true, note: 'Course 3 needs two courses that share a prerequisite. That is not a cycle.' },
];

// Hidden tests: one course, a course that needs itself, a cycle in a component away from course
// 0, a diamond (a "visited means cycle" bug calls it cyclic), and 10^5-course chains and random
// graphs, with and without a cycle, where rescanning all pairs repeatedly is O(V * E).
const hiddenArgs = [
  [1, []],
  [1, [[0, 0]]],
  [6, [[1, 0], [2, 1], [4, 3], [5, 4], [3, 5]]],
  [4, [[1, 0], [2, 0], [3, 1], [3, 2]]],
  [8, [[1, 0], [2, 1], [3, 2], [4, 3], [5, 4], [6, 5], [7, 6], [0, 7]]],
  randomDag(5, 2000, 6000, 0),
  chain(7, MAX_N, false),
  chain(11, MAX_N, true),
  randomDag(13, MAX_N, MAX_E, 0),
  randomDag(17, MAX_N, MAX_E, 50000),
];

/** Shared by the parser: validates a prerequisite pair list for numCourses courses. */
function checkPairs(pairs, n) {
  if (!Array.isArray(pairs) || pairs.length > MAX_E) return 'prerequisites must be an array of at most 10^5 pairs.';
  const seen = new Set();
  for (const p of pairs) {
    if (!Array.isArray(p) || p.length !== 2 || !p.every((v) => Number.isInteger(v) && v >= 0 && v < n)) return 'Each pair must be [a, b] with 0 <= a, b < numCourses.';
    const key = `${p[0]},${p[1]}`;
    if (seen.has(key)) return 'Pairs must be unique.';
    seen.add(key);
  }
  return null;
}

export const problem = {
  id: 'course-check',
  title: 'Course Check',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['Topological Sort', 'Cycle Detection'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['numCourses', 'prerequisites'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>There are <code>numCourses</code> courses numbered <code>0</code> to
    <code>numCourses - 1</code>. Each pair <code>[a, b]</code> in <code>prerequisites</code>
    means course <code>b</code> must be completed before course <code>a</code>.</p>
    <p>Return <code>true</code> if there is an order in which every course can be completed,
    and <code>false</code> otherwise.</p>
    <p>Note: prerequisite chains can be 10^5 courses long, deeper than a recursive search can
    safely go in Python or a browser.</p>
  `,
  constraints: [
    '1 <= numCourses <= 10^5 (raised from LeetCode\'s 2000)',
    '0 <= prerequisites.length <= 10^5 (raised from 5000)',
    '0 <= a, b < numCourses; a may equal b (a course that needs itself)',
    'All pairs are unique',
    'Target complexity: O(numCourses + prerequisites.length) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `numCourses = ${t.args[0]}, prerequisites = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Draw each pair as an arrow from b to a. What shape in that drawing makes finishing impossible?',
    'Which courses can you take right now, before anything else?',
    'After taking a course, how do you know which other courses just became available?',
    'If you keep taking available courses until none are left, what does the number taken tell you?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'canFinish',
    params: [
      { name: 'numCourses', type: 'int' },
      { name: 'prerequisites', type: 'int[][]' },
    ],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: numCourses on the first line, prerequisites as JSON on the second.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: numCourses, then prerequisites as a JSON array of pairs.' };
    let n;
    let pairs;
    try {
      n = JSON.parse(lines[0]);
      pairs = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON.' };
    }
    if (!Number.isInteger(n) || n < 1 || n > MAX_N) return { ok: false, error: 'numCourses must be an integer from 1 to 10^5.' };
    const error = checkPairs(pairs, n);
    if (error) return { ok: false, error };
    return { ok: true, args: [n, pairs] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
