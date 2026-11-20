/**
 * Problem: Course Order
 *
 * Return an order in which all courses can be taken. Many orders are usually valid, so the
 * answer is pinned down: the lexicographically smallest one. Kahn's algorithm with a min-heap
 * instead of a FIFO queue produces exactly that, because at every step taking the smallest
 * available course can never block a smaller choice later. O((V + E) log V).
 *
 * Limits are raised from LeetCode's 2000 courses to 10^5 courses and 10^5 pairs, so "scan every
 * course for the smallest available one" at each of V steps, O(V^2), times out.
 */

import { mulberry32 } from '../../engine/rng.js';
import { edgeList } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_E = 100000;

/** Minimal binary min-heap of integers. */
class MinHeap {
  constructor() {
    this.a = [];
  }

  get size() {
    return this.a.length;
  }

  push(v) {
    const a = this.a;
    a.push(v);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p] <= a[i]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }

  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l] < a[m]) m = l;
        if (r < a.length && a[r] < a[m]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * Reference: Kahn's algorithm, always taking the smallest available course.
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @returns {number[]}
 */
export function reference(numCourses, prerequisites) {
  const indeg = new Int32Array(numCourses);
  const next = Array.from({ length: numCourses }, () => []);
  for (const [a, b] of prerequisites) {
    next[b].push(a);
    indeg[a]++;
  }
  const heap = new MinHeap();
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) heap.push(i);
  const order = [];
  while (heap.size) {
    const c = heap.pop();
    order.push(c);
    for (const a of next[c]) if (--indeg[a] === 0) heap.push(a);
  }
  return order.length === numCourses ? order : [];
}

/** Fisher-Yates shuffle with a seeded generator. */
function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

/** A chain through all n courses in a random label order: the answer is forced. */
function chain(seed, n) {
  const rnd = mulberry32(seed);
  const order = shuffle(Array.from({ length: n }, (_, i) => i), rnd);
  const pairs = [];
  for (let i = 0; i + 1 < n; i++) pairs.push([order[i + 1], order[i]]);
  return [n, shuffle(pairs, rnd)];
}

const visible = [
  { args: [2, [[1, 0]]], expected: [0, 1], note: 'Course 0 comes first.' },
  { args: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], expected: [0, 1, 2, 3], note: '[0, 2, 1, 3] is also valid, but [0, 1, 2, 3] is smaller.' },
  { args: [3, [[0, 1], [1, 2]]], expected: [2, 1, 0], note: 'Course 2 must come before 1, and 1 before 0.' },
  { args: [2, [[0, 1], [1, 0]]], expected: [], note: 'A cycle: no valid order, so the answer is empty.' },
  { args: [4, [[3, 0], [1, 2]]], expected: [0, 2, 1, 3], note: 'After 0, both 2 and 3 are available; 2 is smaller. A plain FIFO queue gives [0, 2, 3, 1].' },
];

// Hidden tests: one course, no pairs (identity order), a self-pair, a cycle in a component that
// does not touch course 0, a case where FIFO order and smallest-first differ deep in the graph,
// a forced reverse order, and 10^5-course chains and random graphs where an O(V^2) "find the
// smallest available course" scan times out.
const hiddenArgs = [
  [1, []],
  [5, []],
  [2, [[1, 1]]],
  [5, [[1, 0], [3, 2], [4, 3], [2, 4]]],
  [7, [[6, 0], [5, 0], [1, 6], [2, 5], [4, 1], [3, 2]]],
  [1000, Array.from({ length: 999 }, (_, i) => [i, i + 1])],
  randomDag(5, 300, 900, 0),
  chain(7, MAX_N),
  randomDag(11, MAX_N, MAX_E, 0),
  randomDag(13, MAX_N, MAX_E, 30000),
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
  id: 'course-order',
  title: 'Course Order',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['Topological Sort', 'Heap'],
  timeLimitMs: 3000,
  argNames: ['numCourses', 'prerequisites'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>There are <code>numCourses</code> courses numbered <code>0</code> to
    <code>numCourses - 1</code>. Each pair <code>[a, b]</code> in <code>prerequisites</code>
    means course <code>b</code> must be completed before course <code>a</code>.</p>
    <p>Return an order in which every course can be taken. When several orders work, return the
    <strong>lexicographically smallest</strong> one: compare orders position by position, and
    the first position where they differ decides, smaller course number first. If no order
    exists, return an empty array.</p>
  `,
  constraints: [
    '1 <= numCourses <= 10^5 (raised from LeetCode\'s 2000)',
    '0 <= prerequisites.length <= 10^5',
    '0 <= a, b < numCourses; a may equal b (a course that needs itself)',
    'All pairs are unique',
    'The answer is the lexicographically smallest valid order, or [] when none exists',
    'Target complexity: O((V + E) log V) time (O(V^2) times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `numCourses = ${t.args[0]}, prerequisites = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which courses could legally come first? Among them, which one must come first for the smallest order?',
    'Once that course is taken, how does the set of available courses change?',
    'Is taking the smallest available course at every step always safe, or can it block something smaller later?',
    'Which data structure gives you the smallest available course quickly while courses keep being added?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Run the same "take an available course" process as for a cycle check, but always take the
    <strong>smallest</strong> available course. A min-heap of available courses gives it in O(log V).</p>
    <h4>Why it works</h4>
    <p>The first position of the answer must be some course with no unfinished prerequisites, and the
    smallest such course is the best possible first entry. Taking it only releases courses, it never
    makes another course unavailable, so the greedy choice never blocks a smaller option later. Repeat
    for every position. If a cycle exists, its courses are never released and the order comes out
    short, so return <code>[]</code>.</p>
    <h4>Complexity</h4>
    <p>O((V + E) log V) time: every course is pushed and popped once, and each pair lowers one
    in-degree. O(V + E) space. Scanning all courses for the smallest available one at every step is
    O(V^2), too slow at 10^5.</p>
    <h4>Pitfall</h4>
    <p>A plain FIFO queue still produces a valid order, but not the smallest one, so it fails here.
    The comparison is numeric: course <code>10</code> comes after <code>9</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'findOrder',
    params: [
      { name: 'numCourses', type: 'int' },
      { name: 'prerequisites', type: 'int[][]' },
    ],
    returns: 'int[]',
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

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). A random DAG with as many
  // prerequisites as courses, so every course is taken and nothing stops early; scanning all
  // courses for the smallest available one before each pick is V^2.
  growth: {
    target: 'n log n',
    n: 'numCourses = prerequisites.length',
    sizes: [2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => [n, edgeList(n, n, mulberry32(seed), { directed: true, acyclic: true })],
  },
};

export default problem;
