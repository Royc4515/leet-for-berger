/**
 * Problem: Common Values
 *
 * Return the distinct values found in both arrays. The entry point to hash-set membership: put
 * one array in a set, then each lookup from the other is O(1) instead of a scan. The answer
 * order is fixed (ascending) so judging is exact, which adds a second lesson: sort numbers as
 * numbers. The classic bugs are reporting a shared value twice, JavaScript's default sort
 * (which orders 100 before 25 and -1 after -5 as text), and the nested loop, O(n * m).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 1000000000;

/**
 * Reference: a set of the first array, one pass over the second, then a numeric sort.
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @returns {number[]} distinct common values, ascending
 */
export function reference(nums1, nums2) {
  const inFirst = new Set(nums1);
  const out = new Set();
  for (const x of nums2) if (inFirst.has(x)) out.add(x);
  return [...out].sort((a, b) => a - b);
}

/** n seeded values in [lo, hi]. */
function randomValues(rnd, n, lo, hi) {
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

/** Two max-size arrays over the full value range that share about `shared` values. */
function partialOverlap(seed, shared) {
  const rnd = mulberry32(seed);
  const a = randomValues(rnd, MAX_N, -MAX_V, MAX_V);
  const b = randomValues(rnd, MAX_N, -MAX_V, MAX_V);
  for (let i = 0; i < shared; i++) b[Math.floor(rnd() * MAX_N)] = a[Math.floor(rnd() * MAX_N)];
  return [a, b];
}

/** 10^5 distinct values and a shuffle of the same values: every value is common, so the answer is huge. */
function samePermuted(seed) {
  const rnd = mulberry32(seed);
  const a = Array.from({ length: MAX_N }, (_, i) => (i - MAX_N / 2) * 19997);
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return [a, b];
}

const visible = [
  { args: [[7, 3, 9, 3], [3, 3, 10, 7]], expected: [3, 7], note: '3 and 7 are in both arrays. Each common value is reported once, ascending.' },
  { args: [[1, 2, 3], [4, 5, 6]], expected: [], note: 'Nothing in common gives an empty array.' },
  { args: [[-5, 10, -5], [10, -5]], expected: [-5, 10], note: 'Negative values come first.' },
  { args: [[42], [42]], expected: [42], note: 'Single elements.' },
  { args: [[100, 20, 3], [3, 20, 100, 1000]], expected: [3, 20, 100], note: 'Ascending as numbers, not as text.' },
];

// Hidden tests: no overlap at n = 1, one value repeated many times, the extremes of the value
// range, numbers whose text order differs from their numeric order, negative numbers in text
// order, a random mid-size case, then four max-size cases where the nested loop (10^10 checks)
// is far too slow: partial overlap, every value common, a small value range with heavy
// duplication, and two disjoint halves.
const hiddenArgs = [
  [[0], [1]],
  [[2, 2, 2, 2], [2]],
  [[-MAX_V, MAX_V], [MAX_V, -MAX_V, 0]],
  [[9, 25, 100, 1000], [1000, 9, 100, 25]],
  [[-1, -5, -10, 3], [-10, -1, -5, 7]],
  (() => {
    const rnd = mulberry32(7);
    return [randomValues(rnd, 2000, -500, 500), randomValues(rnd, 1500, -500, 500)];
  })(),
  partialOverlap(11, 30000),
  samePermuted(13),
  (() => {
    const rnd = mulberry32(17);
    return [randomValues(rnd, MAX_N, 0, 999), randomValues(rnd, MAX_N, 500, 1499)];
  })(),
  (() => {
    const rnd = mulberry32(19);
    return [randomValues(rnd, MAX_N, -MAX_V, -1), randomValues(rnd, MAX_N, 0, MAX_V)];
  })(),
];

const isValue = (v) => Number.isInteger(v) && v >= -MAX_V && v <= MAX_V;

export const problem = {
  id: 'common-values',
  title: 'Common Values',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Hash Set', 'Membership', 'Sorting'],
  timeLimitMs: 3000,
  argNames: ['nums1', 'nums2'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given two integer arrays <code>nums1</code> and <code>nums2</code>, return every value
    that appears in both of them.</p>
    <p>Report each such value <strong>once</strong>, however many times it appears, and return
    the values in <strong>ascending</strong> order. If the arrays share no value, return an empty
    array.</p>
  `,
  constraints: [
    '1 <= nums1.length, nums2.length <= 10^5',
    '-10^9 <= nums1[i], nums2[i] <= 10^9',
    'Target complexity: O(n + m + k log k) for k common values, or O(n log n + m log m) by sorting',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums1 = ${JSON.stringify(t.args[0])}, nums2 = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For one value of nums2, how much work does it take to check whether it is in nums1? How often do you do that?',
    'Which structure answers "have I seen this value?" in constant time?',
    'A value appears three times in each array. How do you make sure it lands in the answer only once?',
    'How does your language sort numbers by default? Where would -1, -5, 25 and 100 end up?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Put every value of <code>nums1</code> in a hash set. Walk <code>nums2</code>, and each time
    a value is in the set, add it to a second set of answers. Finally sort the answers as
    numbers.</p>
    <h4>Why it works</h4>
    <p>A value belongs in the answer exactly when it occurs in both arrays. The first set answers
    "is it in <code>nums1</code>?" for every value of <code>nums2</code>, and collecting matches in
    a set keeps each common value once, no matter how often it repeats on either side.</p>
    <h4>Complexity</h4>
    <p>O(n + m + k log k) time for arrays of length n and m with k common values: one pass to fill
    the set, one pass of O(1) lookups, and a sort of the answers. O(n + k) extra space. Sorting
    both arrays and walking them with two pointers costs O(n log n + m log m) and needs no hash
    set. The nested loop is O(n * m), about 10^10 checks at the limits.</p>
    <h4>Pitfall</h4>
    <p>Sorting as text. In JavaScript, <code>sort()</code> without a comparator orders
    <code>100</code> before <code>25</code> and <code>-1</code> before <code>-5</code>; pass
    <code>(a, b) =&gt; a - b</code>.</p>
  `,

  signature: {
    name: 'commonValues',
    params: [
      { name: 'nums1', type: 'int[]' },
      { name: 'nums2', type: 'int[]' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines of JSON, nums1 then nums2.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: nums1, then nums2 (JSON arrays).' };
    let nums1;
    let nums2;
    try {
      nums1 = JSON.parse(lines[0]);
      nums2 = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    for (const [name, arr] of [['nums1', nums1], ['nums2', nums2]]) {
      if (!Array.isArray(arr) || arr.length < 1 || arr.length > MAX_N) return { ok: false, error: `${name} must have 1 to 10^5 values.` };
      if (!arr.every(isValue)) return { ok: false, error: `${name} values must be integers from -10^9 to 10^9.` };
    }
    return { ok: true, args: [nums1, nums2] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
