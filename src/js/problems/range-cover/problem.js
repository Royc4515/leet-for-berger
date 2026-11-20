/**
 * Problem: Range Cover
 *
 * Find the narrowest interval [a, b] that contains at least one value from each of k sorted
 * lists. Two standard O(N log k) / O(N log N) answers: a min-heap holding one pointer per list
 * (advance the list that owns the minimum, track the running maximum), or merge everything with
 * list labels and slide a window until every label is present. Trying every start value against
 * every list is O(N * k), about 6 * 10^8 steps at the limits used here.
 *
 * Ties are broken by the smaller start, which makes the answer unique.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: merge all values with their list index, then a two-pointer window over the merged
 * order that is shrunk from the left whenever it still covers all k lists.
 * @param {number[][]} nums k non-decreasing lists
 * @returns {number[]} [a, b]
 */
export function reference(nums) {
  const k = nums.length;
  const merged = [];
  nums.forEach((list, i) => list.forEach((v) => merged.push([v, i])));
  merged.sort((p, q) => p[0] - q[0]);
  const have = new Array(k).fill(0);
  let covered = 0;
  let best = null;
  let left = 0;
  for (const [b, i] of merged) {
    if (have[i]++ === 0) covered++;
    while (covered === k) {
      const a = merged[left][0];
      // Strictly narrower only: b grows, so an equally wide window found later starts later.
      if (best === null || b - a < best[1] - best[0]) best = [a, b];
      if (--have[merged[left][1]] === 0) covered--;
      left++;
    }
  }
  return best;
}

const MAX_K = 3500;
const MAX_LEN = 50;
const MAX_V = 100000;

/** k seeded sorted lists of length 1..maxLen with values in [lo, hi]. */
function randomLists(seed, k, maxLen, lo, hi, fixedLen = false) {
  const rnd = mulberry32(seed);
  return Array.from({ length: k }, () => {
    const len = fixedLen ? maxLen : 1 + Math.floor(rnd() * maxLen);
    return Array.from({ length: len }, () => lo + Math.floor(rnd() * (hi - lo + 1))).sort((x, y) => x - y);
  });
}

const visible = [
  {
    args: [[[4, 10, 15, 24, 26], [0, 9, 12, 20], [5, 18, 22, 30]]],
    expected: [20, 24],
    note: '20 is in the second list, 22 in the third and 24 in the first. No narrower interval covers all three.',
  },
  { args: [[[1, 2, 3], [1, 2, 3], [1, 2, 3]]], expected: [1, 1], note: 'Width 0 is possible; [1, 1], [2, 2] and [3, 3] tie, so the smallest start wins.' },
  { args: [[[5, 8, 9]]], expected: [5, 5], note: 'With one list, any single value covers it; the smallest start wins.' },
  { args: [[[1, 5], [3, 7]]], expected: [1, 3], note: '[1, 3], [3, 5] and [5, 7] all have width 2; [1, 3] starts first.' },
  { args: [[[-10, -5], [-7, 0], [-6, 2]]], expected: [-7, -5], note: 'Negative values work the same way.' },
];

// Hidden tests: duplicates inside lists, one list of a single value far away (the interval must
// stretch to reach it), ties between several equally wide windows, extreme values, and inputs
// with 3500 lists of 50 values where checking every start against every list is far too slow.
const hiddenArgs = [
  [[[1, 1, 1], [1, 1], [1]]],
  [[[1, 2, 3, 4, 5], [100000], [3, 4]]],
  [[[10, 20, 30], [15, 25, 35], [12, 22, 32]]],
  [[[-100000, 100000], [0]]],
  [[[1, 4, 7, 10], [2, 5, 8, 11], [3, 6, 9, 12]]],
  [randomLists(3, 20, 10, -50, 50)],
  [randomLists(5, 300, MAX_LEN, -MAX_V, MAX_V)],
  [randomLists(7, MAX_K, MAX_LEN, -MAX_V, MAX_V, true)],
  [randomLists(11, MAX_K, MAX_LEN, -1000, 1000, true)],
  [randomLists(13, MAX_K, MAX_LEN, 0, 3 * MAX_LEN, true)],
];

