/**
 * Problem: Tree Height
 *
 * The number of nodes on the longest root-to-leaf path. The first tree recursion most people
 * write: height = 1 + max(height(left), height(right)). Classic wrong answers: counting edges
 * instead of nodes, following only the left spine, and taking the minimum instead of the maximum.
 *
 * Height is capped at 500 so the natural recursion is safe in every language (Python's default
 * limit is 1000 frames); the trees still have up to 10^4 nodes.
 */

import { mulberry32 } from '../../engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../../engine/structures.js';

const MAX_NODES = 10000;
const MAX_HEIGHT = 500;
const MAX_ABS = 100;

/**
 * Reference: breadth-first, counting levels. Iterative, so it does not depend on the height cap.
 * @param {(number|null)[]} level tree in level-order form
 * @returns {number}
 */
export function reference(level) {
  const root = treeFromLevel(level);
  let frontier = root ? [root] : [];
  let levels = 0;
  while (frontier.length) {
    levels++;
    frontier = frontier.flatMap((n) => [n.left, n.right].filter(Boolean));
  }
  return levels;
}

/** Random shape with logarithmic expected height: a BST over shuffled ids, then random values. */
function randomTree(seed, n) {
  const rnd = mulberry32(seed);
  const ids = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const level = levelFromTree(bstFromInsertions(ids));
  return level.map((v) => (v === null ? null : Math.floor(rnd() * (2 * MAX_ABS + 1)) - MAX_ABS));
}

/** A chain of `depth` nodes; `side(i)` picks where node i hangs, `leaf(i)` adds a leaf on the other side. */
function chain(depth, side, leaf = () => false) {
  const root = { val: 0, left: null, right: null };
  let cur = root;
  for (let i = 1; i < depth; i++) {
    const s = side(i);
    const node = { val: (i % (2 * MAX_ABS + 1)) - MAX_ABS, left: null, right: null };
    cur[s] = node;
    if (leaf(i)) cur[s === 'left' ? 'right' : 'left'] = { val: i % 50, left: null, right: null };
    cur = node;
  }
  return levelFromTree(root);
}

const visible = [
  { args: [[3, 9, 20, null, null, 15, 7]], expected: 3, note: 'The longest path is 3 -> 20 -> 15 (or 7): three nodes.' },
  { args: [[1, null, 2]], expected: 2, note: 'Height counts nodes, not edges.' },
  { args: [[]], expected: 0, note: 'An empty tree has height 0.' },
  { args: [[7]], expected: 1, note: 'A single node.' },
  { args: [[1, 2, 3, 4, null, null, null, 5]], expected: 4, note: 'The deepest leaf (5) sits under the left subtree.' },
];

// Hidden tests: a deep right subtree under a shallow left one (left-spine-only fails), a short
// branch next to a long one (minimum instead of maximum fails), chains at the height cap on
// either side and zigzagging, a 500-node spine with leaves hanging off it, and 10^4-node trees.
const hiddenInputs = [
  [1, 2, 3, null, null, 4, null, 5, null, 6],
  [1, 2, 3, 4, 5, null, null, 6, null, null, null, 7],
  chain(MAX_HEIGHT, () => 'left'),
  chain(MAX_HEIGHT, () => 'right'),
  chain(MAX_HEIGHT, (i) => (i % 2 ? 'left' : 'right'), (i) => i % 3 === 0),
  chain(MAX_HEIGHT - 1, (i) => (i % 7 < 3 ? 'right' : 'left'), () => true),
  randomTree(7, 100),
  randomTree(11, MAX_NODES),
  randomTree(13, MAX_NODES),
  Array.from({ length: 2 ** 13 - 1 }, (_, i) => (i % (2 * MAX_ABS + 1)) - MAX_ABS),
];

export const problem = {
  id: 'tree-height',
  title: 'Tree Height',
  difficulty: 'Easy',
  topics: ['trees'],
  patterns: ['Depth-First Search', 'Recursion'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['root'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>root</code> of a binary tree. Return its <strong>height</strong>:
    the number of nodes on the longest path from the root down to a leaf. An empty tree has
    height 0.</p>
    <p>In the examples a tree is written in level order with <code>null</code> for a missing
    child, so <code>[3,9,20,null,null,15,7]</code> is 3 with children 9 and 20, where 20 has
    children 15 and 7.</p>
    <p>The height is at most 500, so a recursive solution is safe in every language.</p>
  `,
  constraints: [
    '0 <= number of nodes <= 10^4',
    'The height of the tree is at most 500',
    '-100 <= Node.val <= 100',
    'Target complexity: O(n) time, O(h) extra space for height h',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `root = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you already knew the heights of the left and right subtrees, how would you get the height of the whole tree?',
    'What is the height of an empty tree, and why does that make a good base case?',
    'Does a leaf come out as 1 with your formula?',
    'Without recursion: if you visit the tree one level at a time, what does the number of levels tell you?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'maxDepth',
    params: [{ name: 'root', type: 'TreeNode' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((level) => ({ args: [level], expected: reference(level) })),

  /**
   * Custom input: the tree in level order as a JSON array, null for a missing child.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let level;
    try {
      level = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the tree as a JSON array, for example [3,9,20,null,null,15,7].' };
    }
    const error = checkLevelArray(level);
    if (error) return { ok: false, error: `Tree ${error}.` };
    if (level.filter((v) => v !== null).length > MAX_NODES) return { ok: false, error: 'At most 10^4 nodes.' };
    if (!level.every((v) => v === null || (v >= -MAX_ABS && v <= MAX_ABS))) return { ok: false, error: 'Values must be from -100 to 100.' };
    if (reference(level) > MAX_HEIGHT) return { ok: false, error: 'The tree height must be at most 500.' };
    return { ok: true, args: [level] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
