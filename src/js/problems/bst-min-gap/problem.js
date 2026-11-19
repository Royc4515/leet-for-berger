/**
 * Problem: BST Min Gap
 *
 * Equivalent to LeetCode 783 (and 530); statement and tests are written for this project. The
 * smallest difference between any two values of a binary search tree. An in-order walk lists the
 * values sorted, and in a sorted list the closest pair is always adjacent, so one walk that keeps
 * the previous value finds it in O(n).
 *
 * Classic wrong answers: comparing only a node with its children (the closest pair is often a
 * node and the largest value of its left subtree, far below it), and a "previous value" sentinel
 * of 0 that turns the first value into a fake gap.
 *
 * Height is capped at 500 so the natural recursion is safe in every language.
 */

import { mulberry32 } from '../../engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../../engine/structures.js';

const MAX_NODES = 10000;
const MAX_HEIGHT = 500;
const MAX_VAL = 100000;

/**
 * Reference: iterative in-order walk, comparing each value with the one visited just before it.
 * @param {(number|null)[]} level BST in level-order form, at least 2 nodes
 * @returns {number}
 */
export function reference(level) {
  const stack = [];
  let node = treeFromLevel(level);
  let prev = null;
  let best = Infinity;
  while (node || stack.length) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    node = stack.pop();
    if (prev !== null) best = Math.min(best, node.val - prev);
    prev = node.val;
    node = node.right;
  }
  return best;
}

/** Height of a level-order tree, iteratively. */
function heightOf(level) {
  let frontier = level.length ? [treeFromLevel(level)] : [];
  let h = 0;
  while (frontier.length) {
    h++;
    frontier = frontier.flatMap((n) => [n.left, n.right].filter(Boolean));
  }
  return h;
}

/** Is the tree a BST with distinct values (every left value smaller, every right value larger)? */
function isBst(level) {
  const root = treeFromLevel(level);
  const stack = root ? [[root, -Infinity, Infinity]] : [];
  while (stack.length) {
    const [n, lo, hi] = stack.pop();
    if (n.val <= lo || n.val >= hi) return false;
    if (n.left) stack.push([n.left, lo, n.val]);
    if (n.right) stack.push([n.right, n.val, hi]);
  }
  return true;
}

