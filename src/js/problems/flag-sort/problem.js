/**
 * Problem: Flag Sort
 *
 * Sort an array that only contains 0, 1 and 2 (three colors). Any sort works, but the point is the
 * one-pass partition with three pointers (the Dutch national flag): `lo` ends the block of 0s,
 * `hi` starts the block of 2s, and `mid` scans the unknown middle. The original problem rewrites
 * the array in place; here the solution returns the sorted array, which every harness can judge.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_LEN = 100000;

/**
 * Reference: one pass with three pointers. Works on a copy.
 * @param {number[]} nums values in {0, 1, 2}
 * @returns {number[]} the same values in ascending order
 */
export function reference(nums) {
  const a = nums.slice();
  let lo = 0;
  let mid = 0;
  let hi = a.length - 1;
  while (mid <= hi) {
    if (a[mid] === 0) {
      [a[lo], a[mid]] = [a[mid], a[lo]];
      lo++;
      mid++;
    } else if (a[mid] === 1) {
      mid++;
    } else {
      [a[mid], a[hi]] = [a[hi], a[mid]];
      // don't touch / mid stays put: the value swapped in from the right has not been looked at yet.
      hi--;
    }
  }
  return a;
}

/** `n` seeded values in {0, 1, 2} with the given weights for 0 and 1 (the rest is 2). */
function randomColors(seed, n, p0, p1) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const r = rnd();
    return r < p0 ? 0 : r < p0 + p1 ? 1 : 2;
  });
}

const visible = [
  { args: [[2, 0, 2, 1, 1, 0]], expected: [0, 0, 1, 1, 2, 2], note: 'Two of each color, put in order 0, 1, 2.' },
  { args: [[2, 0, 1]], expected: [0, 1, 2], note: 'One of each, fully out of order.' },
  { args: [[0]], expected: [0], note: 'One element is already sorted.' },
  { args: [[1, 1, 1]], expected: [1, 1, 1], note: 'A single color stays as it is.' },
  { args: [[2, 2, 1, 0, 0]], expected: [0, 0, 1, 2, 2], note: 'The 2s must travel left to right across the whole array.' },
];

// Hidden tests: a 2 swapped in from the right that is itself a 2 or a 0 (advancing the middle
// pointer too early leaves it unsorted), only two colors present, and five arrays of 10^5 values:
// descending blocks (worst case for insertion or bubble sort), alternating 2, 0, mostly 1 with
// stray 0 and 2 at the ends, all equal, and uniformly random.
const descendingBlocks = [
  ...new Array(33334).fill(2),
  ...new Array(33333).fill(1),
  ...new Array(33333).fill(0),
];
const alternating = Array.from({ length: MAX_LEN }, (_, i) => (i % 2 === 0 ? 2 : 0));
const mostlyOnes = new Array(MAX_LEN).fill(1);
mostlyOnes[0] = 2;
mostlyOnes[MAX_LEN - 1] = 0;
const hiddenInputs = [
  [1, 2, 0],
  [2, 2, 0, 0, 1],
  [1, 0, 2, 1, 2, 0, 1],
  [2, 1, 2, 1, 2, 1],
  [0, 2, 0, 2, 0, 2, 1, 0],
  descendingBlocks,
  alternating,
  mostlyOnes,
  new Array(MAX_LEN).fill(2),
  randomColors(31, MAX_LEN, 1 / 3, 1 / 3),
];

/** @param {unknown} v */
const isColor = (v) => v === 0 || v === 1 || v === 2;

export const problem = {
  id: 'flag-sort',
  title: 'Flag Sort',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Partitioning'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>An array <code>nums</code> holds colors written as <code>0</code>, <code>1</code> and
    <code>2</code>. Return the array with the colors grouped in ascending order: every
    <code>0</code>, then every <code>1</code>, then every <code>2</code>.</p>
    <p>A library sort would do, but the intended solution is better: it makes a single pass over the
    array and keeps only a few extra variables. It rearranges the values it was given and returns them.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    'nums[i] is 0, 1 or 2',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Only three values exist. What is the simplest way to sort them if you may scan the array twice, and what would that cost in extra memory?',
    'Can you describe the array at any moment as four regions: known zeros, known ones, unknown, known twos? Where do the boundaries sit at the start?',
    'When the value under your scanner is a 0, where does it belong, and what value do you get in exchange? Is that value safe to skip?',
    'When the value is a 2, you swap it to the right end. What do you know about the value that just arrived under the scanner?',
    'Which pointer must not move after the swap with the right end, and why?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep three pointers: <code>lo</code> is the end of the block of 0s, <code>hi</code> the start of the
    block of 2s, and <code>mid</code> scans what is left. A <code>0</code> swaps with <code>lo</code> and both
    advance; a <code>1</code> just advances <code>mid</code>; a <code>2</code> swaps with <code>hi</code> and only
    <code>hi</code> moves. Stop when <code>mid</code> passes <code>hi</code>.</p>
    <h4>Why it works</h4>
    <p>The invariant is <code>[0, lo)</code> all 0, <code>[lo, mid)</code> all 1, <code>(hi, end]</code> all 2, and
    <code>[mid, hi]</code> unknown. Each step keeps it true and shrinks the unknown part by one, so the
    array is sorted when the unknown part is empty.</p>
    <h4>Complexity</h4>
    <p>O(n) time with one pass, O(1) extra space. Counting the colors and rewriting the array is also
    O(n) but takes two passes.</p>
    <h4>Pitfall</h4>
    <p>After swapping a <code>2</code> to the right, the value that arrives at <code>mid</code> is unseen, so
    do not advance <code>mid</code>; if it is a <code>0</code> or another <code>2</code>, leaving it unchecked
    breaks the order. After swapping a <code>0</code> with <code>lo</code> it is safe to advance, because
    everything in <code>[lo, mid)</code> is a 1.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'flagSort',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((nums) => ({ args: [nums], expected: reference(nums) })),

  /**
   * Custom input: the colors as one JSON array, for example [2,0,2,1,1,0].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [2,0,2,1,1,0].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_LEN) return { ok: false, error: 'Enter 1 to 10^5 values as a JSON array.' };
    if (!nums.every(isColor)) return { ok: false, error: 'Every value must be 0, 1 or 2.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random colors in equal
  // shares; repeatedly moving a value to its place by shifting (insertion sort) is n^2 on them.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 0, max: 2 })],
  },
};

export default problem;
