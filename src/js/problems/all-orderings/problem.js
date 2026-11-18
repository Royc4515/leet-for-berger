/**
 * Problem: All Orderings
 *
 * Every permutation of distinct integers. The backtracking template with a "used" mark per
 * element: fill positions left to right, try every unused value, undo on the way back. There are
 * n! orderings, so the work is O(n! * n) whatever the method.
 *
 * The output order is fixed as lexicographic so judging is exact; sorting the values first and
 * trying unused values in ascending order produces exactly that order.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 8;
const MAX_V = 10;

/**
 * Reference: sort, then depth-first search over positions with a used flag per value.
 * @param {number[]} nums distinct integers
 * @returns {number[][]}
 */
export function reference(nums) {
  const a = [...nums].sort((x, y) => x - y);
  const used = new Array(a.length).fill(false);
  const path = [];
  const out = [];
  const dfs = () => {
    if (path.length === a.length) {
      out.push([...path]);
      return;
    }
    for (let i = 0; i < a.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(a[i]);
      dfs();
      path.pop();
      used[i] = false;
    }
  };
  dfs();
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
    expected: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]],
    note: 'All 3! = 6 orderings, in dictionary order.',
  },
  { args: [[0, 1]], expected: [[0, 1], [1, 0]], note: 'Two values, two orderings.' },
  { args: [[1]], expected: [[1]], note: 'One value has exactly one ordering.' },
  { args: [[2, 1]], expected: [[1, 2], [2, 1]], note: 'The input order does not matter; the output order is fixed.' },
  { args: [[10, -1, 2]], expected: [[-1, 2, 10], [-1, 10, 2], [2, -1, 10], [2, 10, -1], [10, -1, 2], [10, 2, -1]], note: 'Values compare numerically: -1 < 2 < 10.' },
];

// Hidden tests: descending and shuffled inputs, 10 vs 2 (a string sort puts 10 first), negatives,
// and the largest inputs (8 values, 40320 orderings).
const hiddenArgs = [
  [[-5]],
  [[3, 2, 1]],
  [[10, 2, 1, -10]],
  [[-1, -2, -3, -4]],
  [distinctValues(3, 5)],
  [distinctValues(5, 6)],
  [distinctValues(7, 7)],
  [distinctValues(11, MAX_N)],
  [distinctValues(13, MAX_N)],
  [Array.from({ length: MAX_N }, (_, i) => MAX_V - 2 * i)],
];

export const problem = {
  id: 'all-orderings',
  title: 'All Orderings',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Backtracking'],
  timeLimitMs: 3000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an array <code>nums</code> of <em>distinct</em> integers, return every permutation
    (ordering) of its values.</p>
    <p>Return them in <strong>lexicographic order</strong>, comparing values numerically:
    permutation <code>p</code> comes before <code>q</code> when, at the first position where
    they differ, <code>p</code> has the smaller value.</p>
  `,
  constraints: [
    '1 <= nums.length <= 8 (raised from the usual 6)',
    '-10 <= nums[i] <= 10',
    'All values in nums are distinct',
    'Output in lexicographic order',
    'Target complexity: O(n! * n) time, the size of the output',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How many choices do you have for the first position? And for the second, once the first is fixed?',
    'How do you remember which values the current partial ordering already uses?',
    'After exploring everything that starts with a given choice, what must you undo before trying the next one?',
    'If the values are sorted and each position tries them in ascending order, in what order do the finished permutations appear?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Fill the positions left to right. At each position, try every value not used yet, mark it as
    used, recurse to the next position, then release it. Sort the values first and try them in
    ascending order.</p>
    <h4>Why it works</h4>
    <p>A permutation is a choice of value for position 0, then one of the remaining values for
    position 1, and so on, so the search tree has exactly one leaf per ordering. With the values
    tried in ascending order, all orderings that begin with a smaller value are finished before any
    that begin with a larger one, which is lexicographic order.</p>
    <h4>Complexity</h4>
    <p>O(n! * n) time and space: n! orderings, each copied in O(n). With n at most 8 that is
    40,320 orderings, and no method can avoid producing them all.</p>
    <h4>Pitfall</h4>
    <p>Undo the mark after the recursive call returns. Forgetting to release a value leaves it
    blocked for every later branch and silently drops orderings. Also copy the current ordering when
    you record it, instead of storing the array you keep overwriting.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'permute',
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
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 8 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V)) return { ok: false, error: 'Values must be integers from -10 to 10.' };
    if (new Set(nums).size !== nums.length) return { ok: false, error: 'Values must be distinct.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
