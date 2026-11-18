/**
 * Problem: Tree Heist
 *
 * Street Heist on a tree: take node values so that no two taken nodes are parent and child, and
 * maximize the total. Tree DP with two numbers per node, the best total of its subtree when the
 * node is taken and when it is not; a taken node forces its children to be skipped, a skipped
 * node lets each child choose freely.
 *
 * Classic wrong answers: alternate levels (fails when skipping two levels in a row pays), and the
 * "grandchildren" recursion without memoization, which recomputes subtrees exponentially often.
 *
 * Height is capped at 500 so the natural recursion is safe in every language.
 */

import { mulberry32 } from '../../engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../../engine/structures.js';

const MAX_NODES = 10000;
const MAX_HEIGHT = 500;
const MAX_VAL = 10000;

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
 * Reference: two-state tree DP, children before parents (reverse BFS order), no recursion.
 * @param {(number|null)[]} level tree in level-order form
 * @returns {number}
 */
export function reference(level) {
  const order = bfsOrder(treeFromLevel(level));
  const take = new Map();
  const skip = new Map();
  const best = (n) => (n ? Math.max(take.get(n), skip.get(n)) : 0);
  for (let i = order.length - 1; i >= 0; i--) {
    const n = order[i];
    take.set(n, n.val + (n.left ? skip.get(n.left) : 0) + (n.right ? skip.get(n.right) : 0));
    skip.set(n, best(n.left) + best(n.right));
  }
  return order.length ? best(order[0]) : 0;
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

/** Random shape with logarithmic expected height, values from valueOf(rnd). */
function randomTree(seed, n, valueOf) {
  const rnd = mulberry32(seed);
  const ids = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const level = levelFromTree(bstFromInsertions(ids));
  return level.map((v) => (v === null ? null : valueOf(rnd)));
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

const visible = [
  { args: [[3, 2, 3, null, 3, null, 1]], expected: 7, note: 'Take the root and both grandchildren: 3 + 3 + 1.' },
  { args: [[3, 4, 5, 1, 3, null, 1]], expected: 9, note: 'Skip the root and take its two children: 4 + 5.' },
  { args: [[6]], expected: 6, note: 'A single node: take it.' },
  { args: [[4, 1, null, 1, null, 4]], expected: 8, note: 'Take the top and bottom of the chain. Alternating levels only gets 5.' },
  { args: [[0, 0, 0]], expected: 0, note: 'Nothing to gain.' },
];

// Hidden tests: a skip-two pattern deeper in the tree, a root that must be skipped for a heavy
// grandchild layer, chains at the height cap whose values reward skipping two in a row, a
// complete tree where the two-level alternation is a trap, and 10^4-node trees where the
// unmemoized grandchildren recursion blows up.
const hiddenInputs = [
  [1, 2],
  [2, 1, 3, null, 4],
  [10, 1, 1, 1, null, null, 1, 10, 10, 10],
  chain(MAX_HEIGHT, (i) => (i % 2 ? 'left' : 'right'), (i) => (i % 3 === 0 ? MAX_VAL : MAX_VAL - 1)),
  chain(MAX_HEIGHT, () => 'right', (i) => (i % 4 < 2 ? 9 : 1)),
  Array.from({ length: 2 ** 12 - 1 }, (_, i) => (Math.floor(Math.log2(i + 1)) % 3 === 0 ? 100 : 60)),
  randomTree(71, 400, (rnd) => Math.floor(rnd() * 20)),
  randomTree(73, MAX_NODES, (rnd) => Math.floor(rnd() * (MAX_VAL + 1))),
  randomTree(79, MAX_NODES, (rnd) => (rnd() < 0.2 ? MAX_VAL : Math.floor(rnd() * 3))),
  randomTree(83, MAX_NODES, () => MAX_VAL),
];

export const problem = {
  id: 'tree-heist',
  title: 'Tree Heist',
  difficulty: 'Medium',
  topics: ['trees', 'dp'],
  patterns: ['Tree DP', 'Depth-First Search', 'Post-order'],
  timeLimitMs: 2000,
  argNames: ['root'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>The houses of a neighborhood form a binary tree, and each node's value is the money in that
    house. You may take the money from any set of houses, as long as you never take from two houses
    that are <strong>directly connected</strong> (a node and its parent).</p>
    <p>Given the <code>root</code>, return the largest total you can take.</p>
    <p>In the examples a tree is written in level order with <code>null</code> for a missing
    child. The height is at most 500, so a recursive solution is safe in every language.</p>
  `,
  constraints: [
    '1 <= number of nodes <= 10^4',
    'The height of the tree is at most 500',
    '0 <= Node.val <= 10^4',
    'Target complexity: O(n) time, O(h) extra space for height h',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `root = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Is it enough to take every other level? Try a chain with values 4, 1, 1, 4.',
    'For one node, what are the two situations its subtree can be in, depending on the node itself?',
    'If a node is taken, what must be true of its children? If it is skipped, what may its children do?',
    'Can each node return both answers to its parent at once, so nothing is computed twice?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'rob',
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
      return { ok: false, error: 'Enter the tree as a JSON array, for example [3,2,3,null,3,null,1].' };
    }
    const error = checkLevelArray(level);
    if (error) return { ok: false, error: `Tree ${error}.` };
    const nodes = level.filter((v) => v !== null).length;
    if (nodes < 1 || nodes > MAX_NODES) return { ok: false, error: 'The tree needs 1 to 10^4 nodes.' };
    if (!level.every((v) => v === null || (v >= 0 && v <= MAX_VAL))) return { ok: false, error: 'Values must be from 0 to 10^4.' };
    if (heightOf(level) > MAX_HEIGHT) return { ok: false, error: 'The tree height must be at most 500.' };
    return { ok: true, args: [level] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
