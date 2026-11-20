/**
 * Problem: Column Sweep
 *
 * Equivalent to LeetCode 314; statement and tests are written for this project. Read a binary
 * tree column by column, left to right: the root sits in column 0, a left child one column to its
 * left, a right child one to its right. Inside a column the values go from the top down, and two
 * nodes in the same row and column keep their left-to-right order, not their numeric order.
 *
 * Classic wrong answers: a depth-first walk (a deep node of the left subtree lands ahead of a
 * shallower node from the right subtree in the same column), sorting a column by value, and
 * forgetting that the columns have to come out in left-to-right order, not in the order they
 * were first met.
 *
 * Height is capped at 500 so a recursive solution is safe in every language.
 */

import { mulberry32 } from '../../engine/rng.js';
import { treeFromLevel, levelFromTree, checkLevelArray } from '../../engine/structures.js';

const MAX_NODES = 10000;
const MAX_HEIGHT = 500;
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

/**
 * Reference: breadth-first walk carrying each node's column; a level is visited left to right, so
 * appending in visit order gives top-down order with left-to-right ties for free.
 * @param {(number|null)[]} level tree in level-order form
 * @returns {number[][]}
 */
export function reference(level) {
  const root = treeFromLevel(level);
  if (!root) return [];
  const columns = new Map();
  let lo = 0;
  let hi = 0;
  const queue = [[root, 0]];
  for (let h = 0; h < queue.length; h++) {
    const [node, col] = queue[h];
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col).push(node.val);
    lo = Math.min(lo, col);
    hi = Math.max(hi, col);
    if (node.left) queue.push([node.left, col - 1]);
    if (node.right) queue.push([node.right, col + 1]);
  }
  const out = [];
  for (let c = lo; c <= hi; c++) out.push(columns.get(c));
  return out;
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

const node = (val, left = null, right = null) => ({ val, left, right });

/** `n` random values in [-10^9, 10^9], so equal rows and columns rarely hold sorted values. */
function randomValue(rnd) {
  return Math.floor(rnd() * 2e9) - 1e9;
}

/**
 * Random tree of `n` nodes and height at most MAX_HEIGHT. Each new node attaches to a free child
 * slot; `recent` near 1 picks among the newest nodes (long and stringy), 0 picks uniformly (bushy).
 */
function randomTree(seed, n, recent) {
  const rnd = mulberry32(seed);
  const root = { node: node(randomValue(rnd)), depth: 1 };
  const open = [root];
  for (let made = 1; made < n; made++) {
    const pick = recent > 0 && rnd() < recent ? open.length - 1 - Math.floor(rnd() * Math.min(open.length, 3)) : Math.floor(rnd() * open.length);
    const parent = open[pick];
    const free = ['left', 'right'].filter((s) => !parent.node[s]);
    const side = free[Math.floor(rnd() * free.length)];
    const child = { node: node(randomValue(rnd)), depth: parent.depth + 1 };
    parent.node[side] = child.node;
    if (free.length === 1) open.splice(pick, 1);
    if (child.depth < MAX_HEIGHT) open.push(child);
  }
  return levelFromTree(root.node);
}

/** A chain of `length` nodes, node i hanging off node i - 1 on the side `sideAt(i - 1)` names. */
function chain(length, sideAt) {
  const nodes = Array.from({ length }, (_, i) => node(i + 1));
  for (let i = 0; i + 1 < length; i++) nodes[i][sideAt(i)] = nodes[i + 1];
  return levelFromTree(nodes[0]);
}

/** A complete tree of the given height (2^height - 1 nodes), values in level order. */
function complete(height, rnd) {
  const count = 2 ** height - 1;
  const level = Array.from({ length: count }, () => randomValue(rnd));
  return level;
}

// A left child 2 with a long left-right-right dive that lands in column 0 at row 4, next to a
// right child 3 whose left child 5 is also in column 0 but at row 2. Breadth-first puts 5 first.
const deepDive = levelFromTree(node(1, node(2, node(7, null, node(8, null, node(9)))), node(3, node(5))));

const visible = [
  { args: [[3, 9, 20, null, null, 15, 7]], expected: [[9], [3, 15], [20], [7]], note: '9 is one column left of the root, 20 one right, 15 shares the root column from below, and 7 is two columns right.' },
  { args: [[3, 9, 8, 4, 0, 1, 7]], expected: [[4], [9], [3, 0, 1], [8], [7]], note: '0 and 1 both land in the root column at depth 2; 0 comes first because it is further left.' },
  { args: [[1, 2, 3, 4, 6, 5, 7]], expected: [[4], [2], [1, 6, 5], [3], [7]], note: '6 and 5 share a row and a column. They keep their left-to-right order, so 6 comes before 5 even though 5 is smaller.' },
  { args: [[1]], expected: [[1]], note: 'One node makes one column.' },
  { args: [[]], expected: [], note: 'An empty tree has no columns.' },
];

