/**
 * Problem: Best Job Selection
 *
 * Equivalent to LeetCode 1235 (Maximum Profit in Job Scheduling); statement and tests are written
 * for this project. Weighted interval scheduling: sort the jobs by end time; best[i] is the most
 * profit using the first i jobs, either without job i, or with it plus the best over the jobs that
 * end no later than job i starts, found by binary search over the sorted end times. O(n log n).
 *
 * Classic wrong answers: greedy by earliest end or by highest profit (ignores weights), treating a
 * job that starts exactly when another ends as a clash, the quadratic DP that scans all earlier jobs
 * (10^10 steps at 10^5 jobs), and the recursion over take or skip without memoisation (2^n). The
 * limit is raised from 5 * 10^4 to 10^5 jobs; the largest total is 10^5 * 10^4 = 10^9, which still
 * fits in a 32-bit integer.
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt, shuffle } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_T = 1000000000;
const MAX_P = 10000;

/**
 * Reference: sort by end time, then DP with a binary search for the last compatible job.
 * @param {number[]} startTime
 * @param {number[]} endTime
 * @param {number[]} profit
 * @returns {number}
 */
export function reference(startTime, endTime, profit) {
  const n = startTime.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => endTime[a] - endTime[b]);
  const ends = order.map((i) => endTime[i]);
  const best = new Array(n + 1).fill(0);
  for (let k = 0; k < n; k++) {
    const job = order[k];
    // Number of jobs among the first k (by end time) that end no later than this one starts.
    let lo = 0;
    let hi = k;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ends[mid] <= startTime[job]) lo = mid + 1;
      else hi = mid;
    }
    best[k + 1] = Math.max(best[k], best[lo] + profit[job]);
  }
  return best[n];
}

/** Seeded jobs: starts in [1, maxT - 1], lengths up to `maxLen` (kept inside maxT), profits 1..maxP. */
function randomJobs(seed, n, maxT, maxLen, maxP) {
  const rnd = mulberry32(seed);
  const startTime = [];
  const endTime = [];
  const profit = [];
  for (let i = 0; i < n; i++) {
    const s = randInt(rnd, 1, maxT - 1);
    startTime.push(s);
    endTime.push(s + randInt(rnd, 1, Math.min(maxLen, maxT - s)));
    profit.push(randInt(rnd, 1, maxP));
  }
  return [startTime, endTime, profit];
}

/** Back-to-back jobs [i, i + 1], each starting exactly when the previous one ends, in shuffled order. */
function relay(seed, n, profitOf) {
  const rnd = mulberry32(seed);
  const order = shuffle(Array.from({ length: n }, (_, i) => i + 1), rnd);
  return [order, order.map((s) => s + 1), order.map((s) => profitOf(rnd, s))];
}

/** One long job covering everything, then many short jobs inside it that together pay more. */
function longVersusShort(n) {
  const startTime = [1];
  const endTime = [MAX_T];
  const profit = [MAX_P];
  for (let i = 0; i < n - 1; i++) {
    startTime.push(1 + 2 * i);
    endTime.push(2 + 2 * i);
    profit.push(1);
  }
  return [startTime, endTime, profit];
}

const visible = [
  { args: [[1, 2, 3, 3], [3, 4, 5, 6], [50, 10, 40, 70]], expected: 120, note: 'Take the jobs paying 50 (1 to 3) and 70 (3 to 6): the second starts when the first ends.' },
  { args: [[1, 2, 3, 4, 6], [3, 5, 10, 6, 9], [20, 20, 100, 70, 60]], expected: 150, note: 'Jobs 1, 4 and 5 (20 + 70 + 60) beat the single 100-profit job that blocks them.' },
  { args: [[1, 1, 1], [2, 3, 4], [5, 6, 4]], expected: 6, note: 'All three jobs start at 1 and overlap, so only the best one counts.' },
  { args: [[1, 3, 5], [3, 5, 7], [10, 10, 10]], expected: 30, note: 'Each job starts exactly when the previous one ends, which is allowed.' },
  { args: [[1], [2], [7]], expected: 7, note: 'A single job.' },
];

// Hidden tests: one job, 1000 identical time slots with different pay, small and mid random inputs
// with shuffled order, 10^5 back-to-back jobs of random pay and of the maximum pay (the answer
// 10^9), 10^5 long overlapping jobs, 10^5 short jobs over the whole time range, one long job
// against 10^5 short ones that pay more together, and heavy overlap in a narrow time range.
const hiddenArgs = (() => {
  const rnd = mulberry32(1235);
  const slot = Array.from({ length: 1000 }, () => randInt(rnd, 1, MAX_P));
  return [
    [[5], [MAX_T], [MAX_P]],
    [Array(1000).fill(10), Array(1000).fill(20), slot],
    randomJobs(11, 12, 30, 8, 20),
    randomJobs(13, 2000, 5000, 200, 1000),
    relay(17, MAX_N, (r) => randInt(r, 1, MAX_P)),
    relay(19, MAX_N, () => MAX_P),
    randomJobs(23, MAX_N, MAX_T, MAX_T, MAX_P),
    randomJobs(29, MAX_N, MAX_T, 1000, MAX_P),
    longVersusShort(MAX_N),
    randomJobs(31, MAX_N, 1000000, 100000, MAX_P),
  ];
})();

