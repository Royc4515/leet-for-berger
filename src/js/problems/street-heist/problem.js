/**
 * Problem: Street Heist
 *
 * Maximum sum of values with no two adjacent indices chosen. dp[i] = max(dp[i-1], dp[i-2] + v[i]),
 * kept in two variables. Classic wrong answers: comparing "all even indices" against "all odd
 * indices" (fails on [2, 1, 1, 2]), and plain recursion, which is exponential. n is raised to 10^5
 * from LeetCode's 100, so recursion (even memoized, through its stack depth) also struggles.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_V = 10000;

/**
 * Reference: rolling two-state DP.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  let prev = 0; // best total for the prefix without its last house
  let cur = 0; // best total for the whole prefix
  for (const v of nums) {
    const next = Math.max(cur, prev + v);
    prev = cur;
    cur = next;
  }
  return cur;
}

function randomNums(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[1, 2, 3, 1]], expected: 4, note: 'Take houses 0 and 2: 1 + 3.' },
  { args: [[2, 7, 9, 3, 1]], expected: 12, note: 'Take houses 0, 2 and 4: 2 + 9 + 1.' },
  { args: [[5]], expected: 5, note: 'One house: take it.' },
  { args: [[2, 1, 1, 2]], expected: 4, note: 'Houses 0 and 3. Skipping two in a row is allowed, so "evens or odds" is not enough.' },
  { args: [[0, 0, 0]], expected: 0, note: 'Nothing to gain.' },
];

// Hidden tests: two houses, gaps of two and three skipped houses, zeros, a decoy middle value,
// then 10^5 houses (random, all maximal, and a pattern that rewards skipping two) where plain
// recursion is exponential and deep recursion overflows the stack.
const hiddenArgs = [
  [[1, 2]],
  [[10, 1, 1, 10]],
  [[6, 0, 0, 0, 6]],
  [[1, 9, 1, 1, 9, 1]],
  [[4, 1, 2, 7, 5, 3, 1]],
  [randomNums(101, 1000, 0, 100)],
  [randomNums(103, MAX_N, 0, MAX_V)],
  [Array(MAX_N).fill(MAX_V)],
  [Array.from({ length: MAX_N }, (_, i) => (i % 3 === 0 ? MAX_V : MAX_V - 1))],
  [randomNums(107, MAX_N, 0, 3)],
];

export const problem = {
  id: 'street-heist',
  title: 'Street Heist',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Dynamic Programming'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Houses stand in a row, and <code>nums[i]</code> is the amount of money in house
    <code>i</code>. You may take the money from any set of houses, as long as you never take from two
    <strong>adjacent</strong> houses (that trips the alarm).</p>
    <p>Return the largest total you can take.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5 (raised from LeetCode\'s 100)',
    '0 <= nums[i] <= 10^4',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Is taking every other house always optimal? Try [2, 1, 1, 2].',
    'Standing at the last house, what are your two options, and what does each leave behind?',
    'If you knew the best totals for the first i - 1 and the first i - 2 houses, could you get the one for i?',
    'How many of those earlier answers do you actually need to keep at any moment?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Scan the houses left to right, keeping the best total for the prefix so far and for the prefix
    one house shorter. At each house, either skip it and keep the best so far, or take it on top of
    the best that ends two houses back.</p>
    <h4>Why it works</h4>
    <p>The best plan for the first <code>i + 1</code> houses either skips house <code>i</code>, in
    which case it is the best plan for the first <code>i</code>, or takes it, which forbids house
    <code>i - 1</code> and leaves the best plan for the first <code>i - 1</code>. So
    <code>best(i) = max(best(i - 1), best(i - 2) + nums[i])</code>, and only the last two values
    matter.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(1) extra space. Plain recursion tries both choices at every house and is
    exponential.</p>
    <h4>Pitfall</h4>
    <p>Comparing the sum of even positions with the sum of odd positions fails on inputs like
    <code>[2, 1, 1, 2]</code>, where the best plan skips two houses in a row. With up to 10^5 houses,
    keep it iterative: a recursive version runs out of stack.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'rob',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [2,7,9,3,1].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_V)) return { ok: false, error: 'Values must be integers from 0 to 10^4.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random house values; the recurrence reads every house once.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [1024000, 2048000, 4096000, 8192000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 0, max: 1e4 })],
  },
};

export default problem;