export const problem = {
  id: 'range-cover',
  title: 'Range Cover',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Heap', 'Sliding Window', 'K-way Merge'],
  timeLimitMs: 3000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given <code>k</code> lists of integers, each sorted in non-decreasing order. Find
    the smallest range <code>[a, b]</code> (with <code>a &lt;= b</code>) that contains at least
    one number from every list. A number <code>x</code> is in the range when
    <code>a &lt;= x &lt;= b</code>.</p>
    <p>Range <code>[a, b]</code> is smaller than <code>[c, d]</code> when
    <code>b - a &lt; d - c</code>, or when the widths are equal and <code>a &lt; c</code>.
    Return the smallest range as <code>[a, b]</code>.</p>
  `,
  constraints: [
    '1 <= k <= 3500',
    '1 <= nums[i].length <= 50',
    '-10^5 <= nums[i][j] <= 10^5',
    'Each list is sorted in non-decreasing order',
    'Ties: equal widths are broken by the smaller start',
    'Target complexity: O(N log k) or O(N log N) for N values in total (O(N * k) times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Pick one value from each list. Which range do those k values define?',
    'Starting from the first value of every list, which pointer should move to have any chance of a smaller range?',
    'Which structure tells you the current minimum among k values quickly, while the maximum only ever grows?',
    'When can you stop: what happens once one list runs out of values?',
    'Alternatively: if all values were merged into one sorted line with list labels, what window are you looking for?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Merge every value with the index of its list into one sorted sequence. The answer is the
    narrowest window of that sequence holding at least one value from each of the <code>k</code>
    lists, found with two pointers.</p>
    <h4>Why it works</h4>
    <p>An optimal range can always shrink until both ends are values that occur, so it is a window
    of the merged order. For each right end <code>b</code>, shrink from the left while all
    <code>k</code> lists are still covered; the last covered window is the narrowest that ends at
    <code>b</code>. A count per list says when coverage breaks.</p>
    <h4>Complexity</h4>
    <p>O(N log N) time for the sort and O(N) for the window, O(N + k) space, with N up to 175,000.
    Checking each candidate start against every list is O(N * k). A min-heap holding one pointer per
    list reaches O(N log k).</p>
    <h4>Pitfall</h4>
    <p>Ties go to the smaller start. Since <code>b</code> only grows, a later window of equal width
    starts later, so replace the answer only when the width is strictly smaller. Updating on
    <code>&lt;=</code> returns the wrong range.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'smallestRange',
    params: [{ name: 'nums', type: 'int[][]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums as a JSON array of arrays.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array of arrays, for example [[1,5],[3,7]].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_K) return { ok: false, error: 'There must be 1 to 3500 lists.' };
    for (const list of nums) {
      if (!Array.isArray(list) || list.length < 1 || list.length > MAX_LEN) return { ok: false, error: 'Each list must have 1 to 50 values.' };
      if (!list.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V)) return { ok: false, error: 'Values must be integers within +-10^5.' };
      if (list.some((v, i) => i > 0 && v < list[i - 1])) return { ok: false, error: 'Each list must be sorted in non-decreasing order.' };
    }
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Lists of 25 sorted values in [-10^5, 10^5], n / 25 of them: the window has to span every list,
  // so it runs to the end of the merged order. The list length stays fixed and k grows with n; a
  // scan that looks at every list for every value is n * k.
  growth: {
    target: 'n log n',
    n: 'total values in nums',
    sizes: [8000, 16000, 32000, 64000, 128000],
    input: (n, seed) => [randomLists(seed, Math.max(1, Math.round(n / 25)), 25, -MAX_V, MAX_V, true)],
  },
};

export default problem;
