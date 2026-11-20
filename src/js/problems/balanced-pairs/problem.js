/**
 * Problem: Balanced Pairs
 *
 * List every well-formed arrangement of n pairs of round brackets whose nesting never gets deeper
 * than maxDepth. With maxDepth = n there is no limit, which is the classic "generate all balanced
 * strings" exercise; a smaller limit gives the hidden tests many different inputs and punishes
 * solutions that filter after the fact.
 *
 * Backtracking: at each position either open (if pairs remain and the depth limit allows) or
 * close (if something is open). Every string it reaches is valid, so nothing is generated and
 * thrown away, and trying "(" before ")" yields dictionary order for free ("(" sorts before ")").
 * The count is a Catalan number, 58786 for n = 11, so the output itself is the cost.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 11;

/**
 * Reference: depth-first search, opening bracket first.
 * @param {number} n pairs
 * @param {number} maxDepth deepest allowed nesting
 * @returns {string[]} sorted
 */
export function reference(n, maxDepth) {
  const out = [];
  const path = [];
  const dfs = (open, close) => {
    if (path.length === 2 * n) {
      out.push(path.join(''));
      return;
    }
    if (open < n && open - close < maxDepth) {
      path.push('(');
      dfs(open + 1, close);
      path.pop();
    }
    if (close < open) {
      path.push(')');
      dfs(open, close + 1);
      path.pop();
    }
  };
  dfs(0, 0);
  return out;
}

const visible = [
  { args: [1, 1], expected: ['()'], note: 'One pair has one arrangement.' },
  { args: [2, 2], expected: ['(())', '()()'], note: 'Nested or side by side; "(" sorts before ")", so the nested one is first.' },
  { args: [2, 1], expected: ['()()'], note: 'With nesting capped at 1, (()) is out.' },
  { args: [3, 3], expected: ['((()))', '(()())', '(())()', '()(())', '()()()'], note: 'No effective cap: all 5 arrangements of 3 pairs.' },
  { args: [3, 2], expected: ['(()())', '(())()', '()(())', '()()()'], note: '((())) reaches depth 3, so it is dropped.' },
];

// Hidden tests: a depth cap of 1 (a single answer), caps in the middle, no cap at all, and the
// largest sizes: n = 11 with no cap (58786 strings), a cap of 6 and a cap of 4.
const hiddenArgs = [
  [4, 4],
  [5, 1],
  [6, 3],
  [7, 4],
  [8, 8],
  [9, 5],
  [10, 10],
  [11, 11],
  [11, 6],
  [11, 4],
];

export const problem = {
  id: 'balanced-pairs',
  title: 'Balanced Pairs',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Backtracking', 'Pruning'],
  timeLimitMs: 3000,
  argNames: ['n', 'maxDepth'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A string of round brackets is <strong>well formed</strong> if every <code>(</code> is closed
    by a later <code>)</code> and no <code>)</code> appears with nothing open. Its <strong>depth</strong>
    is the largest number of brackets open at the same moment.</p>
    <p>Given <code>n</code> pairs and a limit <code>maxDepth</code>, return every well-formed string
    that uses exactly <code>n</code> pairs and has depth at most <code>maxDepth</code>. Return them in
    <strong>dictionary order</strong>, where <code>(</code> comes before <code>)</code>. With
    <code>maxDepth = n</code> the limit never applies.</p>
  `,
  constraints: [
    '1 <= n <= 11',
    '1 <= maxDepth <= n',
    'Output in dictionary order, "(" before ")"',
    'Target complexity: time proportional to the output size (up to 58786 strings of length 22)',
  ],
  examples: visible.slice(0, 4).map((t) => ({
    input: `n = ${t.args[0]}, maxDepth = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'You build the string one character at a time. At a given moment, which characters are you allowed to add?',
    'What do you need to track so you know whether a ")" is allowed, and whether a "(" is?',
    'If you only ever add allowed characters, do you need to check the finished string at all?',
    'In what order should you try "(" and ")" so that finished strings come out in dictionary order?',
    'Where does the depth limit enter: while building, or as a filter at the end? Which wastes less work?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Build each string left to right with a depth-first search that tracks how many brackets were
    opened and how many closed. You may open while fewer than n are used and the depth
    (opened minus closed) is below the limit. You may close while something is open. Try the opening
    bracket first.</p>
    <h4>Why it works</h4>
    <p>Both rules are exactly the conditions for a prefix that can still be finished into a valid
    string, so every path ends in an answer and no dead end is explored. Each valid string has one
    unique path, so nothing repeats. Because <code>(</code> sorts before <code>)</code>, trying it
    first visits the answers in dictionary order.</p>
    <h4>Complexity</h4>
    <p>O(C * n) time and space for C answers of length 2n: the work is proportional to the output,
    which is a Catalan number (58786 for n = 11).</p>
    <h4>Pitfall</h4>
    <p>Generating all 2^(2n) strings and checking each one is the slow way. The other classic slip is
    allowing a closing bracket whenever pairs remain, instead of whenever a bracket is open, which
    produces strings like <code>())(</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'balancedPairs',
    params: [
      { name: 'n', type: 'int' },
      { name: 'maxDepth', type: 'int' },
    ],
    returns: 'string[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: n on the first line, maxDepth on the second.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: n, then maxDepth.' };
    if (!lines.every((l) => /^\d+$/.test(l))) return { ok: false, error: 'n and maxDepth must be whole numbers.' };
    const [n, maxDepth] = lines.map(Number);
    if (n < 1 || n > MAX_N) return { ok: false, error: 'n must be from 1 to 11.' };
    if (maxDepth < 1 || maxDepth > n) return { ok: false, error: 'maxDepth must be from 1 to n.' };
    return { ok: true, args: [n, maxDepth] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
