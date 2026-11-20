/**
 * Problem: Digit Path Total
 *
 * Equivalent to LeetCode 129; statement and tests are written for this project. Every node of a
 * binary tree holds one digit, so each root-to-leaf path reads as a number (digits in order from
 * the root). Return the sum of those numbers. A walk that carries the number built so far
 * (value * 10 + digit) down to the leaves does it in one pass.
 *
 * Classic wrong answers: adding the number at every node instead of only at the leaves, treating a
 * node with one missing child as a leaf, adding up digits instead of reading numbers, and leaving
 * the root's digit out.
 *
 * The height is at most 10 and the total is guaranteed to fit in a signed 32-bit integer (the
 * longest possible number, ten digits, only fits when it is at most 2147483647). The tests are
 * built so the guarantee holds: when a random tree would overflow, its top levels are zeroed, which
 * keeps its shape and leaves the deepest digits random.
 */

import { treeFromLevel, levelFromTree, checkLevelArray } from '../../engine/structures.js';
import { mulberry32 } from '../../engine/rng.js';

const MAX_NODES = 1000;
const MAX_HEIGHT = 10;
const INT_MAX = 2147483647;

/**
 * Reference: iterative walk that carries the number read so far.
 * @param {(number|null)[]} level tree in level-order form
 * @returns {number} sum of all root-to-leaf numbers
 */
export function reference(level) {
  const root = treeFromLevel(level);
  let total = 0;
  const stack = root ? [[root, 0]] : [];
  while (stack.length) {
    const [node, above] = stack.pop();
    const here = above * 10 + node.val;
    if (!node.left && !node.right) total += here;
    if (node.left) stack.push([node.left, here]);
    if (node.right) stack.push([node.right, here]);
  }
  return total;
}

/** Height of a level-order tree (number of nodes on the longest root-to-leaf path), iteratively. */
function heightOf(level) {
  let frontier = level.length ? [treeFromLevel(level)] : [];
  let h = 0;
  while (frontier.length) {
    h++;
    frontier = frontier.flatMap((n) => [n.left, n.right].filter(Boolean));
  }
  return h;
}

const leaf = (val) => ({ val, left: null, right: null });

/** Nodes of each depth, root first. */
function byDepth(root) {
  const levels = [];
  let frontier = [root];
  while (frontier.length) {
    levels.push(frontier);
    frontier = frontier.flatMap((n) => [n.left, n.right].filter(Boolean));
  }
  return levels;
}

/**
 * Zeroes whole levels from the top until the total fits the 32-bit guarantee. The shape and the
 * deepest digits are kept, so the tree stays a realistic test.
 */
function fitToInt32(root) {
  const levels = byDepth(root);
  for (let d = 0; d < levels.length && reference(levelFromTree(root)) > INT_MAX; d++) {
    for (const n of levels[d]) n.val = 0;
  }
  return levelFromTree(root);
}

/** A chain of nodes with the given digits, each the `side` child of the previous one. */
function chain(digits, side) {
  const nodes = digits.map(leaf);
  for (let i = 0; i + 1 < nodes.length; i++) nodes[i][side] = nodes[i + 1];
  return levelFromTree(nodes[0]);
}

/** Random digits, seeded. */
function randomDigits(rnd, n) {
  return Array.from({ length: n }, () => Math.floor(rnd() * 10));
}

/** A caterpillar: a spine of `spine` nodes, each with one extra leaf child hanging off it. */
function caterpillar(seed, spine) {
  const rnd = mulberry32(seed);
  const nodes = randomDigits(rnd, spine).map(leaf);
  for (let i = 0; i < spine; i++) {
    const hang = leaf(Math.floor(rnd() * 10));
    if (i + 1 < spine) {
      // Alternate which side carries the spine so a one-sided walk cannot get lucky.
      if (i % 2 === 0) {
        nodes[i].left = nodes[i + 1];
        nodes[i].right = hang;
      } else {
        nodes[i].left = hang;
        nodes[i].right = nodes[i + 1];
      }
    } else {
      nodes[i].left = hang;
    }
  }
  return fitToInt32(nodes[0]);
}

/**
 * A random tree of `count` nodes and height at most MAX_HEIGHT: each new node takes a random free
 * child slot of an existing node, so one-child nodes and uneven depths are common.
 */
function randomTree(seed, count) {
  const rnd = mulberry32(seed);
  const root = leaf(Math.floor(rnd() * 10));
  const slots = [[root, 'left', 2], [root, 'right', 2]];
  for (let made = 1; made < count; made++) {
    const pick = Math.floor(rnd() * slots.length);
    const [parent, side, depth] = slots[pick];
    slots[pick] = slots[slots.length - 1];
    slots.pop();
    const child = leaf(Math.floor(rnd() * 10));
    parent[side] = child;
    if (depth < MAX_HEIGHT) slots.push([child, 'left', depth + 1], [child, 'right', depth + 1]);
  }
  return fitToInt32(root);
}

/** A complete tree filled in level order: `count` random digits, no nulls. */
function heapTree(seed, count) {
  const rnd = mulberry32(seed);
  return fitToInt32(treeFromLevel(randomDigits(rnd, count)));
}

