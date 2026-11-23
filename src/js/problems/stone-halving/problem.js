/**
 * Problem: Stone Halving
 *
 * Equivalent to LeetCode 1962 (Remove Stones to Minimize the Total); statement and tests are
 * written for this project. Each operation should remove as many stones as possible, and halving
 * the largest pile removes the most, so the greedy repeats "take the current largest pile, remove
 * floor(p / 2)" k times. A max-heap keeps the current largest pile at hand: O(n + k log n).
 *
 * Classic wrong answers: removing ceil(p / 2) instead of floor(p / 2), halving the piles once each
 * in their first sorted order (a pile can be the largest again after it was halved), applying all k
 * operations to the pile that was largest at the start, and rescanning the whole array for the
 * maximum on every operation (O(n * k), which times out at 10^5 piles and 10^5 operations).
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_V = 10000;
const MAX_K = 100000;

/**
 * Reference: bucket counts by pile size (sizes are at most 10^4), walked from the top.
 * @param {number[]} piles
 * @param {number} k
 * @returns {number} the smallest total left after k operations
 */
export function reference(piles, k) {
  const count = new Array(MAX_V + 1).fill(0);
  let total = 0;
  for (const p of piles) {
    count[p]++;
    total += p;
  }
  let left = k;
  for (let v = MAX_V; v >= 1 && left > 0; v--) {
    while (count[v] > 0 && left > 0) {
      const removed = Math.floor(v / 2);
      // A pile of 1 loses nothing; every larger pile shrinks to a smaller bucket.
      if (removed === 0) return total;
      count[v]--;
      count[v - removed]++;
      total -= removed;
      left--;
    }
  }
  return total;
}

const visible = [
  { args: [[5, 4, 9], 2], expected: 12, note: 'Halve 9 (remove 4, leaving 5), then one of the 5s (remove 2): 3 + 4 + 5 = 12.' },
  { args: [[4, 3, 6, 7], 3], expected: 12, note: '7 -> 4, 6 -> 3, then a 4 -> 2: 2 + 3 + 3 + 4 = 12.' },
  { args: [[100], 3], expected: 13, note: 'One pile can be halved again and again: 100 -> 50 -> 25 -> 13.' },
  { args: [[1, 1, 1], 5], expected: 3, note: 'A pile of 1 loses floor(1 / 2) = 0 stones, so nothing changes.' },
  { args: [[9, 2], 1], expected: 7, note: 'floor(9 / 2) = 4 stones go, not 5: 5 + 2 = 7.' },
];

// Hidden tests: a single pile of 1, one large pile halved past 1, a pile that becomes the largest
// again after being halved, 10^5 random piles with 10^5 operations, 10^5 piles of 10^4 with
// 10^5 operations (every pile halved once), 10^5 piles of 10^4 with one operation, two piles and
// many operations, 10^5 ones (nothing can be removed), odd piles where ceil and floor differ, and
// a small random case.
const hiddenArgs = [
  [[1], 1],
  [[10000], 20],
  [[10, 9], 2],
  [intArray(MAX_N, mulberry32(1962), { min: 1, max: MAX_V }), MAX_K],
  [Array(MAX_N).fill(MAX_V), MAX_K],
  [Array(MAX_N).fill(MAX_V), 1],
  [[8000, 7000], 30],
  [Array(MAX_N).fill(1), MAX_K],
  [[3, 5, 7, 9, 11, 13], 6],
  [intArray(30, mulberry32(1963), { min: 1, max: 60 }), 17],
];

export const problem = {
  id: 'stone-halving',
  title: 'Stone Halving',
  difficulty: 'Medium',
  topics: ['greedy'],
  patterns: ['Heap', 'Greedy'],
  timeLimitMs: 2000,
  argNames: ['piles', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array <code>piles</code>, where <code>piles[i]</code> is the number of stones in pile
    <code>i</code>, and an integer <code>k</code>. Exactly <code>k</code> times, you choose one pile with
    <code>p</code> stones and remove <code>floor(p / 2)</code> stones from it. The same pile may be chosen more
    than once.</p>
    <p>Return the smallest possible total number of stones left after the <code>k</code> operations.</p>
  `,
  constraints: [
    '1 <= piles.length <= 10^5',
    '1 <= piles[i] <= 10^4',
    '1 <= k <= 10^5',
    'Target complexity: O(n + k log n)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `piles = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which pile should one single operation take from to remove the most stones?',
    'After you halve that pile, is it still the largest? How would you find the largest pile for the next operation?',
    'Scanning all piles for the maximum each time costs O(n) per operation. Which data structure hands you the maximum quickly and accepts the smaller pile back?',
    'Piles are at most 10^4 stones. Is there an even simpler structure than a heap that keeps piles ordered by size?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Each operation removes <code>floor(p / 2)</code>, which grows with <code>p</code>, so the best single move
    is always on the current largest pile. Keep the piles in a max-heap: pop the largest, push back
    <code>p - floor(p / 2)</code>, and repeat <code>k</code> times. The answer is the starting total minus
    everything removed.</p>
    <h4>Why it works</h4>
    <p>An exchange argument: if some optimal plan halves a smaller pile while a larger one is available, halving
    the larger one instead removes at least as many stones now and leaves piles that are no worse later. So
    repeatedly taking the current maximum is optimal, and a halved pile goes back into the heap because it can be
    the largest again.</p>
    <h4>Complexity</h4>
    <p>O(n) to build the heap and O(log n) per operation: O(n + k log n) time, O(n) space. Since piles are at most
    10<sup>4</sup>, counting piles per size and walking the sizes from the top also works in O(n + 10<sup>4</sup> + k).</p>
    <h4>Pitfall</h4>
    <p>The operation removes <code>floor(p / 2)</code>, so 9 becomes 5, not 4. Sorting once and halving each pile in
    that order misses that a halved pile can still be the largest. Searching the array for the maximum on every
    operation is O(n * k), about 10<sup>10</sup> steps at the limits.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'minStoneSum',
    params: [
      { name: 'piles', type: 'int[]' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: piles as a JSON array and k, on two lines or separated by ;
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const parts = raw.split(/\n|;/).map((s) => s.trim()).filter(Boolean);
    const usage = 'Enter piles and k on two lines (or separated by ;), e.g. [5,4,9]; 2.';
    if (parts.length !== 2) return { ok: false, error: usage };
    let piles;
    let k;
    try {
      piles = JSON.parse(parts[0]);
      k = JSON.parse(parts[1]);
    } catch {
      return { ok: false, error: usage };
    }
    if (!Array.isArray(piles) || piles.length < 1 || piles.length > MAX_N) return { ok: false, error: 'piles must have 1 to 10^5 numbers.' };
    if (!piles.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_V)) return { ok: false, error: 'Every pile must hold 1 to 10^4 stones.' };
    if (!Number.isInteger(k) || k < 1 || k > MAX_K) return { ok: false, error: 'k must be an integer from 1 to 10^5.' };
    return { ok: true, args: [piles, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(...args),

  // k = n operations on n random piles: every operation pops and pushes, and piles of 1 stay rare,
  // so the heap does full work on every step. n counts piles plus operations.
  growth: {
    target: 'n log n',
    n: 'piles.length (with k = piles.length)',
    sizes: [12500, 25000, 50000, 100000, 200000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 1, max: MAX_V }), n],
  },
};

export default problem;