/** Fisher-Yates with the seeded generator. */
function shuffle(rnd, values) {
  const a = values.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Values inserted in the given order (sorted orders give chains). */
const insertions = (values) => levelFromTree(bstFromInsertions(values));

/** `n` distinct values from 0..maxVal inserted in random order: a BST of logarithmic height. */
function randomBst(seed, n, maxVal = MAX_VAL) {
  const rnd = mulberry32(seed);
  const pool = shuffle(rnd, Array.from({ length: maxVal + 1 }, (_, i) => i));
  return insertions(pool.slice(0, n));
}

/**
 * A large tree of multiples of 10 whose only gap below 10 is 3, between the root and its in-order
 * predecessor. The predecessor is the largest value of the left subtree, deep below the root, so
 * comparing parents with children never sees it.
 */
function hiddenPredecessor(seed, n) {
  const rnd = mulberry32(seed);
  const root = 50003;
  const rest = shuffle(rnd, Array.from({ length: MAX_VAL / 10 + 1 }, (_, i) => i * 10)).filter((v) => v !== 50000);
  // 50000 goes in late, so it lands deep in the left subtree instead of next to the root.
  return insertions([root, ...rest.slice(0, n - 2), 50000]);
}

const visible = [
  { args: [[8, 3, 12, 1, 6]], expected: 2, note: 'In order the values are 1, 3, 6, 8, 12. The closest neighbors are 1 and 3, or 6 and 8.' },
  { args: [[27, 10, 40, 5, 26]], expected: 1, note: '26 and 27 differ by 1, although 26 is a child of 10, not of 27.' },
  { args: [[5, 1]], expected: 4, note: 'With two nodes there is only one pair.' },
  { args: [[50, null, 90, 70, null, null, 72]], expected: 2, note: 'In order: 50, 70, 72, 90.' },
  { args: [[0, null, 100000]], expected: 100000, note: 'The largest possible gap.' },
];

// Hidden tests: the closest pair hidden two or more levels apart (a node and its predecessor or
// successor), a small minimum value that a 0 sentinel would compare against, chains at the height
// cap on either side, and 10^4-node trees.
const hiddenInputs = [
  [2, 1],
  [100, 2, 200],
  [10, null, 30, 11],
  [50, 20, 80, 10, 30, null, null, null, null, 25, 48],
  insertions([...Array.from({ length: MAX_HEIGHT - 1 }, (_, i) => i * 150), (MAX_HEIGHT - 2) * 150 + 7]),
  insertions(Array.from({ length: MAX_HEIGHT }, (_, i) => MAX_VAL - i * 200 - (i === MAX_HEIGHT - 1 ? -197 : 0))),
  randomBst(71, 300),
  hiddenPredecessor(73, MAX_NODES),
  randomBst(79, MAX_NODES),
  randomBst(83, MAX_NODES - 1, MAX_NODES * 2),
];

export const problem = {
  id: 'bst-min-gap',
  title: 'BST Min Gap',
  difficulty: 'Easy',
  topics: ['trees'],
  patterns: ['Binary Search Tree', 'In-order Traversal'],
  timeLimitMs: 2000,
  argNames: ['root'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>root</code> of a binary search tree with at least two nodes. Return
    the smallest difference between the values of any two different nodes.</p>
    <p>In a binary search tree every value in a node's left subtree is smaller than the node's
    value, and every value in its right subtree is larger. All values are distinct, so the answer
    is at least 1.</p>
    <p>In the examples a tree is written in level order with <code>null</code> for a missing
    child. The height is at most 500, so a recursive solution is safe in every language.</p>
  `,
  constraints: [
    '2 <= number of nodes <= 10^4',
    'The height of the tree is at most 500',
    '0 <= Node.val <= 10^5, all values distinct',
    'Target complexity: O(n) time, O(h) extra space for height h',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `root = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If the values were written out in sorted order, which pairs could possibly be the closest?',
    'Which traversal of a binary search tree hands you its values already sorted?',
    'Is the closest value to a node always one of its children? Where else could it be?',
    'While walking, what single piece of state lets you compare each value with its sorted neighbor?',
    'What should that state hold before the first value is visited, so nothing fake gets compared?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Walk the tree in order (left subtree, node, right subtree), remembering the previous value
    visited. Each time a node is visited, its value minus the previous one is a candidate; keep the
    smallest.</p>
    <h4>Why it works</h4>
    <p>An in-order walk of a binary search tree visits the values in ascending order. In a sorted
    list, the closest pair is always two neighbors: for <code>a &lt; b &lt; c</code>,
    <code>c - a</code> is larger than both <code>b - a</code> and <code>c - b</code>. So comparing
    each value only with the one visited just before it covers every pair that could win.</p>
    <h4>Complexity</h4>
    <p>O(n) time: every node is visited once. O(h) extra space for the recursion or the explicit
    stack, with h at most 500. Collecting the values and sorting them also works, in O(n log n).</p>
    <h4>Pitfall</h4>
    <p>Comparing a node only with its children. A node's sorted neighbor is the largest value of its
    left subtree or the smallest of its right subtree, which can be many levels down. Also start the
    previous value as "none", not 0: with 0, the smallest value becomes a fake gap.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'minGap',
    params: [{ name: 'root', type: 'TreeNode' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((level) => ({ args: [level], expected: reference(level) })),

  /**
   * Custom input: the tree as a JSON level-order array, null for a missing child.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let level;
    try {
      level = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the tree as a JSON array, for example [8,3,12,1,6].' };
    }
    const error = checkLevelArray(level);
    if (error) return { ok: false, error: `Tree ${error}.` };
    const nodes = level.filter((v) => v !== null).length;
    if (nodes < 2 || nodes > MAX_NODES) return { ok: false, error: 'The tree needs 2 to 10^4 nodes.' };
    if (!level.every((v) => v === null || (v >= 0 && v <= MAX_VAL))) return { ok: false, error: 'Values must be from 0 to 10^5.' };
    if (!isBst(level)) return { ok: false, error: 'The tree must be a binary search tree with distinct values.' };
    if (heightOf(level) > MAX_HEIGHT) return { ok: false, error: 'The tree height must be at most 500.' };
    return { ok: true, args: [level] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
