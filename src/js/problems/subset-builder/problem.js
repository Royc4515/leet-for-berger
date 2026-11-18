/**
 * Problem: Subset Builder
 *
 * Every subset of a set of distinct integers. The canonical backtracking template: at each step
 * either record the current partial choice or extend it with a later element. There are 2^n
 * subsets, so the work is O(2^n * n) whatever the method; the point is generating each exactly
 * once.
 *
 * The output order is fixed so judging is exact: each subset ascending, and the list sorted
 * lexicographically, with a subset placed before every subset that extends it ([] first). A
 * depth-first search over the sorted values that records each node on entry produces exactly
 * this order.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 14;
const MAX_V = 10;

/**
 * Reference: sort, then depth-first search recording every partial subset on entry.
 * @param {number[]} nums distinct integers
 * @returns {number[][]}
 */
export function reference(nums) {
  const a = [...nums].sort((x, y) => x - y);
  const out = [];
  const path = [];
  const dfs = (start) => {
    out.push([...path]);
    for (let i = start; i < a.length; i++) {
      path.push(a[i]);
      dfs(i + 1);
      path.pop();
    }
  };
  dfs(0);
  return out;
}

/** n distinct seeded values from [-MAX_V, MAX_V], in seeded (Fisher-Yates) order. */
function distinctValues(seed, n) {
  const rnd = mulberry32(seed);
  const pool = Array.from({ length: 2 * MAX_V + 1 }, (_, i) => i - MAX_V);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

const visible = [
  {
    args: [[1, 2, 3]],
    expected: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]],
    note: 'A subset comes right before the subsets that extend it, so [1, 2] precedes [1, 2, 3], which precedes [1, 3].',
  },
  { args: [[0]], expected: [[], [0]], note: 'The empty subset always counts.' },
  { args: [[3, 1]], expected: [[], [1], [1, 3], [3]], note: 'The input is not sorted, but every subset is written in ascending order.' },
  { args: [[-1, 5]], expected: [[], [-1], [-1, 5], [5]], note: 'Values compare numerically: -1 before 5.' },
  {
    args: [[10, -10, 0]],
    expected: [[], [-10], [-10, 0], [-10, 0, 10], [-10, 10], [0], [0, 10], [10]],
    note: 'Numeric order, not the order of the characters: -10 < 0 < 10.',
  },
];

// Hidden tests: negatives mixed with positives (string sorting breaks), a descending input,
// values where 2 and 10 trap a string sort, and the largest inputs (14 values, 16384 subsets).
const hiddenArgs = [
  [[5]],
  [[4, 3, 2, 1]],
  [[2, 10, 1]],
  [[-3, -2, -1, 0]],
  [distinctValues(3, 7)],
  [distinctValues(5, 10)],
  [distinctValues(7, 12)],
  [distinctValues(11, MAX_N)],
  [distinctValues(13, MAX_N)],
  [Array.from({ length: MAX_N }, (_, i) => MAX_V - i)],
];

export const problem = {
  id: 'subset-builder',
  title: 'Subset Builder',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Backtracking', 'Bit Manipulation'],
  timeLimitMs: 3000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an array <code>nums</code> of <em>distinct</em> integers, return every subset of its
    values (the power set), including the empty subset and the full set.</p>
    <p>The order is fixed: write each subset in ascending order, and sort the list of subsets
    lexicographically, comparing values numerically. A subset that is a prefix of another comes
    first, so <code>[1, 2]</code> comes before <code>[1, 2, 3]</code>, which comes before
    <code>[1, 3]</code>, and the empty subset is always first.</p>
  `,
  constraints: [
    '1 <= nums.length <= 14 (raised from the usual 10)',
    '-10 <= nums[i] <= 10',
    'All values in nums are distinct',
    'Each subset ascending; the list in lexicographic order',
    'Target complexity: O(2^n * n) time, the size of the output',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For each value, how many choices do you have about including it? How many subsets does that make?',
    'If you sort the values first, how do you keep every subset ascending for free?',
    'Picture a search that, from the current subset, may add any value larger than its last one. Which subsets does it visit?',
    'When should a subset be recorded: when the search reaches it, or only when it can grow no further?',
    'How does the default sort in your language order 10, 2 and -1?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'subsets',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int[][]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums as a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [1,2,3].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 14 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V)) return { ok: false, error: 'Values must be integers from -10 to 10.' };
    if (new Set(nums).size !== nums.length) return { ok: false, error: 'Values must be distinct.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
