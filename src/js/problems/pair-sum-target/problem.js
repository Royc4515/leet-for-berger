/**
 * Problem: Pair Sum Target
 *
 * Find the two positions whose values add up to a target. The canonical complement lookup:
 * instead of checking every pair, remember what you have seen and ask whether the missing
 * half is already there. The same move solves subarray sums, pairs with a difference, and more.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: one pass with a value -> index map.
 * @param {number[]} nums
 * @param {number} target
 * @returns {number[]} the two indices, ascending
 */
export function reference(nums, target) {
  const seen = new Map();
  for (let j = 0; j < nums.length; j++) {
    const need = target - nums[j];
    if (seen.has(need)) return [seen.get(need), j];
    seen.set(nums[j], j);
  }
  return [];
}

const MAX_N = 100000;

/**
 * An array with exactly one valid pair. Fillers are multiples of 4 and the pair is 1 mod 4 each,
 * so filler+filler and filler+pair can never hit a target that is 2 mod 4.
 */
function uniquePair(seed, n, i, j) {
  const rnd = mulberry32(seed);
  const used = new Set();
  const nums = [];
  while (nums.length < n) {
    const v = 4 * (Math.floor(rnd() * 400000000) - 200000000);
    if (!used.has(v)) {
      used.add(v);
      nums.push(v);
    }
  }
  const a = 4 * Math.floor(rnd() * 100000000) + 1;
  const b = 4 * Math.floor(rnd() * 100000000) + 1;
  nums[i] = a;
  nums[j] = b === a ? b + 4 : b;
  return [nums, nums[i] + nums[j]];
}

const visible = [
  { args: [[2, 7, 11, 15], 9], expected: [0, 1], note: '2 + 7 = 9.' },
  { args: [[3, 2, 4], 6], expected: [1, 2], note: 'Index 0 cannot be used twice, even though 3 + 3 = 6.' },
  { args: [[3, 3], 6], expected: [0, 1], note: 'Equal values at different positions are fine.' },
  { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], note: 'Negative values work the same way.' },
  { args: [[0, 4, 3, 0], 0], expected: [0, 3], note: 'A target of zero.' },
];

// Hidden tests: reusing one index, pairs at the far ends, large magnitudes, and 10^5 elements
// with the pair at the very end so checking every pair times out.
const hiddenArgs = [
  [[1, 5], 6],
  [[5, 75, 25], 100],
  [[1000000000, -1000000000, 7], 0],
  [[2, 5, 5, 11], 10],
  [[-3, 4, 3, 90], 0],
  uniquePair(7, 1000, 3, 997),
  uniquePair(11, MAX_N, MAX_N - 2, MAX_N - 1),
  uniquePair(13, MAX_N, 0, MAX_N - 1),
  uniquePair(17, MAX_N, 50000, 50001),
  [[1000000000, 999999999, 1], 1999999999],
];

export const problem = {
  id: 'pair-sum-target',
  title: 'Pair Sum Target',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Hash Map', 'Complement Lookup'],
  timeLimitMs: 2000,
  argNames: ['nums', 'target'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array of integers <code>nums</code> and an integer <code>target</code>.
    Exactly one pair of different positions <code>i &lt; j</code> satisfies
    <code>nums[i] + nums[j] == target</code>.</p>
    <p>Return <code>[i, j]</code>, with the smaller index first. A position cannot be paired with itself.</p>
  `,
  constraints: [
    '2 <= nums.length <= 10^5',
    '-10^9 <= nums[i] <= 10^9',
    '-2 * 10^9 <= target <= 2 * 10^9 (fits in a 32-bit signed int)',
    'Exactly one valid pair exists',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, target = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you fix one number, what exact value must its partner have?',
    'Checking every pair works. How many pairs are there when n is 10^5?',
    'While walking the array once, what could you remember about the numbers you have already passed?',
    'If you store a number before checking for its partner, what goes wrong when the partner is the same position?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>For each number <code>x</code>, its partner must be exactly <code>target - x</code>. Instead of
    searching for that partner, remember every number already passed in a hash map from value to index,
    and ask the map in O(1).</p>
    <h4>Why it works</h4>
    <p>Walk left to right. When position <code>j</code> holds the second number of the pair, the first one
    sits at some <code>i &lt; j</code>, so it is already in the map. The first time a lookup succeeds,
    the pair is found, with the smaller index first.</p>
    <h4>Complexity</h4>
    <p>O(n) time: one pass with constant-time lookups. O(n) space for the map. Checking every pair would be
    O(n^2), about 5 * 10^9 pairs at n = 10^5.</p>
    <h4>Pitfall</h4>
    <p>Look up the partner <em>before</em> storing the current number. Storing first lets
    <code>x + x == target</code> pair a position with itself.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'pairSum',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'target', type: 'int' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, the array (JSON) and the target.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: nums as a JSON array, then target.' };
    let nums;
    let target;
    try {
      nums = JSON.parse(lines[0]);
      target = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON.' };
    }
    if (!Array.isArray(nums) || nums.length < 2 || nums.length > MAX_N) return { ok: false, error: 'nums must have 2 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= 1e9)) return { ok: false, error: 'Values must be integers within +-10^9.' };
    if (!Number.isInteger(target) || Math.abs(target) > 2e9) return { ok: false, error: 'target must be an integer within +-2 * 10^9.' };
    let count = 0;
    const freq = new Map();
    for (const v of nums) {
      count += freq.get(target - v) ?? 0;
      freq.set(v, (freq.get(v) ?? 0) + 1);
      if (count > 1) break;
    }
    if (count !== 1) return { ok: false, error: `Exactly one pair must sum to the target (found ${count > 1 ? 'more than one' : 'none'}).` };
    return { ok: true, args: [nums, target] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). The pair sits at the
  // very end, so no solution can stop early; sizes pass 10^5 because a linear pass needs about
  // 10^6 elements to take measurable milliseconds.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => uniquePair(seed, n, n - 2, n - 1),
  },
};

export default problem;
