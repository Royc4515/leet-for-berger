/**
 * Problem: K Steps Away
 *
 * Every node exactly k edges from a target node in a binary tree, where a step may go down to a
 * child or up to the parent. Nodes only point down, so the trick is to give every node a way back
 * up (a parent map), after which the tree is just an undirected graph and a breadth-first search
 * from the target, k rounds deep, finds the answer.
 *
 * Changes from the usual statement: the target is given by its value (values are distinct), and
 * the answer is sorted ascending so it can be judged exactly. Height is capped at 300 nodes, so
 * the longest path between two nodes is under 600 edges and a recursive walk stays far below
 * Python's default recursion limit; trees still have up to 10^4 nodes.
 */

import { mulberry32 } from '../../engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../../engine/structures.js';

const MAX_NODES = 10000;
const MAX_HEIGHT = 300;
const MAX_VAL = 100000;
const MAX_K = 1000;

/**
 * Reference: parent map by BFS, then BFS from the target for k rounds.
 * @param {(number|null)[]} level tree in level-order form
 * @param {number} target value of a node in the tree
 * @param {number} k
 * @returns {number[]} values at distance exactly k, ascending
 */
export function reference(level, target, k) {
  const root = treeFromLevel(level);
  const parent = new Map([[root, null]]);
  let start = null;
  const queue = [root];
  for (let h = 0; h < queue.length; h++) {
    const node = queue[h];
    if (node.val === target) start = node;
    for (const child of [node.left, node.right]) {
      if (child) {
        parent.set(child, node);
        queue.push(child);
      }
    }
  }
  const seen = new Set([start]);
  let frontier = [start];
  for (let step = 0; step < k && frontier.length; step++) {
    const next = [];
    for (const node of frontier) {
      for (const nb of [node.left, node.right, parent.get(node)]) {
        if (nb && !seen.has(nb)) {
          seen.add(nb);
          next.push(nb);
        }
      }
    }
    frontier = next;
  }
  return frontier.map((n) => n.val).sort((a, b) => a - b);
}

/** Distinct values for `n` nodes, drawn from 0..MAX_VAL by a seeded partial shuffle. */
function distinctValues(rnd, n) {
  const pool = Array.from({ length: MAX_VAL + 1 }, (_, i) => i);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rnd() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** Relabels a level array's nodes with distinct random values. */
function relabel(rnd, level) {
  const vals = distinctValues(rnd, level.filter((v) => v !== null).length);
  let i = 0;
  return level.map((v) => (v === null ? null : vals[i++]));
}

/** Random shape with logarithmic expected height (a BST over shuffled ids), distinct values. */
function randomTree(rnd, n) {
  const ids = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return relabel(rnd, levelFromTree(bstFromInsertions(ids)));
}

/** The value of the i-th node in level order (nulls skipped), wrapped around. */
const nodeAt = (level, i) => {
  const vals = level.filter((v) => v !== null);
  return vals[((i % vals.length) + vals.length) % vals.length];
};

/** A random tree case: target picked by the same seed, k as given. */
function randomCase(seed, n, k) {
  const rnd = mulberry32(seed);
  const level = randomTree(rnd, n);
  return [level, nodeAt(level, Math.floor(rnd() * n)), k];
}

/**
 * A chain of `depth` nodes; `side(i)` picks where node i hangs, `leaf(i)` adds a leaf on the other
 * side. Values are distinct: chain nodes 0..depth-1, leaves from 5000 up.
 */
function chain(depth, side, leaf = () => false) {
  const root = { val: 0, left: null, right: null };
  let cur = root;
  for (let i = 1; i < depth; i++) {
    const s = side(i);
    const node = { val: i, left: null, right: null };
    cur[s] = node;
    if (leaf(i)) cur[s === 'left' ? 'right' : 'left'] = { val: 5000 + i, left: null, right: null };
    cur = node;
  }
  return levelFromTree(root);
}

/** A perfect tree of the given depth, values 0..2^depth - 2 in level order. */
const perfectTree = (depth) => Array.from({ length: 2 ** depth - 1 }, (_, i) => i);

const visible = [
  {
    args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], 3, 2],
    expected: [4, 7, 10],
    note: '4 and 7 are two steps down through 6; 10 is up to 8 and down again.',
  },
  { args: [[5, 1, 9, 0, 2, 7, 11], 1, 1], expected: [0, 2, 5], note: 'One step reaches both children and the parent.' },
  { args: [[1, 2, null, 3, null, 4], 4, 2], expected: [2], note: 'From the bottom of a chain, two steps lead up to 2.' },
  { args: [[1], 1, 0], expected: [1], note: 'Zero steps: only the target itself.' },
  { args: [[1, 2, 3], 2, 5], expected: [], note: 'No node is 5 steps away in a three-node tree.' },
];