// Hidden tests: the empty tree, the 32-bit extremes, the "deep dive" tree where depth-first order
// breaks, left and zigzag chains at the height cap (one value per column, and the same two
// columns over and over), a complete tree of 8191 nodes (many ties), and three random trees with
// 10^4 nodes, bushy and stringy.
const hiddenInputs = [
  [],
  [INT_MAX, INT_MIN, INT_MIN],
  deepDive,
  [0, 0, 0],
  chain(MAX_HEIGHT, () => 'left'),
  chain(MAX_HEIGHT, (i) => (i % 2 === 0 ? 'left' : 'right')),
  complete(13, mulberry32(77)),
  randomTree(21, MAX_NODES, 0),
  randomTree(23, MAX_NODES, 0.9),
  randomTree(29, MAX_NODES, 0.97),
];

export const problem = {
  id: 'column-sweep',
  title: 'Column Sweep',
  difficulty: 'Medium',
  topics: ['trees'],
  patterns: ['Breadth-First Search', 'Hash Map', 'Binary Tree'],
  timeLimitMs: 2000,
  argNames: ['root'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given the <code>root</code> of a binary tree, return its values grouped by vertical column,
    from the leftmost column to the rightmost one.</p>
    <p>The root is in column <code>0</code>. A left child is one column to the left of its parent
    and a right child is one column to the right. Inside a column, list the values from the top of
    the tree downward. When two nodes share both the row and the column, the one further to the
    left comes first, whatever the values are.</p>
    <p>In the examples a tree is written in level order with <code>null</code> for a missing
    child. An empty tree gives an empty list. The height is at most 500, so a recursive solution
    is safe in every language.</p>
  `,
  constraints: [
    '0 <= number of nodes <= 10^4',
    'The height of the tree is at most 500',
    '-2^31 <= Node.val <= 2^31 - 1',
    'Target complexity: O(n) time with a hash map of columns, or O(n log n) with sorting',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `root = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How would you name the column of a node using only its parent\'s column?',
    'If you collect values into one list per column, which visiting order puts shallower nodes before deeper ones?',
    'Two nodes share a row and a column. Which visiting order puts the left one first without comparing values?',
    'The columns are not discovered left to right. How can you know which column numbers exist, and read them in order at the end?',
    'What changes if a depth-first walk is used instead, and can you build a small tree where two nodes of one column come out in the wrong order?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Walk the tree level by level with a queue, and store each node's column next to it: the
    root is 0, a left child is the parent's column minus one, a right child is the parent's plus
    one. Append every value to a list kept per column, and remember the smallest and the largest
    column seen. At the end, read the lists from the smallest column to the largest.</p>
    <h4>Why it works</h4>
    <p>A level-order walk visits rows from top to bottom, and inside a row from left to right. So
    for any column, the values are appended in exactly the order the statement asks for: higher
    nodes first, and left before right when they share a row. No comparison of values is needed.</p>
    <h4>Complexity</h4>
    <p>O(n) time and space: each node is queued once and appended once. The columns form a
    contiguous range, so reading them in order needs no sort.</p>
    <h4>Pitfall</h4>
    <p>A depth-first walk reaches a deep node of the left subtree before a shallow node of the
    right subtree, so a column can come out in the wrong vertical order unless you also sort by
    row. Sorting a column by value breaks the left-to-right rule for equal rows. And a hash map
    gives no column order, so keep the minimum and maximum column, or sort the keys.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'columnOrder',
    params: [{ name: 'root', type: 'TreeNode' }],
    returns: 'int[][]',
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
      return { ok: false, error: 'Enter the tree as a JSON array, for example [3,9,20,null,null,15,7].' };
    }
    const error = checkLevelArray(level);
    if (error) return { ok: false, error: `Tree ${error}.` };
    if (level.filter((v) => v !== null).length > MAX_NODES) return { ok: false, error: 'The tree has at most 10^4 nodes.' };
    if (!level.every((v) => v === null || (v >= INT_MIN && v <= INT_MAX))) return { ok: false, error: 'Values must fit in a 32-bit integer.' };
    if (heightOf(level) > MAX_HEIGHT) return { ok: false, error: 'The tree height must be at most 500.' };
    return { ok: true, args: [level] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
