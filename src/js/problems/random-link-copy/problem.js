/**
 * Problem: Random Link Copy
 *
 * Deep-copy a linked list whose nodes also carry a pointer to an arbitrary node. The canonical
 * "clone a pointer graph" problem: an old-node to new-node map (or weaving the copies into the
 * original list) is the same idea that later clones general graphs.
 *
 * Lists use the RandomListNode type, written [[val, randomIndex|null], ...]. Because a correct copy
 * serializes to its input, every adapter and harness also checks node identity: a result that
 * reuses an input node, or whose random pointer leaves the returned list, is reported as a marker
 * string (COPY_MARKERS in engine/adapters.js) and judged a wrong answer.
 */

import { mulberry32 } from '../../engine/rng.js';
import { checkRandomPairs } from '../../engine/structures.js';

const MAX_N = 50000;
const MAX_V = 10000;

/**
 * Reference on the JSON form: a true copy has the same values and the same random indices.
 * @param {[number, number|null][]} pairs
 * @returns {[number, number|null][]}
 */
export function reference(pairs) {
  return pairs.map(([val, r]) => [val, r]);
}

/** Deterministic generators: hidden tests must be identical on every run, or results flake. */
function randomPairs(seed, n, { span = MAX_V, nullRate = 0.2 } = {}) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => [Math.floor(rnd() * (2 * span + 1)) - span, rnd() < nullRate ? null : Math.floor(rnd() * n)]);
}

const visible = [
  { args: [[[3, null], [8, 0], [5, 4], [2, 2], [9, 0]]], expected: [[3, null], [8, 0], [5, 4], [2, 2], [9, 0]], note: 'Random pointers go backward, forward and nowhere; the copy keeps every one.' },
  { args: [[[1, 1], [2, 1]]], expected: [[1, 1], [2, 1]], note: 'The second node points at itself.' },
  { args: [[[3, null], [3, 0], [3, null]]], expected: [[3, null], [3, 0], [3, null]], note: 'Equal values: a copy must follow nodes, not values.' },
  { args: [[]], expected: [], note: 'An empty list copies to an empty list.' },
  { args: [[[4, 0]]], expected: [[4, 0]], note: 'One node whose random pointer is itself.' },
];

// Hidden tests: duplicate values (mapping by value is wrong), self and backward pointers, all-null
// randoms, and 5 * 10^4 nodes, where finding each random target by walking from the head is O(n^2).
const hiddenInputs = [
  [[7, 1], [7, 0], [7, 1]],
  [[-10000, null], [10000, null]],
  Array.from({ length: 1000 }, (_, i) => [i % 3, 999]),
  randomPairs(5, 1000, { span: 2 }),
  randomPairs(7, 3000),
  randomPairs(11, MAX_N),
  Array.from({ length: MAX_N }, (_, i) => [i % 100, MAX_N - 1 - i]),
  Array.from({ length: 5000 }, (_, i) => [i - 2500, null]),
  Array.from({ length: 5000 }, (_, i) => [i % 2, i]),
  randomPairs(13, MAX_N - 1, { nullRate: 0 }),
];

export const problem = {
  id: 'random-link-copy',
  title: 'Random Link Copy',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Linked List', 'Hash Map', 'Deep Copy'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['head'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Every node of a linked list has a <code>val</code>, a <code>next</code> pointer and a
    <code>random</code> pointer that refers to any node of the same list, or to nothing.</p>
    <p>Build a deep copy: brand new nodes with the same values, where the copy's <code>next</code> and
    <code>random</code> pointers point between the new nodes exactly as the original's do. Return the
    head of the copy. No pointer in the copy may refer to a node of the original list.</p>
    <p>In the tests a list is written as <code>[[val, randomIndex], ...]</code> from head to tail, where
    <code>randomIndex</code> is the position of the node <code>random</code> points to, or
    <code>null</code>. Returning the original nodes, even unchanged, is judged a wrong answer.</p>
  `,
  constraints: [
    '0 <= number of nodes <= 5 * 10^4',
    '-10^4 <= Node.val <= 10^4',
    'randomIndex is null or a valid index in the list',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `head = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Copying next pointers alone is easy. Why is random harder when you create nodes front to back?',
    'When you meet an original node a second time, how could you find the copy you already made of it?',
    'Two values can be equal. What should the lookup be keyed on?',
    'Can you avoid the extra map by placing each copy right after its original for a while?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'copyRandomList',
    params: [{ name: 'head', type: 'RandomListNode' }],
    returns: 'RandomListNode',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((pairs) => ({ args: [pairs], expected: reference(pairs) })),

  /**
   * Custom input: the list as JSON, [[val, randomIndex|null], ...].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let pairs;
    try {
      pairs = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the list as JSON, for example [[3,null],[8,0]].' };
    }
    const err = checkRandomPairs(pairs);
    if (err) return { ok: false, error: `The list ${err}.` };
    if (pairs.length > MAX_N) return { ok: false, error: 'At most 5 * 10^4 nodes.' };
    if (!pairs.every(([v]) => v >= -MAX_V && v <= MAX_V)) return { ok: false, error: 'Values must be from -10^4 to 10^4.' };
    return { ok: true, args: [pairs] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
