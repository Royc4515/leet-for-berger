/**
 * Problem: Rank Boost
 *
 * Reorder a copy of the array so that as many positions as possible hold a strictly larger value
 * than the original had there. Sort, then sweep with two pointers: the pointer `j` marks the
 * smallest original value not yet beaten, and every value that exceeds it beats it and moves the
 * pointer on. The number of beaten values is the answer.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_LEN = 100000;
const MAX_VAL = 1000000000;

/**
 * Reference: sort, then each value that is larger than the smallest value still unbeaten beats it.
 * O(n log n) time.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  const s = nums.slice().sort((a, b) => a - b);
  let j = 0;
  // `j <= i` always holds, so s[j] is a valid index and never a value from the future.
  for (const x of s) if (x > s[j]) j++;
  return j;
}

/** `n` seeded integers in [0, maxVal]. */
function randomArray(seed, n, maxVal) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * (maxVal + 1)));
}

const visible = [
  { args: [[1, 3, 5, 2, 1, 3, 1]], expected: 4, note: 'One best reordering is [2, 5, 1, 3, 3, 1, 1]: it beats the original at four positions.' },
  { args: [[1, 2, 3, 4]], expected: 3, note: 'Shift every value one place left and put the smallest at the end; all but one position win.' },
  { args: [[7, 7, 7]], expected: 0, note: 'Equal values never beat each other.' },
  { args: [[5]], expected: 0, note: 'A single value has nothing to be reordered against.' },
  { args: [[1, 1, 2, 2]], expected: 2, note: 'Each 2 beats a 1, and the 1s have nothing smaller to beat.' },
];

// Hidden tests: pairs of duplicates (distinct values minus one is wrong), a lone dominant value,
// the minimum size, and five arrays of 10^5 values: all distinct ascending, all equal, a few
// distinct values (so many ties), a wide random range, and one value that fills half the array.
const half = Array.from({ length: MAX_LEN }, (_, i) => (i % 2 === 0 ? 500000000 : i));
const hiddenInputs = [
  [1, 1, 2, 2, 3, 3],
  [4, 4, 4, 4, 9],
  [0, 1000000000],
  [3, 1, 3, 1, 3, 1, 3],
  [2, 2, 2, 5, 5, 8, 8, 8, 8],
  Array.from({ length: MAX_LEN }, (_, i) => i * 10000),
  new Array(MAX_LEN).fill(MAX_VAL),
  randomArray(21, MAX_LEN, 3),
  randomArray(23, MAX_LEN, MAX_VAL),
  half,
];

/** @param {unknown} v */
const isValue = (v) => Number.isInteger(v) && v >= 0 && v <= MAX_VAL;

export const problem = {
  id: 'rank-boost',
  title: 'Rank Boost',
  difficulty: 'Medium',
  topics: ['arrays-strings', 'greedy'],
  patterns: ['Sorting', 'Two Pointers', 'Greedy'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You get an array <code>nums</code>. You may reorder its values into a new array
    <code>shuffled</code> of the same length, using each value exactly as many times as it appears.</p>
    <p>The <em>score</em> of a reordering is the number of positions <code>i</code> where
    <code>shuffled[i] &gt; nums[i]</code>. Return the highest score any reordering can reach.</p>
    <p>Every position is judged against the original array, so you are matching each original value
    with some other value that is strictly larger.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '0 <= nums[i] <= 10^9',
    'Target complexity: O(n log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Try [1, 2, 3]. Which values can possibly beat the 1? Which can beat the 3? Who is the hardest position to win, and who is the easiest?',
    'If you give each position one beater, which beater should go to the smallest original value: the smallest one that still wins, or a big one?',
    'What changes if you sort the values first? Can you then describe "the next value that beats this one" as a pointer that only moves forward?',
    'Walk two pointers over the sorted array: one for the value you are trying to beat and one scanning candidates. When does the first pointer move, and what do equal values do to it?',
    'Is there a quantity about the multiset alone (not the order) that bounds how many positions can win? Think about the most frequent value.',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Sort a copy of the values. Keep a pointer <code>j</code> at the smallest original value that has
    not been beaten yet. Sweep every value <code>x</code> in sorted order: if <code>x &gt; sorted[j]</code>,
    then <code>x</code> beats it, so count one win and advance <code>j</code>. The final <code>j</code> is the
    answer.</p>
    <h4>Why it works</h4>
    <p>Spending the smallest winner on the smallest original value is never worse: a bigger value can
    beat everything the smaller one can, so keeping it for later only adds options. That makes the
    matching greedy, and sorting turns it into a single forward pass. The pointer never passes the
    sweep, so no value beats a position that was not yet reached.</p>
    <h4>Complexity</h4>
    <p>O(n log n) for the sort, O(n) for the sweep, O(n) extra space for the sorted copy. The count also
    equals <code>n</code> minus the highest frequency of any single value, which gives an O(n) solution
    with a hash map.</p>
    <h4>Pitfall</h4>
    <p>The values do not have to be distinct: with <code>[1, 1, 2, 2]</code> the answer is 2, not
    "distinct values minus one". Pairing each position with any larger unused value in input order is
    greedy in the wrong order, and it also needs a search that is quadratic at 10<sup>5</sup> values.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'rankBoost',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((nums) => ({ args: [nums], expected: reference(nums) })),

  /**
   * Custom input: the values as one JSON array, for example [1,3,5,2,1,3,1].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [1,3,5,2,1,3,1].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_LEN) return { ok: false, error: 'Enter 1 to 10^5 values as a JSON array.' };
    if (!nums.every(isValue)) return { ok: false, error: 'Every value must be an integer from 0 to 10^9.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random values: the comparator sort dominates, and the pointer pass reads the sorted copy.
  growth: {
    target: 'n log n',
    n: 'nums.length',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 0, max: 1e9 })],
  },
};

export default problem;
