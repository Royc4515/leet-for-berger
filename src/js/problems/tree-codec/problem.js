/**
 * Problem: Tree Codec (design)
 *
 * Turn a binary tree into a string and back. LeetCode leaves the string format to the solver and
 * only checks that deserialize(serialize(tree)) rebuilds the tree, which an exact judge cannot
 * check call by call. Here the format is fixed, so both directions are judged on their own:
 *
 *   pre-order (node, left subtree, right subtree), "#" for every missing child, tokens joined by
 *   commas with no spaces. [1,2,3,null,null,4,5] is "1,2,#,#,3,4,#,#,5,#,#"; the empty tree is "#".
 *
 * serialize is tested on one set of trees and deserialize on strings of other trees, so a codec
 * that only round-trips its own private format fails. A test is a sequence of calls on one Codec,
 * which also catches parsing state (a token index) kept in a field and never reset.
 *
 * Height is capped at 500 so the natural recursion is safe in every language.
 */

import { mulberry32 } from '../../engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../../engine/structures.js';

const MAX_NODES = 10000;
const MAX_HEIGHT = 500;
const MAX_ABS = 1000;
const MAX_CALLS = 20;

/**
 * Pre-order string of a level-order tree, built with an explicit stack.
 * @param {(number|null)[]} level
 * @returns {string}
 */
export function encode(level) {
  const out = [];
  const stack = [treeFromLevel(level)];
  while (stack.length) {
    const n = stack.pop();
    if (!n) {
      out.push('#');
      continue;
    }
    out.push(String(n.val));
    // Right goes on the stack first so the left subtree is written first.
    stack.push(n.right, n.left);
  }
  return out.join(',');
}

/**
 * Parses a pre-order string strictly (canonical integers, nothing missing, nothing extra).
 * @param {unknown} data
 * @returns {{ level: (number|null)[] } | { error: string }}
 */
export function decode(data) {
  if (typeof data !== 'string') return { error: 'must be a string' };
  const tokens = data.split(',');
  const parse = (t) => (t === '#' ? null : /^(0|-?[1-9]\d{0,3})$/.test(t) ? { val: Number(t), left: null, right: null } : undefined);
  const root = parse(tokens[0]);
  if (root === undefined) return { error: `has an invalid token "${tokens[0]}"` };
  // Each stack entry is a node still waiting for a child; `side` says which one comes next.
  const stack = root ? [{ node: root, side: 'left' }] : [];
  for (let i = 1; i < tokens.length; i++) {
    if (!stack.length) return { error: 'has tokens after the tree is complete' };
    const child = parse(tokens[i]);
    if (child === undefined) return { error: `has an invalid token "${tokens[i]}"` };
    const top = stack[stack.length - 1];
    top.node[top.side] = child;
    if (top.side === 'left') top.side = 'right';
    else stack.pop();
    if (child) stack.push({ node: child, side: 'left' });
  }
  if (stack.length) return { error: 'ends before every child is given' };
  return { level: levelFromTree(root) };
}

/**
 * Reference simulation: serialize writes the pre-order string, deserialize returns the tree.
 * @param {string[]} ops operation names, ops[0] === 'Codec'
 * @param {unknown[][]} args argument list per operation
 * @returns {(string|(number|null)[]|null)[]}
 */
