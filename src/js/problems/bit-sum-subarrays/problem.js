/**
 * Problem: Bit Sum Subarrays
 *
 * Equivalent to LeetCode 930 (Binary Subarrays With Sum); statement and tests are written for this
 * project. Count contiguous subarrays of a binary (0/1) array whose elements sum to `goal`.
 * Because all entries are non-negative, the number of subarrays with sum <= target is monotonic
 * under a sliding window, so `atMost(goal) - atMost(goal - 1)` answers in O(n) time and O(1) space
 * (prefix-sum counting also runs in O(n) time and O(n) space).
 *
 * Classic wrong answers: a single sliding window that only shrinks when sum > goal (misses leading
 * zeros that form multiple valid subarrays ending at the same right index), failing when goal == 0
 * because atMost(-1) is not guarded to return 0, overflowing 32-bit integers on 10^5 zeros with
 * goal = 0 (answer is 5,000,050,000), and O(n^2) nested loops that time out at 10^5 elements.
 *
 * Limit raised from 3 * 10^4 to 10^5 (with a 64-bit integer return) so O(n^2) times out in every
 * language.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;

/**
 * Reference: prefix-sum frequency array (independent of the two-pass sliding window used in
 * solutions). Counts how many earlier prefix sums equal (prefix - goal).
 * @param {number[]} nums
 * @param {number} goal
 * @returns {number}
 */
export function reference(nums, goal) {
  const counts = new Int32Array(nums.length + 1);
  counts[0] = 1;
  let prefix = 0;
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    prefix += nums[i];
    if (prefix >= goal) total += counts[prefix - goal];
    counts[prefix]++;
  }
  return total;
}

/** Deterministic packed binary array of length n where each entry is 1 with probability `probOne`. */
function randomBits(seed, n, probOne) {
  const rnd = mulberry32(seed);
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) out[i] = rnd() < probOne ? 1 : 0;
  return out;
}

const visible = [
  { args: [[1, 0, 1, 0, 1], 2], expected: 4, note: 'The four subarrays summing to 2 are [0..2], [0..3], [1..4], and [2..4].' },
  { args: [[0, 0, 0, 0, 0], 0], expected: 15, note: 'Every non-empty subarray sums to 0: 5 * 6 / 2 = 15.' },
  { args: [[0, 0, 0], 1], expected: 0, note: 'No subarray contains a 1.' },
  { args: [[1, 1, 1], 3], expected: 1, note: 'Only the entire array sums to 3.' },
  { args: [[0, 1, 0, 1, 0], 1], expected: 8, note: 'Leading and trailing zeros around each 1 multiply the valid windows: 2*2 + 2*2 = 8.' },
];

// Hidden tests: single-element edges (0/0, 1/0, 1/1), multiple zero-padded ones (catches naive
// single-window shrinking), goal = 0 with mixed zeros and ones, plus max-size 10^5 arrays:
// all zeros with goal = 0 (5,000,050,000 tests 64-bit return), all ones with goal = 1 and goal = n,
// sparse 1s at 10^5, and 50/50 random bits at 10^5.
const hiddenArgs = [
  [[0], 0],
  [[1], 0],
  [[1], 1],
  [[1, 0, 0, 1, 0, 0, 1], 2],
  [[0, 1, 0, 0, 1, 0], 0],
  [new Array(MAX_N).fill(0), 0],
  [new Array(MAX_N).fill(1), 1],
  [new Array(MAX_N).fill(1), MAX_N],
  [randomBits(9301, MAX_N, 0.05), 50],
  [randomBits(9302, MAX_N, 0.5), 25000],
];