// Hidden tests: k reaching across the root into the other subtree, k beyond every node, k = 0 in a
// big tree, a target at the root (k = one level), chains at the height cap with the target at the
// bottom or the middle (the walk must go up, then down the far side), a perfect tree from a leaf,
// and 10^4-node random trees.
const hiddenInputs = [
  [[2, 1, 3, 0, null, null, 4], 0, 3],
  [[2, 1, 3, 0, null, null, 4], 4, 9],
  [perfectTree(10), 0, 9],
  // From the bottom of a left chain: chain node 98 and the leaf hanging beside node 100.
  [chain(MAX_HEIGHT, () => 'left', (i) => i % 2 === 0), MAX_HEIGHT - 1, 201],
  // From the middle of a zigzag: chain nodes 30 and 270, and the leaf beside node 270.
  [chain(MAX_HEIGHT, (i) => (i % 2 ? 'left' : 'right'), (i) => i % 3 === 0), MAX_HEIGHT >> 1, 120],
  // From the leftmost leaf of a perfect tree: the root and nodes across every level above.
  [perfectTree(13), 4095, 12],
  randomCase(23, 100, 3),
  randomCase(29, MAX_NODES, 0),
  randomCase(31, MAX_NODES, 6),
  randomCase(37, MAX_NODES, 15),
];

export const problem = {
  id: 'k-steps-away',
  title: 'K Steps Away',
  difficulty: 'Medium',
  topics: ['trees'],
  patterns: ['Breadth-First Search', 'Parent Map'],
  timeLimitMs: 2000,
  argNames: ['root', 'target', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>root</code> of a binary tree whose node values are all different, the
    value <code>target</code> of one of its nodes, and an integer <code>k</code>.</p>
    <p>A step moves from a node to one of its children or to its parent. Return the values of all
    nodes that are exactly <code>k</code> steps from the target node along the tree (counting the
    shortest way), in ascending order. With <code>k = 0</code> the answer is the target alone.</p>
    <p>In the examples a tree is written in level order with <code>null</code> for a missing
    child.</p>
  `,
  constraints: [
    '1 <= number of nodes <= 10^4',
    '0 <= Node.val <= 10^5, all values distinct',
    'The tree height is at most 300 nodes',
    'target is the value of a node in the tree',
    '0 <= k <= 1000',
    'Target complexity: O(n + m log m) time for n nodes and m answers, O(n) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `root = ${JSON.stringify(t.args[0])}, target = ${t.args[1]}, k = ${t.args[2]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Nodes below the target are easy to reach. Which nodes at distance k are not below it?',
    'A node only knows its children. What would you need to record so you could also step up?',
    'Once every node can reach its parent too, what kind of structure is the tree, and which search counts steps?',
    'Walking outward from the target, what stops you from stepping back to the node you just came from?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Treat the tree as an undirected graph. First walk it once and record each node's parent. Then
    run a breadth-first search from the target node, where the neighbors of a node are its left
    child, right child and parent. After k rounds, the current frontier is the answer; sort its
    values.</p>
    <h4>Why it works</h4>
    <p>A tree has exactly one simple path between two nodes, and breadth-first search reaches each node
    first along its shortest path, one edge per round. Marking nodes as seen keeps the search from
    walking back the way it came, so round k holds exactly the nodes k steps away.</p>
    <h4>Complexity</h4>
    <p>O(n) time for the parent map and the search, plus O(m log m) to sort m answers. O(n) extra
    space for the parent map, the seen set and the frontier.</p>
    <h4>Pitfall</h4>
    <p>Searching only below the target misses everything reached through the parent, including the
    whole other side of the tree. And without a seen set, the search steps back to a node it just
    left and reports nodes at distance k - 2 as well.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'kStepsAway',
    params: [
      { name: 'root', type: 'TreeNode' },
      { name: 'target', type: 'int' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: three lines, the tree as a JSON array, then target, then k.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 3) return { ok: false, error: 'Enter three lines: the tree as a JSON array, then target, then k.' };
    let level;
    let target;
    let k;
    try {
      [level, target, k] = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'Each line must be valid JSON, for example [5,1,9,0,2] then 1 then 1.' };
    }
    const error = checkLevelArray(level);
    if (error) return { ok: false, error: `Tree ${error}.` };
    const vals = level.filter((v) => v !== null);
    if (vals.length < 1 || vals.length > MAX_NODES) return { ok: false, error: 'The tree needs 1 to 10^4 nodes.' };
    if (!vals.every((v) => v >= 0 && v <= MAX_VAL)) return { ok: false, error: 'Values must be from 0 to 10^5.' };
    if (new Set(vals).size !== vals.length) return { ok: false, error: 'Node values must be distinct.' };
    if (heightOf(level) > MAX_HEIGHT) return { ok: false, error: 'The tree height must be at most 300.' };
    if (!Number.isInteger(target) || !vals.includes(target)) return { ok: false, error: 'target must be the value of a node in the tree.' };
    if (!Number.isInteger(k) || k < 0 || k > MAX_K) return { ok: false, error: 'k must be an integer from 0 to 1000.' };
    return { ok: true, args: [level, target, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1], args[2]),
};

/**
 * Height in nodes, iteratively (the custom input may be a deep chain).
 * @param {(number|null)[]} level
 */
function heightOf(level) {
  let frontier = [treeFromLevel(level)].filter(Boolean);
  let h = 0;
  while (frontier.length) {
    h++;
    frontier = frontier.flatMap((n) => [n.left, n.right].filter(Boolean));
  }
  return h;
}

export default problem;
