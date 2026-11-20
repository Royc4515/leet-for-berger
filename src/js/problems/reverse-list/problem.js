/**
 * Problem: Reverse List
 *
 * Reverse a singly linked list and return the new head. The canonical pointer-rewiring problem:
 * every later linked-list technique (reverse a sublist, reverse in groups, palindrome check)
 * builds on doing this in place, iteratively.
 *
 * Linked lists cross the worker boundary as arrays ([1,2,3]); engine/adapters.js turns them
 * into ListNode objects for the user's code and back.
 */

import { mulberry32 } from '../../engine/rng.js';
import { linkedList } from '../../engine/growth-inputs.js';

/**
 * Reference on the JSON form: the reversed array.
 * @param {number[]} values list values head to tail
 * @returns {number[]}
 */
export function reference(values) {
  return [...values].reverse();
}

const MAX_N = 100000;

/** Deterministic generators: hidden tests must be identical on every run, or results flake. */
function randomValues(seed, n) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * 10001) - 5000);
}

const visible = [
  { args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1], note: 'Every next pointer flips direction.' },
  { args: [[1, 2]], expected: [2, 1], note: 'Two nodes: the old tail becomes the head.' },
  { args: [[]], expected: [], note: 'An empty list stays empty.' },
  { args: [[7]], expected: [7], note: 'A single node is its own reverse.' },
  { args: [[3, 3, 1]], expected: [1, 3, 3], note: 'Equal values do not change the rewiring.' },
];

// Hidden tests: tiny edges, palindromes (a no-op reversal looks right), extreme values, and
// lists long enough that a recursive solution overflows the call stack.
const hiddenInputs = [
  [0],
  [-1, -2],
  [1, 2, 3, 2, 1],
  [5000, -5000],
  [4, 4],
  randomValues(7, 1000),
  Array.from({ length: MAX_N }, (_, i) => i - 50000),
  randomValues(11, MAX_N),
  randomValues(13, 99999),
  randomValues(17, 50000),
];

export const problem = {
  id: 'reverse-list',
  title: 'Reverse List',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Linked List', 'Pointer Rewiring'],
  timeLimitMs: 2000,
  argNames: ['head'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>head</code> of a singly linked list. Reverse the list so that every
    node points to the node that used to come before it, and return the new head.</p>
    <p>Rewire the existing nodes. In the examples a list is written as its values from head to tail,
    so <code>[1,2,3]</code> means <code>1 -> 2 -> 3</code>.</p>
  `,
  constraints: [
    '0 <= number of nodes <= 10^5',
    '-5000 <= Node.val <= 5000',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `head = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'When you change node.next, what do you lose access to? How can you keep it?',
    'How many pointers do you need to hold at once while walking the list: what came before, where you are, what comes next?',
    'What should the first node point to once the list is reversed?',
    'A recursive version is elegant. What happens to it on a list of 100,000 nodes?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Walk the list once with two pointers, <code>prev</code> and the current node. For each node, save
    its <code>next</code>, point it back at <code>prev</code>, and step both pointers forward. When the
    walk ends, <code>prev</code> is the new head.</p>
    <h4>Why it works</h4>
    <p>At the start of each step, the nodes already passed form a reversed list headed by
    <code>prev</code>, and the current node starts the untouched rest. Turning one link around moves
    exactly one node from the rest to the reversed part. The first node ends up pointing at
    <code>null</code>, which makes it the new tail, and an empty list returns <code>null</code>
    immediately.</p>
    <h4>Complexity</h4>
    <p>O(n) time, each node is visited once. O(1) extra space, only three pointers. A recursive version is
    also O(n) time but uses O(n) stack.</p>
    <h4>Pitfall</h4>
    <p>Overwriting <code>head.next</code> before saving it loses the rest of the list. The recursive
    version is the other trap: 10^5 nested calls overflow the default call stack in several languages,
    so keep it iterative.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'reverseList',
    params: [{ name: 'head', type: 'ListNode' }],
    returns: 'ListNode',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((values) => ({ args: [values], expected: reference(values) })),

  /**
   * Custom input: the list as a JSON array of values, head first.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let values;
    try {
      values = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the list as a JSON array, for example [1,2,3].' };
    }
    if (!Array.isArray(values)) return { ok: false, error: 'The list must be a JSON array.' };
    if (values.length > MAX_N) return { ok: false, error: 'At most 10^5 nodes.' };
    if (!values.every((v) => Number.isInteger(v) && v >= -5000 && v <= 5000)) {
      return { ok: false, error: 'Values must be integers from -5000 to 5000.' };
    }
    return { ok: true, args: [values] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Any list works: walking
  // to the tail again for every node (to move it to the front) is n^2.
  growth: {
    target: 'n',
    n: 'number of nodes',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => [linkedList(n, mulberry32(seed), { min: -5000, max: 5000 })],
  },
};

export default problem;
