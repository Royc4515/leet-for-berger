/**
 * Problem: Sorted List Dedupe
 *
 * Equivalent to LeetCode 83 (Remove Duplicates from Sorted List); statement and tests are written
 * for this project. Given the head of a sorted singly linked list, delete duplicate nodes so each
 * distinct value appears once, keeping the list in sorted order. Because duplicates are always
 * adjacent, a single pointer removes runs in O(n) time and O(1) extra space.
 *
 * Classic wrong answers: advancing curr after skipping one duplicate (leaves the third copy in a
 * run of 3+ equal values like [1, 2, 2, 2]), dereferencing head.next on an empty list, removing
 * every copy of a duplicated value instead of keeping one (that is LC 82), and recursive solutions
 * that overflow the call stack on 10^5 nodes.
 *
 * The limit is raised from 300 to 10^5 nodes so quadratic rescans and deep recursion fail clearly.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 5000;

/**
 * Reference on the JSON form: keep each element whose value differs from the previous one.
 * @param {number[]} values sorted list values head to tail
 * @returns {number[]}
 */
export function reference(values) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    if (i === 0 || values[i] !== values[i - 1]) out.push(values[i]);
  }
  return out;
}

/** Deterministic sorted packed array of length n with mixed run lengths inside [-5000, 5000]. */
function sortedRuns(seed, n) {
  const rnd = mulberry32(seed);
  const out = new Array(n).fill(0);
  // Spread distinct values gently across [-5000, 5000] with run lengths 1..4 so both branches
  // (skip duplicate vs advance) trigger throughout the list.
  const step = Math.max(1, Math.floor(n / 4000));
  let val = -MAX_ABS;
  let i = 0;
  while (i < n) {
    const run = 1 + Math.floor(rnd() * 4);
    for (let r = 0; r < run && i < n; r++) out[i++] = val;
    if (i % step < 4 && val < MAX_ABS) val++;
  }
  return out;
}

/** Sorted array stepping across [-5000, 5000] with equal-sized blocks covering all 10001 values. */
function fullRangeSorted(n) {
  const out = new Array(n).fill(0);
  const span = 2 * MAX_ABS + 1;
  for (let i = 0; i < n; i++) out[i] = -MAX_ABS + Math.floor((i * span) / n);
  return out;
}

const visible = [
  { args: [[1, 1, 2]], expected: [1, 2], note: 'The extra 1 is skipped so each distinct value stays once.' },
  { args: [[1, 1, 2, 3, 3]], expected: [1, 2, 3], note: 'Both the repeated 1 and the repeated 3 collapse to a single node.' },
  { args: [[]], expected: [], note: 'An empty list stays empty.' },
  { args: [[7]], expected: [7], note: 'A single node has no duplicates.' },
  { args: [[4, 4, 4, 4]], expected: [4], note: 'A long run of equal values collapses to one node.' },
];

// Hidden tests: extremes at both ends, strictly distinct values, run of 3+ at head, run of 3+ at
// tail (catches advancing curr immediately after deleting one copy), mixed negatives, two equal
// nodes, plus max-size 10^5 lists (all identical, full -5000..5000 range, alternating runs, seeded).
const hiddenInputs = [
  [-MAX_ABS, -MAX_ABS, 0, 0, MAX_ABS, MAX_ABS],
  [1, 2, 3, 4, 5],
  [0, 0, 0, 1],
  [1, 2, 2, 2],
  [-3, -3, -2, -1, -1, -1],
  [10, 10],
  new Array(MAX_N).fill(42),
  fullRangeSorted(MAX_N),
  Array.from({ length: MAX_N }, (_, i) => Math.floor(i / 20) - 2500),
  sortedRuns(8301, MAX_N),
];

export const problem = {
  id: 'sorted-list-dedupe',
  title: 'Sorted List Dedupe',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Linked List', 'In-Place Filtering'],
  timeLimitMs: 2000,
  argNames: ['head'],

  statementHtml: `
    <p>You are given the <code>head</code> of a singly linked list whose node values are sorted in
    <strong>non-decreasing order</strong>. Remove duplicate nodes so that each distinct value appears
    only once, and return the head of the updated sorted list.</p>
    <p>In the examples a list is written as its values from head to tail, so <code>[1,1,2]</code>
    means <code>1 -> 1 -> 2</code>.</p>
  `,
  constraints: [
    '0 <= number of nodes <= 10^5',
    '-5000 <= Node.val <= 5000',
    'The list is sorted in non-decreasing order',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `head = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  hints: [
    'Because the list is already sorted, where must every duplicate of a node appear?',
    'When curr.val equals curr.next.val, how do you unlink curr.next without losing the rest of the list?',
    'After unlinking curr.next, should you move curr forward right away, or check the new curr.next first?',
    'What happens when the input list is empty or has only one node?',
  ],

  explanationHtml: `
    <h4>Idea</h4>
    <p>Walk the list with a single pointer <code>curr</code> starting at <code>head</code>. Whenever
    <code>curr.next</code> has the same value as <code>curr</code>, bypass it with
    <code>curr.next = curr.next.next</code> without advancing <code>curr</code>. Only advance
    <code>curr = curr.next</code> when the next value is strictly larger (or <code>null</code>).</p>
    <h4>Why it works</h4>
    <p>In a sorted list, all equal values form one contiguous run. Staying on the first node of a
    run until <code>curr.next</code> holds a different value strips every extra copy in that run,
    no matter how long, while keeping the head of the list intact.</p>
    <h4>Complexity</h4>
    <p>O(n) time (each node is either skipped once or advanced past once) and O(1) extra space.</p>
    <h4>Pitfall</h4>
    <p>Advancing <code>curr</code> immediately after deleting one duplicate fails on three or more
    consecutive equal values (<code>[1, 2, 2, 2]</code> leaves <code>[1, 2, 2]</code>). Also guard
    against an empty list (<code>head == null</code>) and keep the walk iterative so 10^5 nodes do
    not overflow the call stack.</p>
  `,

  signature: {
    name: 'dedupeSortedList',
    params: [{ name: 'head', type: 'ListNode' }],
    returns: 'ListNode',
  },

  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),
  hiddenTests: hiddenInputs.map((values) => ({ args: [values], expected: reference(values) })),

  growth: {
    target: 'n',
    n: 'number of nodes',
    sizes: [128000, 256000, 512000, 1024000, 2048000, 4096000],
    // Mixed sorted runs of length 1..4 trigger both pointer-rewiring and pointer-advance branches.
    input: (n, seed) => [sortedRuns(seed, n)],
  },

  /**
   * Custom input: sorted list as a JSON array of integers.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let values;
    try {
      values = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter a sorted JSON array of values, for example [1,1,2,3,3].' };
    }
    if (!Array.isArray(values) || values.length > MAX_N) {
      return { ok: false, error: 'The list must be a JSON array of 0 to 10^5 integers.' };
    }
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (!Number.isInteger(v) || v < -MAX_ABS || v > MAX_ABS) {
        return { ok: false, error: 'Values must be integers from -5000 to 5000.' };
      }
      if (i > 0 && v < values[i - 1]) {
        return { ok: false, error: 'The list must be sorted in non-decreasing order.' };
      }
    }
    return { ok: true, args: [values] };
  },

  solveReference: (args) => reference(args[0]),
};

export default problem;