export const problem = {
  id: 'bit-sum-subarrays',
  title: 'Bit Sum Subarrays',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Sliding Window', 'Prefix Sum', 'Hash Map'],
  timeLimitMs: 2000,
  argNames: ['nums', 'goal'],

  statementHtml: `
    <p>Given a binary array <code>nums</code> (every element is <code>0</code> or <code>1</code>)
    and a non-negative integer <code>goal</code>, return the number of non-empty contiguous
    subarrays whose elements sum to exactly <code>goal</code>.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    'nums[i] is either 0 or 1',
    '0 <= goal <= nums.length',
    'The answer may exceed 2^31 - 1 (up to 5 * 10^9), so return a 64-bit integer',
    'Target complexity: O(n) time, O(1) extra space (sliding window) or O(n) space (prefix counts)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, goal = ${t.args[1]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  hints: [
    'Why does a single sliding window struggle when zeros sit at the left edge of a valid subarray?',
    'Counting subarrays with sum AT MOST k is much simpler with a sliding window. How do you get exact sum == goal from atMost?',
    'For a fixed right pointer, if the smallest left pointer with window sum <= k is left, how many valid subarrays end at right?',
    'What should atMost(goal - 1) return when goal is 0?',
    'If all 10^5 entries are 0 and goal is 0, how large is the answer? Does it fit in a 32-bit int?',
  ],

  explanationHtml: `
    <h4>Idea</h4>
    <p>Write a helper <code>atMost(k)</code> that counts subarrays with sum at most <code>k</code>
    using a standard sliding window: expand <code>right</code>, advance <code>left</code> while the
    window sum exceeds <code>k</code>, and add <code>right - left + 1</code> (every start index from
    <code>left</code> to <code>right</code> ends a valid subarray at <code>right</code>). The answer
    is <code>atMost(goal) - atMost(goal - 1)</code>.</p>
    <h4>Why it works</h4>
    <p>Because every element is <code>0</code> or <code>1</code>, shrinking from the left never
    increases the window sum. Thus for each <code>right</code>, the valid starts for sum
    <code>&lt;= k</code> form a suffix <code>[left..right]</code>. Subtracting the subarrays with
    sum <code>&lt;= goal - 1</code> leaves exactly those with sum <code>== goal</code>.</p>
    <h4>Complexity</h4>
    <p>O(n) time (each pointer crosses the array at most twice) and O(1) extra space. Prefix-sum
    frequency counting is also O(n) time with O(n) space.</p>
    <h4>Pitfall</h4>
    <p>Guard <code>if (k &lt; 0) return 0</code> in <code>atMost</code> so <code>goal = 0</code>
    does not pass <code>-1</code> into an unsigned or unguarded loop. Also accumulate the answer in
    a 64-bit integer: <code>10^5</code> zeros with <code>goal = 0</code> yields
    <code>5,000,050,000</code>, which overflows signed 32-bit <code>int</code>.</p>
  `,

  signature: {
    name: 'countBitSubarrays',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'goal', type: 'int' },
    ],
    returns: 'long',
  },

  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [150000, 300000, 600000, 1200000],
    // Balanced 0/1 stream with goal = n / 4 forces both left and right pointers through the whole
    // array in both atMost passes.
    input: (n, seed) => {
      const out = new Array(n).fill(0);
      let x = (seed | 0) || 1;
      for (let i = 0; i < n; i++) {
        x = (Math.imul(x, 1664525) + 1013904223) | 0;
        out[i] = (x >>> 31) & 1;
      }
      return [out, Math.floor(n / 4)];
    },
  },

  /**
   * Custom input: two lines (or separated by ;) with nums as a JSON array of 0/1 and goal as an integer.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const parts = raw.split(/\n|;/).map((s) => s.trim()).filter(Boolean);
    const usage = 'Enter nums and goal on two lines (or separated by ;), for example [1,0,1,0,1]; 2.';
    if (parts.length !== 2) return { ok: false, error: usage };
    let nums;
    let goal;
    try {
      nums = JSON.parse(parts[0]);
      goal = JSON.parse(parts[1]);
    } catch {
      return { ok: false, error: usage };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) {
      return { ok: false, error: 'nums must be an array of 1 to 10^5 bits.' };
    }
    if (!nums.every((v) => v === 0 || v === 1)) {
      return { ok: false, error: 'Every value in nums must be 0 or 1.' };
    }
    if (!Number.isInteger(goal) || goal < 0 || goal > nums.length) {
      return { ok: false, error: 'goal must be an integer from 0 to nums.length.' };
    }
    return { ok: true, args: [nums, goal] };
  },

  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
