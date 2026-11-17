/**
 * Problem: Best Tree Path
 *
 * The largest sum of a path in a binary tree, where a path may start and end anywhere and bend
 * once at its highest node. The post-order trick: each node reports to its parent the best
 * downward chain it can offer (never negative, a parent can always drop it), while the answer
 * also considers the path that bends at this node and uses both children.
 *
 * Classic wrong answers: starting the answer at 0 (all-negative trees), returning the bent path to
 * the parent (a parent cannot use both of a child's branches), only considering paths through the
 * root, and adding negative chains instead of dropping them.
 *
 * Height is capped at 500 so the natural recursion is safe in every language.
 */

import { mulberry32 } from '../../engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../../engine/structures.js';

const MAX_NODES = 30000;
const MAX_HEIGHT = 500;
const MAX_ABS = 1000;

/** Nodes in breadth-first order; children always come after their parent. */
function bfsOrder(root) {
  const order = root ? [root] : [];
  for (let h = 0; h < order.length; h++) {
    const n = order[h];
    if (n.left) order.push(n.left);
    if (n.right) order.push(n.right);
  }
  return order;
}

/**
 * Reference: post-order DP done iteratively (reverse BFS order visits children before parents).
 * @param {(number|null)[]} level tree in level-order form, at least one node
 * @returns {number}
 */
export function reference(level) {
  const order = bfsOrder(treeFromLevel(level));
  const down = new Map(); // best downward chain starting at a node, possibly just the node
  let best = -Infinity;
  for (let i = order.length - 1; i >= 0; i--) {
    const n = order[i];
    const l = Math.max(0, n.left ? down.get(n.left) : 0);
    const r = Math.max(0, n.right ? down.get(n.right) : 0);
    best = Math.max(best, n.val + l + r);
    down.set(n, n.val + Math.max(l, r));
  }
  return best;
}

/** Height of a level-order tree, iteratively. */
function heightOf(level) {
  let frontier = bfsOrder(treeFromLevel(level)).slice(0, 1);
  let h = 0;
  while (frontier.length) {
    h++;
    frontier = frontier.flatMap((n) => [n.left, n.right].filter(Boolean));
  }
  return h;
}

/** Random shape with logarithmic expected height, values drawn from [lo, hi]. */
function randomTree(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  const ids = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const level = levelFromTree(bstFromInsertions(ids));
  return level.map((v) => (v === null ? null : lo + Math.floor(rnd() * (hi - lo + 1))));
}

/** A chain of `depth` nodes with values valueOf(i); `side(i)` picks where node i hangs. */
function chain(depth, side, valueOf) {
  const root = { val: valueOf(0), left: null, right: null };
  let cur = root;
  for (let i = 1; i < depth; i++) {
    const node = { val: valueOf(i), left: null, right: null };
    cur[side(i)] = node;
    cur = node;
  }
  return levelFromTree(root);
}

/** Two chains of `depth` nodes hanging off a root, a "V" whose best path bends at the root. */
function vee(depth, rootVal, valueOf) {
  const root = { val: rootVal, left: null, right: null };
  for (const side of ['left', 'right']) {
    let cur = root;
    for (let i = 1; i < depth; i++) {
      cur[side] = { val: valueOf(i), left: null, right: null };
      cur = cur[side];
    }
  }
  return levelFromTree(root);
}

const visible = [
  { args: [[1, 2, 3]], expected: 6, note: 'The path 2 -> 1 -> 3 bends at the root.' },
  { args: [[-10, 9, 20, null, null, 15, 7]], expected: 42, note: 'The best path 15 -> 20 -> 7 does not touch the root.' },
  { args: [[-3]], expected: -3, note: 'A path has at least one node, so an all-negative tree still has an answer.' },
  { args: [[2, -1]], expected: 2, note: 'Dropping the negative child is better than extending into it.' },
  { args: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]], expected: 48, note: '7 -> 11 -> 4 -> 5 -> 8 -> 13.' },
];

// Hidden tests: all negative values (an answer that starts at 0 is wrong), a bend below a very
// negative root, a child whose own bent path must not be passed up, chains at the height cap, a
// deep "V" bending at the root, and 3 * 10^4-node trees.
const hiddenInputs = [
  [-2, -1, -3],
  [-1000, 1, 2, 3, 4, 5, 6],
  [1, -2, 3, 4, 5, null, null, 6, null, null, 7],
  [10, 9, -100, 8, 8, null, null, 1],
  chain(MAX_HEIGHT, (i) => (i % 2 ? 'left' : 'right'), (i) => (i % 5 === 0 ? -7 : 3)),
  vee(MAX_HEIGHT / 2, -MAX_ABS, () => MAX_ABS),
  randomTree(31, 2000, -MAX_ABS, -1),
  randomTree(37, MAX_NODES, -MAX_ABS, MAX_ABS),
  randomTree(41, MAX_NODES, -60, 50),
  randomTree(43, MAX_NODES, -MAX_ABS, MAX_ABS).map((v, i) => (v === null ? null : i % 3 ? -Math.abs(v) : v)),
];

export const problem = {
  id: 'best-tree-path',
  title: 'Best Tree Path',
  difficulty: 'Hard',
  topics: ['trees'],
  patterns: ['Depth-First Search', 'Tree DP', 'Post-order'],
  milestone: 2,
  timeLimitMs: 2000,
  argNames: ['root'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A <strong>path</strong> in a binary tree is a sequence of nodes where each consecutive pair
    is joined by an edge, and no node appears twice. A path has at least one node and does not
    have to pass through the root. Its <strong>sum</strong> is the total of its node values.</p>
    <p>Given the <code>root</code> of a non-empty binary tree, return the largest sum of any
    path.</p>
    <p>In the examples a tree is written in level order with <code>null</code> for a missing
    child. The height is at most 500, so a recursive solution is safe in every language.</p>
  `,
  constraints: [
    '1 <= number of nodes <= 3 * 10^4',
    'The height of the tree is at most 500',
    '-1000 <= Node.val <= 1000',
    'Target complexity: O(n) time, O(h) extra space for height h',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `root = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Every path has one highest node, where it may bend. What does the best path that bends at a given node look like?',
    'For that you need, from each child, the best path that starts at the child and only goes down. How does a node compute that from its own children?',
    'What should a node hand to its parent: the path bending at itself, or a path going down one side only? Why?',
    'When should a node ignore a child completely?',
    'If every value is negative, what is the answer, and does your starting value for the maximum allow it?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'maxPathSum',
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
      return { ok: false, error: 'Enter the tree as a JSON array, for example [-10,9,20,null,null,15,7].' };
    }
    const error = checkLevelArray(level);
    if (error) return { ok: false, error: `Tree ${error}.` };
    const nodes = level.filter((v) => v !== null).length;
    if (nodes < 1 || nodes > MAX_NODES) return { ok: false, error: 'The tree needs 1 to 3 * 10^4 nodes.' };
    if (!level.every((v) => v === null || (v >= -MAX_ABS && v <= MAX_ABS))) return { ok: false, error: 'Values must be from -1000 to 1000.' };
    if (heightOf(level) > MAX_HEIGHT) return { ok: false, error: 'The tree height must be at most 500.' };
    return { ok: true, args: [level] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