export function reference(ops, args) {
  return ops.map((op, i) => {
    if (op === 'serialize') return encode(args[i][0]);
    if (op === 'deserialize') return decode(args[i][0]).level;
    return null; // constructor
  });
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

/** Random shape with logarithmic expected height, values in [-MAX_ABS, MAX_ABS]. */
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

/** A chain of `depth` nodes; `side(i)` picks where node i hangs. */
function chain(depth, side) {
  const root = { val: -MAX_ABS, left: null, right: null };
  let cur = root;
  for (let i = 1; i < depth; i++) {
    const node = { val: (i * 37) % (2 * MAX_ABS + 1) - MAX_ABS, left: null, right: null };
    cur[side(i)] = node;
    cur = node;
  }
  return levelFromTree(root);
}

/** A test: serialize each tree in `toString`, then deserialize the encoding of each in `toTree`. */
function session(toString, toTree) {
  const ops = ['Codec'];
  const args = [[]];
  const n = Math.max(toString.length, toTree.length);
  // Interleaving the two directions catches a codec whose state from one call leaks into the next.
  for (let i = 0; i < n; i++) {
    if (i < toString.length) {
      ops.push('serialize');
      args.push([toString[i]]);
    }
    if (i < toTree.length) {
      ops.push('deserialize');
      args.push([encode(toTree[i])]);
    }
  }
  return [ops, args];
}

const visible = [
  {
    args: [['Codec', 'serialize', 'deserialize'], [[], [[1, 2, 3, null, null, 4, 5]], ['1,2,#,#,3,4,#,#,5,#,#']]],
    expected: [null, '1,2,#,#,3,4,#,#,5,#,#', [1, 2, 3, null, null, 4, 5]],
    note: 'Pre-order with "#" for each missing child, and back again.',
  },
  {
    args: [['Codec', 'serialize', 'deserialize'], [[], [[]], ['#']]],
    expected: [null, '#', []],
    note: 'The empty tree is a single "#".',
  },
  {
    args: [['Codec', 'serialize', 'deserialize'], [[], [[-7]], ['5,#,6,7,#,#,#']]],
    expected: [null, '-7,#,#', [5, null, 6, 7]],
    note: 'A leaf still writes "#" for both children. The string to parse is a different tree.',
  },
  {
    args: [['Codec', 'serialize', 'serialize'], [[], [[1, 2, null, 3]], [[1, null, 2, null, 3]]]],
    expected: [null, '1,2,3,#,#,#,#', '1,#,2,#,3,#,#'],
    note: 'Chains leaning left and right.',
  },
  {
    args: [['Codec', 'deserialize', 'deserialize'], [[], ['0,#,#'], ['10,-20,#,#,0,#,#']]],
    expected: [null, [0], [10, -20, 0]],
    note: 'The same Codec parses two strings in a row. 0 is a value, "#" is a missing child.',
  },
];

// Hidden tests: several calls on one Codec (a token index kept in a field fails the second
// parse), multi-digit negatives, zeros, chains at the height cap in both directions, a complete
// tree, and 10^4-node trees serialized and parsed in the same test.
const hiddenArgs = [
  session([[0, 0, 0]], [[0, null, 0], []]),
  session([[], [5]], [[1000, -1000], [-999]]),
  session([[3, 9, 20, null, null, 15, 7]], [[3, 9, 20, null, null, 15, 7], [1, 2, 3, 4, 5, 6, 7]]),
  session([chain(MAX_HEIGHT, () => 'left')], [chain(MAX_HEIGHT, () => 'right')]),
  session([chain(MAX_HEIGHT, (i) => (i % 2 ? 'right' : 'left'))], [chain(MAX_HEIGHT, (i) => (i % 3 ? 'left' : 'right'))]),
  session([randomTree(89, 50), randomTree(97, 7)], [randomTree(101, 60), randomTree(103, 1), randomTree(107, 12)]),
  session([Array.from({ length: 2 ** 11 - 1 }, (_, i) => (i % 2001) - MAX_ABS)], [Array.from({ length: 2 ** 11 - 1 }, (_, i) => MAX_ABS - (i % 2001))]),
  session([randomTree(109, MAX_NODES)], [randomTree(113, MAX_NODES)]),
  session([randomTree(127, MAX_NODES), randomTree(131, 3000)], [randomTree(137, MAX_NODES)]),
  session([randomTree(139, 500)], [randomTree(149, 500), randomTree(151, 500), randomTree(157, 500)]),
];

export const problem = {
  id: 'tree-codec',
  title: 'Tree Codec',
  difficulty: 'Hard',
  topics: ['trees'],
  patterns: ['Design', 'Pre-order Traversal', 'Parsing'],
  milestone: 2,
  timeLimitMs: 2000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a class that turns a binary tree into a string and a string back into a tree.
    Implement <code>Codec</code>:</p>
    <ul>
      <li><code>Codec()</code> creates the codec.</li>
      <li><code>serialize(root)</code> returns the string for the tree <code>root</code>.</li>
      <li><code>deserialize(data)</code> returns the root of the tree that <code>data</code>
      describes.</li>
    </ul>
    <p>The string format is fixed. Write the tree in <strong>pre-order</strong>: a node's value,
    then its whole left subtree, then its whole right subtree. Write <code>#</code> for every
    missing child, including both children of a leaf. Join the tokens with commas and no spaces.
    So the tree 1 with children 2 and 3, where 3 has children 4 and 5, is
    <code>"1,2,#,#,3,4,#,#,5,#,#"</code>, and the empty tree is <code>"#"</code>.
    <code>deserialize</code> is only given strings in this format.</p>
    <p>A test is a sequence of calls on one <code>Codec</code>: the first list names the
    operations, the second gives each call's arguments, and the output lists each call's result
    (<code>null</code> for the constructor). Trees are written in level order with
    <code>null</code> for a missing child. The height of every tree is at most 500, so a recursive
    solution is safe in every language.</p>
  `,
  constraints: [
    '0 <= number of nodes in each tree <= 10^4',
    'The height of every tree is at most 500',
    '-1000 <= Node.val <= 1000',
    `At most ${MAX_CALLS} calls per test`,
    'Target complexity: O(n) time per call for a tree of n nodes',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Why does the format need a marker for missing children? Could you rebuild a tree from its pre-order values alone?',
    'When you read a token while parsing, how do you know whether it starts a new subtree or ends one?',
    'Parsing pre-order recursively: what does one call read, and where does the next call continue?',
    'If the position in the token list lives in a field of the class, what happens on the second deserialize call?',
    'Building the string by repeated concatenation copies it again and again. What builds it in one pass?',
  ],

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'Codec',
    constructor: { params: [] },
    methods: [
      { name: 'serialize', params: [{ name: 'root', type: 'TreeNode' }], returns: 'string' },
      { name: 'deserialize', params: [{ name: 'data', type: 'string' }], returns: 'TreeNode' },
    ],
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two JSON lines, the operations and then the argument lists.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the operations, then the argument lists (both JSON arrays).' };
    let ops;
    let args;
    try {
      ops = JSON.parse(lines[0]);
      args = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    if (!Array.isArray(ops) || !Array.isArray(args) || ops.length !== args.length) return { ok: false, error: 'Operations and arguments must be arrays of the same length.' };
    if (ops[0] !== 'Codec' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "Codec" with no arguments.' };
    if (ops.length - 1 > MAX_CALLS) return { ok: false, error: `At most ${MAX_CALLS} calls after the constructor.` };
    const checkTree = (level, i) => {
      if (level.filter((v) => v !== null).length > MAX_NODES) return `Call ${i}: at most 10^4 nodes.`;
      if (!level.every((v) => v === null || (v >= -MAX_ABS && v <= MAX_ABS))) return `Call ${i}: values must be from -1000 to 1000.`;
      if (heightOf(level) > MAX_HEIGHT) return `Call ${i}: the tree height must be at most 500.`;
      return null;
    };
    for (let i = 1; i < ops.length; i++) {
      const a = args[i];
      if (!Array.isArray(a) || a.length !== 1) return { ok: false, error: `Call ${i} takes exactly one argument.` };
      let level;
      if (ops[i] === 'serialize') {
        const error = checkLevelArray(a[0]);
        if (error) return { ok: false, error: `Call ${i}: tree ${error}.` };
        level = a[0];
      } else if (ops[i] === 'deserialize') {
        const parsed = decode(a[0]);
        if (parsed.error) return { ok: false, error: `Call ${i}: the string ${parsed.error}.` };
        level = parsed.level;
      } else {
        return { ok: false, error: `Unknown operation "${ops[i]}".` };
      }
      const error = checkTree(level, i);
      if (error) return { ok: false, error };
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
