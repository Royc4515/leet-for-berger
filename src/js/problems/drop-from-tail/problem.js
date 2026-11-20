/**
 * Problem: Drop From Tail
 *
 * Equivalent to LeetCode 19; statement and tests are written for this project. Remove the n-th
 * node counted from the end of a singly linked list in a single pass. The list length is not
 * known up front, so the trick is a second pointer that starts n nodes behind the first: when the
 * leader falls off the end, the follower stands just before the node to drop.
 *
 * Classic wrong answers: counting from the front instead of the back, an off-by-one that removes
 * the neighbor, forgetting that the head itself can be the node to drop (n equals the length), and
 * removing the first node whose value matches instead of the node at that position.
 *
 * The limit is raised from 30 to 10^5 nodes so a quadratic "walk to the node again for each
 * candidate" approach is clearly too slow.
 */

import { mulberry32 } from '../../engine/rng.js';
import { linkedList } from '../../engine/growth-inputs.js';

const MAX_N = 100000;

/**
 * Reference on the JSON form: the values without the n-th one from the end.
 * @param {number[]} values list values head to tail
 * @param {number} n 1-based position from the end, 1 <= n <= values.length
 * @returns {number[]}
 */
export function reference(values, n) {
  const drop = values.length - n;
  return values.filter((_, i) => i !== drop);
}

/** Deterministic generators: hidden tests must be identical on every run, or results flake. */
function randomValues(seed, n) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * 10001) - 5000);
}

const visible = [
  { args: [[1, 2, 3, 4, 5], 2], expected: [1, 2, 3, 5], note: 'The second node from the end is 4.' },
  { args: [[1], 1], expected: [], note: 'Dropping the only node leaves an empty list.' },
  { args: [[1, 2], 1], expected: [1], note: 'n = 1 drops the tail.' },
  { args: [[1, 2], 2], expected: [2], note: 'n equal to the length drops the head.' },
  { args: [[1, 2, 1, 2, 1], 3], expected: [1, 2, 2, 1], note: 'Equal values: the node at that position goes, not the first one with the same value.' },
];

// Hidden tests: one node, a pair, the head and the tail of a longer list, equal values, a random
// middle drop, and four lists of 10^5 nodes (tail, head, middle, second node).
const hiddenInputs = [
  [[0], 1],
  [[5, -5], 2],
  [[1, 2, 3, 4, 5, 6, 7, 8, 9], 9],
  [[1, 2, 3, 4, 5, 6, 7, 8, 9], 1],
  [[-3, -3, -3], 2],
  [randomValues(7, 1000), 337],
  [randomValues(11, MAX_N), 1],
  [randomValues(13, MAX_N), MAX_N],
  [randomValues(17, MAX_N), 50000],
  [randomValues(19, MAX_N), MAX_N - 1],
];

export const problem = {
  id: 'drop-from-tail',
  title: 'Drop From Tail',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Linked List', 'Two Pointers', 'Dummy Node'],
  timeLimitMs: 2000,
  argNames: ['head', 'n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>head</code> of a singly linked list and an integer <code>n</code>.
    Remove the <code>n</code>-th node counted from the end of the list (so <code>n = 1</code> is the
    last node) and return the head of the resulting list.</p>
    <p>Try to do it in one pass over the list. In the examples a list is written as its values from
    head to tail, so <code>[1,2,3]</code> means <code>1 -> 2 -> 3</code>.</p>
  `,
  constraints: [
    '1 <= number of nodes <= 10^5',
    '-5000 <= Node.val <= 5000',
    '1 <= n <= number of nodes',
    'Target complexity: O(n) time in a single pass, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `head = ${JSON.stringify(t.args[0])}, n = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you knew the length of the list, which position from the front would you drop?',
    'Can you learn the length without a first pass, by letting one pointer run ahead of another?',
    'How far ahead of the second pointer should the first one start, so that the second stops right before the node to remove?',
    'What if the node to remove is the head: which node would the second pointer need to start on?',
    'Would a placeholder node in front of the head make the head case look like every other case?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Put a placeholder node in front of the head. Start two pointers on it. Move the first pointer
    <code>n</code> steps ahead, then move both together until the first pointer stands on the last
    node. The second pointer is now right before the node to remove: set its <code>next</code> to
    skip that node.</p>
    <h4>Why it works</h4>
    <p>The two pointers stay exactly <code>n</code> nodes apart. When the front one is on the last
    node, the back one is <code>n</code> nodes behind it, which is the node just before the
    <code>n</code>-th from the end. The placeholder gives the head a predecessor, so dropping the
    first node needs no special case.</p>
    <h4>Complexity</h4>
    <p>O(n) time, each pointer moves at most once over the list. O(1) extra space. Counting the
    length first and walking again is also O(n) but takes two passes.</p>
    <h4>Pitfall</h4>
    <p>Without the placeholder, <code>n</code> equal to the length leaves the follower with nothing
    to stand on and the head is returned unchanged. Starting the pointers one step off removes the
    neighbor of the right node.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'dropFromTail',
    params: [
      { name: 'head', type: 'ListNode' },
      { name: 'n', type: 'int' },
    ],
    returns: 'ListNode',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map(([values, n]) => ({ args: [values, n], expected: reference(values, n) })),

  /**
   * Custom input: two lines, the list as a JSON array of values, then n.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the list as a JSON array, then n.' };
    let values;
    let n;
    try {
      values = JSON.parse(lines[0]);
      n = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter the list as a JSON array, for example [1,2,3,4,5], and n as an integer.' };
    }
    if (!Array.isArray(values) || values.length < 1 || values.length > MAX_N) return { ok: false, error: 'The list needs 1 to 10^5 nodes.' };
    if (!values.every((v) => Number.isInteger(v) && v >= -5000 && v <= 5000)) {
      return { ok: false, error: 'Values must be integers from -5000 to 5000.' };
    }
    if (!Number.isInteger(n) || n < 1 || n > values.length) return { ok: false, error: 'n must be an integer from 1 to the number of nodes.' };
    return { ok: true, args: [values, n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). n is the middle node
  // so a solution that counts the length and walks again does two passes and one that rescans the
  // list for each candidate is n^2; the answer is a list of about n values either way.
  growth: {
    target: 'n',
    n: 'number of nodes',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => [linkedList(n, mulberry32(seed), { min: -5000, max: 5000 }), Math.ceil(n / 2)],
  },
};

export default problem;
