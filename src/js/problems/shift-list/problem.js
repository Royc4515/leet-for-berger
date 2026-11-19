/**
 * Problem: Shift List
 *
 * Rotate a linked list to the right by k places: the last k nodes move, in order, to the front.
 * Count the length n, reduce k modulo n, then cut once and splice the tail onto the old head.
 * The classic bugs are dividing by zero on an empty list, rotating one step at a time (k is up
 * to 2 * 10^9, and even k mod n steps cost O(n) each), and an off-by-one in where to cut.
 *
 * Linked lists cross the worker boundary as arrays ([1,2,3]); engine/adapters.js turns them
 * into ListNode objects for the user's code and back.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_K = 2000000000;
const MAX_VAL = 100;

/**
 * Reference on the JSON form: the last (k mod n) values move to the front.
 * @param {number[]} values list values head to tail
 * @param {number} k
 * @returns {number[]}
 */
export function reference(values, k) {
  const n = values.length;
  if (n === 0) return [];
  const s = k % n;
  return [...values.slice(n - s), ...values.slice(0, n - s)];
}

/** Deterministic generators: hidden tests must be identical on every run, or results flake. */
function randomValues(seed, n) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * (2 * MAX_VAL + 1)) - MAX_VAL);
}

const visible = [
  { args: [[1, 2, 3, 4, 5], 2], expected: [4, 5, 1, 2, 3], note: 'The last two nodes, 4 and 5, move to the front in order.' },
  { args: [[0, 1, 2], 4], expected: [2, 0, 1], note: 'Rotating 3 nodes by 3 changes nothing, so 4 places is the same as 1.' },
  { args: [[], 3], expected: [], note: 'An empty list stays empty, whatever k is.' },
  { args: [[7, 8], 0], expected: [7, 8], note: 'k = 0 leaves the list unchanged.' },
  { args: [[1, 2, 3], 3], expected: [1, 2, 3], note: 'k equal to the length is a full turn.' },
];

// Hidden tests: a single node, k a multiple of n, k = n - 1, k = 1, and at max size 10^5 nodes
// with k near 2 * 10^9 and k mod n near n / 2, so rotating one step at a time is far too slow.
const hiddenArgs = [
  [[5], MAX_K],
  [[1, 2], 1],
  [[1, 2, 3, 4], 8],
  [[-1, 0, 1, 2, 3], 4],
  [[9, 9, 8], 1],
  [randomValues(3, 1000), 999],
  [randomValues(5, MAX_N), MAX_K - 49999],
  [randomValues(7, MAX_N), 50000],
  [randomValues(11, MAX_N), MAX_K],
  [randomValues(13, MAX_N - 1), 1999999999],
];

export const problem = {
  id: 'shift-list',
  title: 'Shift List',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Linked List', 'Two Pointers'],
  timeLimitMs: 2000,
  argNames: ['head', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>head</code> of a singly linked list and an integer <code>k</code>.
    Rotate the list to the right by <code>k</code> places and return the new head.</p>
    <p>One rotation moves the last node to the front. Rotating by <code>k</code> repeats that
    <code>k</code> times, so the last <code>k</code> nodes end up first, in their original order.
    Note that <code>k</code> can be far larger than the length of the list.</p>
    <p>In the examples a list is written as its values from head to tail, so <code>[1,2,3]</code>
    means <code>1 -> 2 -> 3</code>.</p>
  `,
  constraints: [
    '0 <= number of nodes <= 10^5',
    '-100 <= Node.val <= 100',
    '0 <= k <= 2 * 10^9',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `head = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Rotating a list of n nodes by n places gives back the same list. What does that tell you about large k?',
    'After reducing k, which node becomes the new head, and which node becomes the new tail?',
    'You need the length and the last node anyway. Can one walk give you both?',
    'What should happen when the list is empty, before you reduce k by its length?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Count the length <code>n</code>, reduce <code>k</code> to <code>k % n</code>, then cut the list once:
    the last <code>k</code> nodes become the front, and the old tail links to the old head. Two pointers
    <code>k</code> nodes apart find the cut in one walk.</p>
    <h4>Why it works</h4>
    <p>Rotating by <code>n</code> places returns the same list, so only <code>k % n</code> matters, and if it
    is <code>0</code> nothing changes. Moving <code>fast</code> <code>k</code> nodes ahead and then advancing
    both until <code>fast</code> is the tail leaves <code>slow</code> exactly <code>k</code> nodes before the
    end, on the node just before the new head. Detaching after <code>slow</code> and attaching the old head
    after <code>fast</code> gives the rotated list.</p>
    <h4>Complexity</h4>
    <p>O(n) time, two walks over the list. O(1) extra space. Rotating one step at a time costs O(n) per
    step, which with <code>k</code> up to 2 * 10^9 is hopeless, and still O(n^2) after reducing
    <code>k</code>.</p>
    <h4>Pitfall</h4>
    <p>Handle the empty list before computing <code>k % n</code>, or it divides by zero. The other common
    slip is cutting one node off: the new tail is the node <code>n - k</code> from the start, counting from
    1, and the new head is the one after it.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'rotateRight',
    params: [
      { name: 'head', type: 'ListNode' },
      { name: 'k', type: 'int' },
    ],
    returns: 'ListNode',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the list as a JSON array on the first line, k on the second.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the list as a JSON array, then k.' };
    let values;
    let k;
    try {
      values = JSON.parse(lines[0]);
      k = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'The list must be a JSON array and k an integer.' };
    }
    if (!Array.isArray(values) || values.length > MAX_N) return { ok: false, error: 'The list must be a JSON array of at most 10^5 values.' };
    if (!values.every((v) => Number.isInteger(v) && v >= -MAX_VAL && v <= MAX_VAL)) return { ok: false, error: 'Values must be integers from -100 to 100.' };
    if (!Number.isInteger(k) || k < 0 || k > MAX_K) return { ok: false, error: 'k must be an integer from 0 to 2 * 10^9.' };
    return { ok: true, args: [values, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
