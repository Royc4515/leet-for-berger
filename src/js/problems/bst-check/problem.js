/**
 * Problem: BST Check
 *
 * Equivalent to LeetCode 98; statement and tests are written for this project. Decide whether a
 * binary tree is a binary search tree: every value in a node's left subtree strictly smaller,
 * every value in its right subtree strictly larger. Each node must be checked against the whole
 * range its ancestors allow, not just against its parent, and an in-order walk must be strictly
 * increasing.
 *
 * Classic wrong answers: comparing a node only with its children (a deep node can break a far
 * ancestor's rule), seeding the allowed range with INT_MIN and INT_MAX as fixed ints (a node whose
 * value is exactly INT_MIN or INT_MAX is rejected wrongly), and allowing equal values.
 *
 * Height is capped at 500 so the natural recursion is safe in every language.
 */

import { mulberry32 } from '../../engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../../engine/structures.js';

const MAX_NODES = 10000;
const MAX_HEIGHT = 500;
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

/**
 * Reference: iterative walk carrying the open interval (lo, hi) each node must fall inside.
 * @param {(number|null)[]} level tree in level-order form
 * @returns {boolean}
 */
export function reference(level) {
  const root = treeFromLevel(level);
  const stack = root ? [[root, -Infinity, Infinity]] : [];
  while (stack.length) {
    const [node, lo, hi] = stack.pop();
    if (node.val <= lo || node.val >= hi) return false;
    if (node.left) stack.push([node.left, lo, node.val]);
    if (node.right) stack.push([node.right, node.val, hi]);
  }
  return true;
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

/** `n` distinct values spread over the whole 32-bit range. */
function distinctInts(rnd, n) {
  const seen = new Set();
  while (seen.size < n) seen.add(Math.floor(rnd() * 2 ** 32) + INT_MIN);
  return [...seen];
}

/** A binary search tree of `n` random distinct 32-bit values, inserted in random order. */
function randomBstNodes(seed, n) {
  return bstFromInsertions(distinctInts(mulberry32(seed), n));
}

/**
 * Finds the deepest leaf (last in depth-first order) that sits in the left or right subtree of an
 * ancestor higher than its parent, and returns it with that ancestor.
 * @param {*} root
 * @param {'left'|'right'} side which subtree of the far ancestor the leaf must sit in
 */
function farLeaf(root, side) {
  let found = null;
  const stack = [[root, []]];
  while (stack.length) {
    const [node, path] = stack.pop();
    if (!node.left && !node.right) {
      // path holds [ancestor, side taken] pairs from the root down to the parent.
      for (let i = 0; i < path.length - 1; i++) {
        if (path[i][1] === side && path[path.length - 1][1] === (side === 'left' ? 'right' : 'left')) found = { leaf: node, ancestor: path[i][0] };
      }
    }
    for (const s of ['right', 'left']) if (node[s]) stack.push([node[s], [...path, [node, s]]]);
  }
  return found;
}

/**
 * A valid random BST with one leaf changed so only a far ancestor objects: the leaf still fits
 * its parent, so a check against parent and children alone accepts the tree.
 */
function corruptedBst(seed, n) {
  const root = randomBstNodes(seed, n);
  const { leaf, ancestor } = farLeaf(root, 'left');
  // Just above the ancestor, inside the ancestor's left subtree, and still above the leaf's parent.
  leaf.val = ancestor.val + 1;
  return levelFromTree(root);
}

/** Same idea with an equal value: a leaf in an ancestor's right subtree copies that ancestor. */
function duplicatedBst(seed, n) {
  const root = randomBstNodes(seed, n);
  const { leaf, ancestor } = farLeaf(root, 'right');
  leaf.val = ancestor.val;
  return levelFromTree(root);
}

/** A chain of `values.length` nodes, each the `side` child of the previous one. */
function chain(values, side) {
  const nodes = values.map((val) => ({ val, left: null, right: null }));
  for (let i = 0; i + 1 < nodes.length; i++) nodes[i][side] = nodes[i + 1];
  return levelFromTree(nodes[0]);
}

const descending = (n, top) => Array.from({ length: n }, (_, i) => top - i * 1000);
const ascending = (n, bottom) => Array.from({ length: n }, (_, i) => bottom + i * 1000);

/**
 * A left chain of n - 1 nodes whose deepest node has one right child, a leaf larger than the top
 * of the chain: it fits its parent, and only the root objects.
 */
function chainWithBadTail(n, top) {
  const nodes = descending(n - 1, top).map((val) => ({ val, left: null, right: null }));
  for (let i = 0; i + 1 < nodes.length; i++) nodes[i].left = nodes[i + 1];
  nodes[nodes.length - 1].right = { val: top + 1, left: null, right: null };
  return levelFromTree(nodes[0]);
}

const visible = [
  { args: [[2, 1, 3]], expected: true, note: 'Left 1 is below 2 and right 3 is above it.' },
  { args: [[5, 1, 4, null, null, 3, 6]], expected: false, note: 'The right child 4 is smaller than the root 5.' },
  { args: [[5, 4, 6, null, null, 3, 7]], expected: false, note: '3 is a fine left child of 6, but it sits in the right subtree of 5 and is smaller than 5.' },
  { args: [[2, 2, 2]], expected: false, note: 'Equal values are not allowed on either side.' },
  { args: [[INT_MIN, null, INT_MAX]], expected: true, note: 'Values may use the full 32-bit range.' },
];

// Hidden tests: one node, both 32-bit extremes (a fixed-int range check rejects them), an equal
// pair at INT_MIN, the "fits its parent, breaks a grandparent" shape, a full valid tree, chains at
// the height cap (valid on one side, broken only by the root on the other), a duplicate hidden in
// a large tree, and two 10^4-node trees, one valid and one broken by a single deep leaf.
const hiddenInputs = [
  [1],
  [INT_MAX, INT_MIN],
  [INT_MIN, null, INT_MIN],
  [10, 5, 15, null, null, 6, 20],
  [8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15],
  chainWithBadTail(MAX_HEIGHT, 400000),
  chain(ascending(MAX_HEIGHT, -200000), 'right'),
  duplicatedBst(41, 2000),
  levelFromTree(randomBstNodes(43, MAX_NODES)),
  corruptedBst(47, MAX_NODES),
];

export const problem = {
  id: 'bst-check',
  title: 'BST Check',
  difficulty: 'Medium',
  topics: ['trees'],
  patterns: ['Binary Search Tree', 'Depth-First Search', 'Bounds'],
  timeLimitMs: 2000,
  argNames: ['root'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given the <code>root</code> of a binary tree, return <code>true</code> if it is a valid
    binary search tree and <code>false</code> otherwise.</p>
    <p>A tree is a binary search tree when, for every node, all values in its left subtree are
    strictly smaller than the node's value, and all values in its right subtree are strictly
    larger. That applies to the whole subtree, not only to the node's children, and equal values
    are not allowed.</p>
    <p>In the examples a tree is written in level order with <code>null</code> for a missing
    child. The height is at most 500, so a recursive solution is safe in every language.</p>
  `,
  constraints: [
    '1 <= number of nodes <= 10^4',
    'The height of the tree is at most 500',
    '-2^31 <= Node.val <= 2^31 - 1',
    'Target complexity: O(n) time, O(h) extra space for height h',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `root = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you only compare each node with its two children, what kind of invalid tree slips through?',
    'A node deep in the right subtree of the root must be larger than the root. How can that fact travel down to it?',
    'What range of values is a node allowed to have, and how does it shrink as you go left or right?',
    'Which traversal of a valid binary search tree produces its values in increasing order, and what must hold between neighbors?',
    'Your range starts out unbounded. Can a value like -2^31 or 2^31 - 1 still fit inside a range you start with, and how do equal values fit?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Carry an open interval down the tree. The root may take any value. Going left, the node's
    value becomes the new upper bound; going right, it becomes the new lower bound. A node whose
    value is not strictly inside its interval makes the tree invalid.</p>
    <h4>Why it works</h4>
    <p>The interval is the intersection of every rule from every ancestor: each time the walk turns
    left or right at an ancestor, it adds exactly the "smaller than" or "larger than" condition that
    ancestor imposes. So checking one node against its interval checks it against all of its
    ancestors at once. An in-order walk that requires each value to exceed the previous one is the
    same test seen from the other side.</p>
    <h4>Complexity</h4>
    <p>O(n) time, every node is checked once. O(h) extra space for the recursion or the explicit
    stack, with h at most 500.</p>
    <h4>Pitfall</h4>
    <p>Comparing a node only with its children accepts trees where a deep node breaks a far
    ancestor's rule. Starting the bounds as the 32-bit minimum and maximum rejects a tree whose root
    is exactly that value; use "no bound", a wider integer type, or the in-order approach with an
    explicit "nothing visited yet" flag. And the comparisons are strict, so equal values fail.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'isValidBst',
    params: [{ name: 'root', type: 'TreeNode' }],
    returns: 'bool',
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
      return { ok: false, error: 'Enter the tree as a JSON array, for example [2,1,3].' };
    }
    const error = checkLevelArray(level);
    if (error) return { ok: false, error: `Tree ${error}.` };
    const nodes = level.filter((v) => v !== null).length;
    if (nodes < 1 || nodes > MAX_NODES) return { ok: false, error: 'The tree needs 1 to 10^4 nodes.' };
    if (!level.every((v) => v === null || (v >= INT_MIN && v <= INT_MAX))) return { ok: false, error: 'Values must fit in a 32-bit integer.' };
    if (heightOf(level) > MAX_HEIGHT) return { ok: false, error: 'The tree height must be at most 500.' };
    return { ok: true, args: [level] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