const visible = [
  { args: [[1, 2, 3]], expected: 25, note: 'The paths read 12 and 13.' },
  { args: [[4, 9, 0, 5, 1]], expected: 1026, note: 'The paths read 495, 491 and 40.' },
  { args: [[5]], expected: 5, note: 'A single node is a leaf: the number is its digit.' },
  { args: [[1, 0]], expected: 10, note: 'The root has one child, so it is not a leaf: the only path reads 10.' },
  { args: [[0, 1, 2]], expected: 3, note: 'A leading zero changes nothing: the paths read 01 and 02.' },
];

// Hidden tests: one zero node, a right child only, the longest path with the largest 32-bit value,
// a run of nines, nodes with one child inside the tree, a full tree of 7, a full tree of 15 with
// random digits, a 10-level caterpillar, a random 1000-node tree and a 1000-node complete tree.
const hiddenInputs = [
  [0],
  [7, null, 3],
  chain([2, 1, 4, 7, 4, 8, 3, 6, 4, 7], 'left'),
  chain([9, 9, 9, 9, 9, 9, 9, 9, 9], 'right'),
  [1, 2, null, 3, 4],
  [1, 2, 3, 4, 5, 6, 7],
  heapTree(31, 15),
  caterpillar(37, MAX_HEIGHT - 1),
  randomTree(41, MAX_NODES),
  heapTree(43, MAX_NODES),
];

export const problem = {
  id: 'digit-path-total',
  title: 'Digit Path Total',
  difficulty: 'Medium',
  topics: ['trees'],
  patterns: ['Binary Tree', 'Depth-First Search', 'Path Sum'],
  timeLimitMs: 2000,
  argNames: ['root'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>root</code> of a binary tree in which every node holds a single digit
    from <code>0</code> to <code>9</code>.</p>
    <p>Each path from the root down to a leaf reads as a number: write the digits along the path in
    order, starting with the root. For example, the path <code>1 -> 2 -> 3</code> reads
    <code>123</code>. Return the sum of the numbers of all root-to-leaf paths.</p>
    <p>A leaf is a node with no children. The total always fits in a signed 32-bit integer. In the
    examples a tree is written in level order with <code>null</code> for a missing child.</p>
  `,
  constraints: [
    '1 <= number of nodes <= 1000',
    '0 <= Node.val <= 9',
    'The height of the tree is at most 10',
    'The total fits in a signed 32-bit integer',
    'Target complexity: O(n) time, O(h) extra space for height h',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `root = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you stand on a node, what do you need to know about the path above it to finish the number below it?',
    'When you step from a node to its child, how does the number read so far change?',
    'At which nodes do you add something to the total: every node, or only some?',
    'A node with one child and one missing child: is it a leaf? What does the walk do on the missing side?',
    'Could you do it without turning the path into a string first?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Walk down from the root and carry the number the path reads so far. Moving to a child turns
    the carried number <code>v</code> into <code>v * 10 + digit</code>. At a leaf, add that number to
    the total; everywhere else, pass it on to the children.</p>
    <h4>Why it works</h4>
    <p>Appending a digit to a decimal number is the same as multiplying it by ten and adding the
    digit, so the carried value is always exactly the number the path from the root to the current
    node reads. Every root-to-leaf path ends at exactly one leaf, so each number is counted once.</p>
    <h4>Complexity</h4>
    <p>O(n) time, each node is visited once. O(h) extra space for the recursion (at most 10 deep
    here). Building each path as a string and parsing it at the leaf does the same visits but copies
    up to h digits per leaf.</p>
    <h4>Pitfall</h4>
    <p>Only leaves add to the total: adding at every node counts the prefixes too. A node with just
    one child is not a leaf, so do not stop on the missing side. The root's digit comes first, and a
    leading zero is fine.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'digitPathTotal',
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
      return { ok: false, error: 'Enter the tree as a JSON array, for example [4,9,0,5,1].' };
    }
    const error = checkLevelArray(level);
    if (error) return { ok: false, error: `Tree ${error}.` };
    const nodes = level.filter((v) => v !== null).length;
    if (nodes < 1 || nodes > MAX_NODES) return { ok: false, error: 'The tree needs 1 to 1000 nodes.' };
    if (!level.every((v) => v === null || (v >= 0 && v <= 9))) return { ok: false, error: 'Every node holds a digit from 0 to 9.' };
    if (heightOf(level) > MAX_HEIGHT) return { ok: false, error: 'The tree height must be at most 10.' };
    if (reference(level) > INT_MAX) return { ok: false, error: 'The total must fit in a signed 32-bit integer.' };
    return { ok: true, args: [level] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). A complete tree whose
  // inner nodes are 0 and whose leaves are random digits: every node must be visited, and the
  // numbers stay small, so the total is exact in a JavaScript number at any size. Building the
  // path string at every leaf adds a factor of the height.
  growth: {
    target: 'n',
    n: 'number of nodes',
    sizes: [16383, 32767, 65535, 131071, 262143, 524287, 1048575],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const inner = (n - 1) / 2;
      return [Array.from({ length: n }, (_, i) => (i < inner ? 0 : 1 + Math.floor(rnd() * 9)))];
    },
  },
};

export default problem;
