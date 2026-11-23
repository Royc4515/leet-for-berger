/**
 * Problem: List Midpoint
 *
 * Equivalent to LeetCode 876 (Middle of the Linked List); statement and tests are written for this
 * project. Return the middle node of a non-empty singly linked list; if the list has an even
 * number of nodes, return the second of the two middle nodes. Moving a slow pointer 1 step and a
 * fast pointer 2 steps per iteration lands slow on index floor(n / 2) in O(n) time and O(1) space.
 *
 * Classic wrong answers: returning the first middle node on even-length lists (index floor((n-1)/2)
 * instead of floor(n/2)), checking only `fast.next != null` without `fast != null` (null pointer
 * crash on even lengths), returning only the single middle node detached from the tail instead of
 * the node itself with its remaining suffix, and indexing off by one on single-node lists.
 *
 * The limit is raised from 100 to 10^5 nodes so single-pass O(n) traversal is tested at scale.
 */

import { mulberry32 } from '../../engine/rng.js';
import { linkedList } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_ABS = 5000;

/**
 * Reference on the JSON form: the suffix starting at index Math.floor(values.length / 2).
 * @param {number[]} values list values head to tail (non-empty)
 * @returns {number[]}
 */
export function reference(values) {
  return values.slice(Math.floor(values.length / 2));
}

/** Deterministic packed array of n values in [-5000, 5000]. */
function randomValues(seed, n) {
  const rnd = mulberry32(seed);
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) out[i] = Math.floor(rnd() * (2 * MAX_ABS + 1)) - MAX_ABS;
  return out;
}

const visible = [
  { args: [[1, 2, 3, 4, 5]], expected: [3, 4, 5], note: 'With 5 nodes, node 3 (0-based index 2) is the exact middle.' },
  { args: [[1, 2, 3, 4, 5, 6]], expected: [4, 5, 6], note: 'With 6 nodes, there are two middle nodes (3 and 4); return the second one (4).' },
  { args: [[42]], expected: [42], note: 'A single node is its own middle.' },
  { args: [[10, 20]], expected: [20], note: 'With 2 nodes, the second middle node is 20.' },
  { args: [[5, 5, 5, 5]], expected: [5, 5], note: 'Equal values still split by position: 2 nodes remain from index 2 onward.' },
];

// Hidden tests: 3 nodes, 4 nodes, negative extremes, 7 nodes, 1000 nodes (even), 999 nodes (odd),
// plus max-size 10^5 (even) and 99999 (odd) lists, all-equal 10^5, and strictly ramping 10^5.
const hiddenInputs = [
  [1, 2, 3],
  [1, 2, 3, 4],
  [-MAX_ABS, 0, MAX_ABS, -MAX_ABS, 0],
  [9, 8, 7, 6, 5, 4, 3],
  Array.from({ length: 1000 }, (_, i) => i + 1),
  randomValues(8761, 999),
  randomValues(8762, MAX_N),
  randomValues(8763, MAX_N - 1),
  new Array(MAX_N).fill(-7),
  Array.from({ length: MAX_N }, (_, i) => (i % 10001) - MAX_ABS),
];

export const problem = {
  id: 'list-midpoint',
  title: 'List Midpoint',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Linked List', 'Fast & Slow Pointers'],
  timeLimitMs: 2000,
  argNames: ['head'],

  statementHtml: `
    <p>You are given the <code>head</code> of a non-empty singly linked list. Return the
    <strong>middle node</strong> of the list.</p>
    <p>If the list has an even number of nodes, there are two middle nodes; return the
    <strong>second</strong> middle node. In the examples a list is written as its values from head
    to tail, so returning the middle node prints the list starting from that node.</p>
  `,
  constraints: [
    '1 <= number of nodes <= 10^5',
    '-5000 <= Node.val <= 5000',
    'Target complexity: O(n) time in one pass, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `head = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  hints: [
    'If two runners start at head and one moves twice as fast as the other, where is the slower runner when the faster one reaches the end?',
    'Check both odd (length 5) and even (length 6) lists by hand with slow += 1 and fast += 2 starting at head.',
    'What loop condition prevents dereferencing null when fast jumps two steps at a time?',
    'Should you detach the middle node from the rest of the list, or return the node pointer directly?',
  ],

  explanationHtml: `
    <h4>Idea</h4>
    <p>Start both <code>slow</code> and <code>fast</code> at <code>head</code>. While
    <code>fast</code> and <code>fast.next</code> are non-null, move <code>slow</code> forward one
    node and <code>fast</code> forward two nodes. When the loop ends, return <code>slow</code>.</p>
    <h4>Why it works</h4>
    <p>After <code>k</code> steps, <code>slow</code> is at 0-based index <code>k</code> and
    <code>fast</code> is at index <code>2k</code>. For odd length <code>2m + 1</code>, the loop
    stops when <code>fast</code> reaches index <code>2m</code> (the tail), leaving <code>slow</code>
    at <code>m</code>. For even length <code>2m</code>, <code>fast</code> steps onto
    <code>null</code> at index <code>2m</code>, leaving <code>slow</code> at index <code>m</code>,
    which is the second middle node.</p>
    <h4>Complexity</h4>
    <p>O(n) time in a single pass and O(1) extra space (two pointers).</p>
    <h4>Pitfall</h4>
    <p>Starting <code>fast</code> at <code>head.next</code> lands <code>slow</code> on the
    <em>first</em> middle node for even lengths instead of the second. Also always check
    <code>fast != null &amp;&amp; fast.next != null</code> in that order so even-length lists never
    dereference <code>null</code>.</p>
  `,

  signature: {
    name: 'middleNode',
    params: [{ name: 'head', type: 'ListNode' }],
    returns: 'ListNode',
  },

  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),
  hiddenTests: hiddenInputs.map((values) => ({ args: [values], expected: reference(values) })),

  growth: {
    target: 'n',
    n: 'number of nodes',
    sizes: [128000, 256000, 512000, 1024000, 2048000, 4096000],
    // Any list of n nodes exercises the full fast/slow traversal to floor(n / 2).
    input: (n, seed) => [linkedList(n, mulberry32(seed), { min: -MAX_ABS, max: MAX_ABS })],
  },

  /**
   * Custom input: non-empty list as a JSON array of integers.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let values;
    try {
      values = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter a non-empty JSON array of values, for example [1,2,3,4,5].' };
    }
    if (!Array.isArray(values) || values.length < 1 || values.length > MAX_N) {
      return { ok: false, error: 'The list needs 1 to 10^5 nodes.' };
    }
    if (!values.every((v) => Number.isInteger(v) && v >= -MAX_ABS && v <= MAX_ABS)) {
      return { ok: false, error: 'Values must be integers from -5000 to 5000.' };
    }
    return { ok: true, args: [values] };
  },

  solveReference: (args) => reference(args[0]),
};

export default problem;
