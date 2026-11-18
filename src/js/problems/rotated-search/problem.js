/**
 * Problem: Rotated Search
 *
 * Find a target in a sorted array of distinct values that has been rotated at an unknown point.
 * Cutting a rotated array anywhere leaves at least one half sorted, and on a sorted half a range
 * check tells whether the target can be there, so binary search still applies: O(log n).
 *
 * The classic bugs are the comparisons at the boundaries (<= versus <) when the target equals
 * nums[0], the pivot value, or the last value, and arrays that are not rotated at all.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 1000000000;

/**
 * Reference: binary search, deciding at every step which half is sorted.
 * @param {number[]} nums
 * @param {number} target
 * @returns {number}
 */
export function reference(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

/**
 * Seeded strictly increasing array of n values in [-10^9, 10^9], rotated left by `shift`.
 * Gaps of at least 2 leave room for absent targets between neighbours.
 */
function rotatedArray(seed, n, shift) {
  const rnd = mulberry32(seed);
  const maxGap = Math.max(2, Math.floor((2 * MAX_V) / n));
  const sorted = [];
  let v = -MAX_V + Math.floor(rnd() * 10);
  for (let i = 0; i < n; i++) {
    sorted.push(v);
    v += 2 + Math.floor(rnd() * (maxGap - 2));
  }
  return [...sorted.slice(shift), ...sorted.slice(0, shift)];
}

const big1 = rotatedArray(7, MAX_N, 61234);
const big2 = rotatedArray(11, MAX_N, 1);
const big3 = rotatedArray(13, MAX_N, 0);

const visible = [
  { args: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4, note: 'The sorted run 0, 1, 2 starts after the rotation point.' },
  { args: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1, note: '3 is not in the array.' },
  { args: [[1], 0], expected: -1, note: 'A single value that is not the target.' },
  { args: [[1, 3, 5, 8], 8], expected: 3, note: 'Rotating by zero positions leaves the array sorted.' },
  { args: [[6, 7, 1, 2, 3, 4, 5], 7], expected: 1, note: 'The target is the largest value, just before the drop.' },
];

// Hidden tests: two elements in both orders, the target equal to the first value, the pivot value
// or the last value (boundary comparisons), absent targets that fall in the gap between the two
// runs, and 10^5 values where the target is present or missing.
const hiddenArgs = [
  [[5], 5],
  [[3, 1], 1],
  [[3, 1], 3],
  [[1, 3], 0],
  [[5, 1, 3], 5],
  [[4, 5, 6, 7, 8, 1, 2, 3], 8],
  [[7, 8, 9, 1, 2, 3], 6],
  [big1, big1[MAX_N - 61234 - 1]],
  [big2, big2[MAX_N - 1]],
  [big3, big3[50000] + 1],
];

export const problem = {
  id: 'rotated-search',
  title: 'Rotated Search',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Binary Search'],
  timeLimitMs: 3000,
  argNames: ['nums', 'target'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>An array of <strong>distinct</strong> integers was sorted in ascending order and then
    rotated: some number of values (possibly none) were moved, in order, from the front to the
    back. For example <code>[0, 1, 2, 4, 5, 6, 7]</code> rotated by 3 becomes
    <code>[4, 5, 6, 7, 0, 1, 2]</code>.</p>
    <p>Given the rotated array <code>nums</code> and an integer <code>target</code>, return the
    index of <code>target</code> in <code>nums</code>, or <code>-1</code> if it is not there.
    Aim for <code>O(log n)</code> time.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5 (raised from LeetCode\'s 5000)',
    '-10^9 <= nums[i], target <= 10^9',
    'All values of nums are distinct; nums is an ascending array rotated by 0 to n - 1 positions',
    'Target complexity: O(log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, target = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you split the rotated array at its middle, can both halves be unsorted?',
    'How can comparing nums[lo] with nums[mid] tell you which half is sorted?',
    'On the sorted half, what check tells you whether the target could be inside it?',
    'Try your comparisons when the target equals nums[lo], nums[mid] or nums[hi]. Does each case still land in the right half?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Cut the rotated array at <code>mid</code>: at least one of the two halves is sorted. Find it by
    comparing <code>nums[0]</code> with <code>nums[mid]</code>, check whether <code>target</code> falls in
    that sorted half's value range, and keep the half that can contain it.</p>
    <h4>Why it works</h4>
    <p>If <code>nums[0] &lt;= nums[mid]</code>, no rotation point lies in <code>[0, mid]</code>, so that
    prefix is sorted and <code>nums[0] &lt;= target &lt;= nums[mid]</code> decides exactly whether the
    target is there. Otherwise the rotation point is in the prefix, so <code>[mid, n - 1]</code> is sorted
    and <code>nums[mid] &lt; target &lt;= nums[n - 1]</code> decides whether to go right. Each step keeps
    any copy of the target in range, and with distinct values the loop ends on the only possible index,
    checked once at the end.</p>
    <h4>Complexity</h4>
    <p>O(log n) time, the range halves each step. O(1) space. A linear scan is O(n).</p>
    <h4>Pitfall</h4>
    <p>The boundary comparisons. The first test must be <code>&lt;=</code> so that <code>mid == 0</code>
    counts as sorted, and the range checks must include the endpoints that belong to each half. A slip
    there misses targets equal to <code>nums[0]</code>, the largest value, or the last value. Also test an
    array rotated by zero positions.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'search',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'target', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums as a JSON array, then target, one per line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter nums on line 1 and target on line 2.' };
    let nums;
    let target;
    try {
      nums = JSON.parse(lines[0]);
      target = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array and target as an integer, for example [4,5,6,7,0,1,2] then 0.' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V)) return { ok: false, error: 'Values must be integers within +-10^9.' };
    if (!Number.isInteger(target) || Math.abs(target) > MAX_V) return { ok: false, error: 'target must be an integer within +-10^9.' };
    // A rotated ascending array of distinct values has at most one descent, and if it has one
    // the last value must be smaller than the first.
    let drops = 0;
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === nums[i - 1]) return { ok: false, error: 'Values must be distinct.' };
      if (nums[i] < nums[i - 1]) drops++;
    }
    if (drops > 1 || (drops === 1 && nums[nums.length - 1] > nums[0])) return { ok: false, error: 'nums must be an ascending array rotated at one point.' };
    return { ok: true, args: [nums, target] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
