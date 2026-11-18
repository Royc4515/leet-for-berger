/**
 * Problem: Level Order
 *
 * Return a binary tree's values level by level, left to right. The canonical breadth-first
 * traversal: the queue-per-level loop it teaches is reused by right side view, zigzag order,
 * level sums, minimum depth and every "shortest steps" grid search.
 *
 * Trees cross the worker boundary as level-order arrays with nulls ([3,9,20,null,null,15,7]);
 * engine/adapters.js turns them into TreeNode objects for the user's code.
 */

import { mulberry32 } from '../../engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../../engine/structures.js';

/**
 * Reference: BFS one level at a time.
 * @param {(number|null)[]} level tree in level-order form
 * @returns {number[][]}
 */
export function reference(level) {
  const root = treeFromLevel(level);
  if (!root) return [];
  const out = [];
  let frontier = [root];
  while (frontier.length) {
    out.push(frontier.map((n) => n.val));
    frontier = frontier.flatMap((n) => [n.left, n.right].filter(Boolean));
  }
  return out;
}

const MAX_NODES = 10000;

/** Random shape with logarithmic expected depth: a BST over shuffled ids, then random values. */
function randomTree(seed, n) {
  const rnd = mulberry32(seed);
  const ids = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const level = levelFromTree(bstFromInsertions(ids));
  return level.map((v) => (v === null ? null : Math.floor(rnd() * 2001) - 1000));
}

/** A chain of `depth` nodes; `pattern` picks the side for each step. */
function chain(depth, pattern) {
  const root = { val: 0, left: null, right: null };
  let cur = root;
  for (let i = 1; i < depth; i++) {
    const node = { val: i % 1000, left: null, right: null };
    cur[pattern(i)] = node;
    cur = node;
  }
  return levelFromTree(root);
}

function perfectTree(depth) {
  return Array.from({ length: 2 ** depth - 1 }, (_, i) => (i % 2001) - 1000);
}

const visible = [
  { args: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [9, 20], [15, 7]], note: 'Three levels; 9 has no children.' },
  { args: [[1]], expected: [[1]], note: 'A single node is one level.' },
  { args: [[]], expected: [], note: 'An empty tree has no levels.' },
  { args: [[1, 2, null, 3, null, 4]], expected: [[1], [2], [3], [4]], note: 'A left-leaning chain: one node per level.' },
  { args: [[1, null, 2, null, 3]], expected: [[1], [2], [3]], note: 'A right-leaning chain.' },
];

// Hidden tests: complete and perfect shapes, chains on either side and zigzagging (a DFS that
// forgets left-to-right order fails these), negative values, and 10^4-node trees.
const hiddenInputs = [
  [1, 2, 3, 4, 5, 6, 7],
  [-1, -2, -3, null, -4],
  chain(300, () => 'left'),
  chain(300, () => 'right'),
  chain(200, (i) => (i % 2 ? 'left' : 'right')),
  randomTree(7, 100),
  randomTree(11, MAX_NODES),
  randomTree(13, MAX_NODES),
  perfectTree(13),
  [0],
];

export const problem = {
  id: 'level-order',
  title: 'Level Order',
  difficulty: 'Medium',
  topics: ['trees'],
  patterns: ['Breadth-First Search', 'Queue'],
  timeLimitMs: 2000,
  argNames: ['root'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>root</code> of a binary tree. Return its values grouped by depth:
    the root's level first, then its children, and so on, each level read from left to right.</p>
    <p>In the examples a tree is written in level order with <code>null</code> for a missing
    child, so <code>[3,9,20,null,null,15,7]</code> is 3 with children 9 and 20, where 20 has
    children 15 and 7.</p>
  `,
  constraints: [
    '0 <= number of nodes <= 10^4',
    '-1000 <= Node.val <= 1000',
    'Target complexity: O(n) time, O(w) extra space for maximum width w',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `root = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which nodes do you need to have seen before you can start the next level?',
    'What data structure hands nodes back in the order you discovered them?',
    'How can you tell where one level ends and the next begins while the queue keeps growing?',
    'If you used recursion instead, what extra information would every call need to carry?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Breadth-first search, one level at a time. Start with the root as the current level, record
    its values, then build the next level from the children, left before right, and repeat until a
    level is empty.</p>
    <h4>Why it works</h4>
    <p>The queue (or current-level array) holds exactly the nodes of one depth when a round starts,
    in left-to-right order. Appending each node's left child before its right child keeps the next
    level in left-to-right order too, so each round produces one correct group.</p>
    <h4>Complexity</h4>
    <p>O(n) time: every node is enqueued and read once. O(w) extra space for the widest level w,
    besides the output itself.</p>
    <h4>Pitfall</h4>
    <p>The level boundaries. A single queue without noting its size at the start of each round mixes
    two depths into one group. Read the length first, or build the next level as a separate list.
    An empty tree returns <code>[]</code>, not <code>[[]]</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'levelOrder',
    params: [{ name: 'root', type: 'TreeNode' }],
    returns: 'int[][]',
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
    if (!level.every((v) => v === null || (v >= -1000 && v <= 1000))) return { ok: false, error: 'Values must be from -1000 to 1000.' };
    return { ok: true, args: [level] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). A complete tree: the
  // widest shape for its size, so a queue that shifts from the front of an array pays for it.
  // The timed call includes building the tree from JSON, which is linear too.
  growth: {
    target: 'n',
    n: 'number of nodes',
    sizes: [2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      return [Array.from({ length: n }, () => Math.floor(rnd() * 2001) - 1000)];
    },
  },
};

export default problem;
