/**
 * Problem: Kth In Order
 *
 * The k-th smallest value in a binary search tree. An in-order traversal of a BST visits values in
 * ascending order, so the answer is the k-th node visited, and the walk can stop there: O(h + k)
 * instead of collecting and sorting all n values.
 *
 * Classic wrong answers: 0-based k (off by one), pre-order or level order instead of in-order,
 * and a counter that is copied into each recursive call instead of shared, so it never reaches k.
 *
 * Height is capped at 500 so the natural recursion is safe in every language; sorted insertions
 * still produce 500-node chains, the worst case for a careless traversal.
 */

import { mulberry32 } from '../../engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../../engine/structures.js';

const MAX_NODES = 10000;
const MAX_HEIGHT = 500;
const MAX_VAL = 10000;

/**
 * Reference: iterative in-order walk with an explicit stack, stopping at the k-th node.
 * @param {(number|null)[]} level BST in level-order form
 * @param {number} k 1-based rank
 * @returns {number}
 */
export function reference(level, k) {
  const stack = [];
  let node = treeFromLevel(level);
  for (;;) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    node = stack.pop();
    if (--k === 0) return node.val;
    node = node.right;
  }
}

/** Height of a level-order tree, iteratively. */
function heightOf(level) {
  const root = treeFromLevel(level);
  let frontier = root ? [root] : [];
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

/** `n` distinct values from 0..MAX_VAL inserted in random order: a BST of logarithmic height. */
function randomBst(seed, n) {
  const rnd = mulberry32(seed);
  const pool = Array.from({ length: MAX_VAL + 1 }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return levelFromTree(bstFromInsertions(pool.slice(0, n)));
}

/** Values inserted in the given order (sorted orders give chains). */
const insertions = (values) => levelFromTree(bstFromInsertions(values));

const visible = [
  { args: [[3, 1, 4, null, 2], 1], expected: 1, note: 'In order the values are 1, 2, 3, 4. The 1st smallest is 1.' },
  { args: [[5, 3, 6, 2, 4, null, null, 1], 3], expected: 3, note: 'In order: 1, 2, 3, 4, 5, 6.' },
  { args: [[8], 1], expected: 8, note: 'A single node.' },
  { args: [[2, 1, 3], 3], expected: 3, note: 'k can equal the number of nodes: the largest value.' },
  { args: [[10, 5, 15, 2, 7, 12, 20], 4], expected: 10, note: 'The root is not the answer just because it is in the middle of the array.' },
];

// Hidden tests: chains at the height cap leaning either way (k at each end), a zigzag where the
// in-order position differs from every other traversal order, and 10^4-node trees with k at the
// end and in the middle, where collecting everything is wasted work.
const zigzag = insertions(Array.from({ length: 60 }, (_, i) => (i % 2 ? 1000 - i : i)));
const hiddenArgs = [
  [[1, null, 2], 2],
  [[4, 2, 6, 1, 3, 5, 7], 5],
  [insertions(Array.from({ length: MAX_HEIGHT }, (_, i) => i * 7)), MAX_HEIGHT],
  [insertions(Array.from({ length: MAX_HEIGHT }, (_, i) => MAX_VAL - i * 3)), 1],
  [insertions(Array.from({ length: MAX_HEIGHT }, (_, i) => MAX_VAL - i * 3)), 250],
  [zigzag, 31],
  [randomBst(53, 300), 150],
  [randomBst(59, MAX_NODES), MAX_NODES],
  [randomBst(61, MAX_NODES), 5000],
  [randomBst(67, MAX_NODES - 1), 1],
];

export const problem = {
  id: 'kth-in-order',
  title: 'Kth In Order',
  difficulty: 'Medium',
  topics: ['trees'],
  patterns: ['Binary Search Tree', 'In-order Traversal', 'Stack'],
  timeLimitMs: 2000,
  argNames: ['root', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>root</code> of a binary search tree and an integer <code>k</code>.
    Return the <code>k</code>-th smallest value in the tree, counting from 1.</p>
    <p>In a binary search tree every value in a node's left subtree is smaller than the node's
    value, and every value in its right subtree is larger. All values are distinct.</p>
    <p>In the examples a tree is written in level order with <code>null</code> for a missing
    child. The height is at most 500, so a recursive solution is safe in every language.</p>
  `,
  constraints: [
    '1 <= k <= number of nodes <= 10^4',
    'The height of the tree is at most 500',
    '0 <= Node.val <= 10^4, all values distinct',
    'Target complexity: O(h + k) time, O(h) extra space for height h',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `root = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'In which traversal order does a binary search tree hand you its values sorted?',
    'Once you have seen k values in that order, do you need to look at the rest?',
    'If you count with recursion, where does the counter live so every call sees the same one?',
    'How would you do the same walk with your own stack instead of the call stack?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'kthSmallest',
    params: [
      { name: 'root', type: 'TreeNode' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, the tree as a JSON level-order array, then k.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the tree as a JSON array, then k.' };
    let level;
    let k;
    try {
      level = JSON.parse(lines[0]);
      k = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON, for example [3,1,4,null,2] and 1.' };
    }
    const error = checkLevelArray(level);
    if (error) return { ok: false, error: `Tree ${error}.` };
    const nodes = level.filter((v) => v !== null).length;
    if (nodes < 1 || nodes > MAX_NODES) return { ok: false, error: 'The tree needs 1 to 10^4 nodes.' };
    if (!level.every((v) => v === null || (v >= 0 && v <= MAX_VAL))) return { ok: false, error: 'Values must be from 0 to 10^4.' };
    if (!isBst(level)) return { ok: false, error: 'The tree must be a binary search tree with distinct values.' };
    if (heightOf(level) > MAX_HEIGHT) return { ok: false, error: 'The tree height must be at most 500.' };
    if (!Number.isInteger(k) || k < 1 || k > nodes) return { ok: false, error: 'k must be an integer from 1 to the number of nodes.' };
    return { ok: true, args: [level, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