export const problem = {
  id: 'best-job-selection',
  title: 'Best Job Selection',
  difficulty: 'Hard',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Binary Search', 'Weighted Interval Scheduling'],
  timeLimitMs: 3000,
  argNames: ['startTime', 'endTime', 'profit'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You have <code>n</code> jobs. Job <code>i</code> runs from time <code>startTime[i]</code> to time
    <code>endTime[i]</code> and pays <code>profit[i]</code> if you do it. You can do only one job at a time,
    and you must do a chosen job from its start to its end without interruption.</p>
    <p>Two chosen jobs may not overlap in time, but a job may start at the exact moment another one ends.
    Return the maximum total profit you can earn.</p>
  `,
  constraints: [
    '1 <= n = startTime.length = endTime.length = profit.length <= 10^5',
    '1 <= startTime[i] < endTime[i] <= 10^9',
    '1 <= profit[i] <= 10^4',
    'The jobs come in no particular order',
    'Target complexity: O(n log n)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `startTime = ${JSON.stringify(t.args[0])}\nendTime = ${JSON.stringify(t.args[1])}\nprofit = ${JSON.stringify(t.args[2])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Does always picking the highest-paying job, or the job that ends first, give the best total? Can you find a counterexample?',
    'In what order should the jobs be considered so that, for a given job, everything that could run before it has already been decided?',
    'Define the best profit using only the first i jobs. What are your two options for job i, and what does each one add?',
    'If you take job i, which earlier jobs are still allowed? How can you find the last one that ends by the time job i starts without checking all of them?',
    'The end times are sorted. What search runs in O(log n) on sorted data, and does it matter that a job may start exactly at another one\'s end?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Sort the jobs by end time. Let <code>best[i]</code> be the largest profit using only the first
    <code>i</code> jobs in that order. For job <code>i</code> you either skip it (<code>best[i - 1]</code>) or do it
    and add its profit to the best schedule among the jobs that end by its start time.</p>
    <h4>Why it works</h4>
    <p>Because the jobs are sorted by end, the jobs compatible with job <code>i</code> are exactly a prefix of
    the earlier ones: those with <code>end &lt;= start[i]</code>. A binary search over the sorted ends finds the
    length <code>p</code> of that prefix, and <code>best[p]</code> already holds the optimum for it, so the
    choice is <code>max(best[i - 1], best[p] + profit[i])</code>. The comparison is <code>&lt;=</code>, which is
    how a job may start exactly when another ends.</p>
    <h4>Complexity</h4>
    <p>O(n log n) for the sort and one binary search per job, and O(n) space.</p>
    <h4>Pitfall</h4>
    <p>Greedy choices (earliest end, highest pay) ignore that a lower-paying job can free time for two
    others. Scanning back through all earlier jobs for the compatible one is O(n<sup>2</sup>), about 5 * 10<sup>9</sup>
    steps at 10<sup>5</sup> jobs. Remember to sort the three arrays together, not separately.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maxJobProfit',
    params: [
      { name: 'startTime', type: 'int[]' },
      { name: 'endTime', type: 'int[]' },
      { name: 'profit', type: 'int[]' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: three lines, each a JSON array (startTime, endTime, profit).
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 3) return { ok: false, error: 'Enter three lines: startTime, endTime and profit, each a JSON array.' };
    let startTime;
    let endTime;
    let profit;
    try {
      [startTime, endTime, profit] = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'All three lines must be valid JSON arrays.' };
    }
    const intsIn = (a, lo, hi) => Array.isArray(a) && a.every((v) => Number.isInteger(v) && v >= lo && v <= hi);
    if (!Array.isArray(startTime) || startTime.length < 1 || startTime.length > MAX_N) return { ok: false, error: 'startTime must have 1 to 10^5 numbers.' };
    if (!Array.isArray(endTime) || !Array.isArray(profit) || endTime.length !== startTime.length || profit.length !== startTime.length) return { ok: false, error: 'The three arrays must have the same length.' };
    if (!intsIn(startTime, 1, MAX_T - 1) || !intsIn(endTime, 2, MAX_T)) return { ok: false, error: 'Times must be integers from 1 to 10^9.' };
    if (!startTime.every((s, i) => s < endTime[i])) return { ok: false, error: 'Every job needs startTime < endTime.' };
    if (!intsIn(profit, 1, MAX_P)) return { ok: false, error: 'Every profit must be an integer from 1 to 10^4.' };
    return { ok: true, args: [startTime, endTime, profit] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1], args[2]),

  // Lengths up to 10^6 over a 10^9 range: most jobs are compatible with many others, so the sorted
  // prefix the binary search lands on keeps growing and every job needs a search.
  growth: {
    target: 'n log n',
    n: 'startTime.length',
    sizes: [1000, 2000, 4000, 8000, 16000, 32000, 64000],
    input: (n, seed) => randomJobs(seed, n, MAX_T, 1000000, MAX_P),
  },
};

export default problem;
