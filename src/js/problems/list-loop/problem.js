/**
 * Problem: List Loop
 *
 * Decide whether a singly linked list loops back on itself. The canonical fast and slow pointer
 * problem: the same two-speed walk later finds the loop's entry, a list's middle and duplicate
 * numbers in an array.
 *
 * The head parameter has type ListNode@cycle: a test writes it as [values, pos], where pos is the
 * index the tail links back to (-1 for none). The adapters and harnesses build that list; the
 * user's code receives only the head and never sees pos.
 */

import { mulberry32 } from '../../engine/rng.js';
import { checkCycleArg } from '../../engine/structures.js';

const MAX_N = 100000;
const MAX_V = 100000;

/**
 * Reference on the JSON form. The list loops exactly when its tail links back somewhere.
 * @param {[number[], number]} list [values, pos]
 * @returns {boolean}
 */
export function reference(list) {
  return list[1] !== -1;
}

/** Deterministic generators: hidden tests must be identical on every run, or results flake. */
function randomValues(seed, n, span = MAX_V) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * (2 * span + 1)) - span);
}

const visible = [
  { args: [[[3, 2, 0, -4], 1]], expected: true, note: 'The tail links back to the node at index 1, so the walk never ends.' },
  { args: [[[1, 2], 0]], expected: true, note: 'The second node links back to the head.' },
  { args: [[[1], -1]], expected: false, note: 'One node with no link back.' },
  { args: [[[], -1]], expected: false, note: 'An empty list cannot loop.' },
  { args: [[[1, 2, 3, 4, 5], 4]], expected: true, note: 'The tail links to itself.' },
];

// Hidden tests: self-loops, repeated values without a loop (comparing values instead of nodes is
// wrong), lists longer than a "give up after 10^4 steps" guess, and 10^5 nodes, where checking every
// node against all earlier ones (O(n^2)) is too slow.
const hiddenInputs = [
  [[7], 0],
  [[5, 5, 5, 5], -1],
  [[-1, -2, -3], 2],
  [randomValues(3, 1000, 3), 0],
  [Array.from({ length: 10001 }, (_, i) => i % 7), -1],
  [randomValues(7, 20000), 19999],
  [randomValues(11, MAX_N), -1],
  [randomValues(13, MAX_N), 0],
  [randomValues(17, MAX_N, 2), 54321],
  [Array.from({ length: 99999 }, (_, i) => i), -1],
];

export const problem = {
  id: 'list-loop',
  title: 'List Loop',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Linked List', 'Fast and Slow Pointers'],
  timeLimitMs: 2000,
  argNames: ['head'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>head</code> of a singly linked list. Return <code>true</code> if
    following <code>next</code> pointers from the head eventually revisits a node, and
    <code>false</code> if the walk reaches the end of the list.</p>
    <p>In the tests a list is written as <code>[values, pos]</code>: the values from head to tail,
    and the index of the node the tail links back to, or <code>-1</code> when the tail ends the list.
    Your function only receives the head; <code>pos</code> is not passed to it.</p>
  `,
  constraints: [
    '0 <= number of nodes <= 10^5',
    '-10^5 <= Node.val <= 10^5',
    'pos is -1 or a valid index in the list',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `head = ${JSON.stringify(t.args[0][0])}, pos = ${t.args[0][1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If the list does loop, what happens to a simple walk that follows next pointers?',
    'Two nodes can hold the same value. What exactly should you remember to recognize a revisit?',
    'A set of visited nodes works. Can you do it without any extra memory?',
    'Picture two runners on a circular track, one twice as fast. What must eventually happen?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'hasCycle',
    params: [{ name: 'head', type: 'ListNode@cycle' }],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((list) => ({ args: [list], expected: reference(list) })),

  /**
   * Custom input: two lines, the values as a JSON array and then pos.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the values as a JSON array, then pos (-1 for no loop).' };
    let values;
    let pos;
    try {
      values = JSON.parse(lines[0]);
      pos = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Line 1 must be a JSON array and line 2 an integer, for example [3,2,0,-4] and 1.' };
    }
    const err = checkCycleArg([values, pos]);
    if (err) return { ok: false, error: `The list ${err}.` };
    if (values.length > MAX_N) return { ok: false, error: 'At most 10^5 nodes.' };
    if (!values.every((v) => v >= -MAX_V && v <= MAX_V)) return { ok: false, error: 'Values must be from -10^5 to 10^5.' };
    return { ok: true, args: [[values, pos]] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
