/**
 * Problem: Circle Elimination
 *
 * Players in a circle, every k-th one leaves, who is left? Simulating with list deletions costs
 * O(n) per removal, so O(n^2) at n = 10^5. The Josephus recurrence does it in O(n): after the
 * first removal the survivors form a circle of n - 1 that starts k places later, so
 * winner(n) = (winner(n - 1) + k) mod n. Written as a loop to avoid 10^5-deep recursion.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: iterative Josephus recurrence on 0-based positions.
 * @param {number} n number of players, numbered 1..n clockwise
 * @param {number} k count length; the k-th player counted leaves
 * @returns {number} the winner's 1-based number
 */
export function reference(n, k) {
  let pos = 0; // winner's 0-based position in a circle of size 1
  for (let size = 2; size <= n; size++) pos = (pos + k) % size;
  return pos + 1;
}

const MAX_N = 100000;

/** A seeded k in [1, n]. */
const randomK = (seed, n) => 1 + Math.floor(mulberry32(seed)() * n);

const visible = [
  { args: [5, 2], expected: 3, note: 'Players leave in the order 2, 4, 1, 5; player 3 is left.' },
  { args: [6, 5], expected: 1, note: 'Players leave in the order 5, 4, 6, 2, 3.' },
  { args: [1, 1], expected: 1, note: 'A lone player wins.' },
  { args: [4, 1], expected: 4, note: 'With k = 1 players leave in order, so the last one wins.' },
  { args: [3, 3], expected: 2, note: 'Counting wraps around the circle: 3 leaves, then 1.' },
];

// Hidden tests: two players, k = n (the count wraps a full lap), k = 1 at max size (off-by-one
// in the start position), and n = 10^5 where list-deletion simulation is O(n^2) and counting
// step by step is O(n * k).
const hiddenArgs = [
  [2, 1],
  [2, 2],
  [7, 7],
  [10, 3],
  [1000, 37],
  [MAX_N, 1],
  [MAX_N, MAX_N],
  [MAX_N, 2],
  [MAX_N - 1, 50000],
  [MAX_N, randomK(7, MAX_N)],
];

export const problem = {
  id: 'circle-elimination',
  title: 'Circle Elimination',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Recursion', 'Josephus Recurrence', 'Simulation'],
  milestone: 1,
  timeLimitMs: 1000,
  argNames: ['n', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p><code>n</code> players sit in a circle, numbered <code>1</code> to <code>n</code>
    clockwise. A round works like this: start at the current player and count <code>k</code>
    players clockwise, counting the current player as <code>1</code> and wrapping around the
    circle when needed. The player you land on leaves the circle, and the next round starts at
    the player just clockwise of them.</p>
    <p>The first round starts at player <code>1</code>. Rounds continue until one player is left.
    Return that player's number.</p>
  `,
  constraints: [
    '1 <= k <= n <= 10^5',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}, k = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Simulating with a list works. What does removing from the middle of a list cost, and how often do you do it when n is 10^5?',
    'After the first player leaves, what is left looks like a smaller game. How many players, and where does it start?',
    'If you knew the winner\'s position in the smaller game, how would you translate it to a position in the bigger one?',
    'The smallest game has one player. Can you build up from there with a loop instead of deep recursion?',
  ],

  signature: {
    name: 'findTheWinner',
    params: [
      { name: 'n', type: 'int' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, n then k.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2 || !lines.every((l) => /^\d+$/.test(l))) return { ok: false, error: 'Enter two lines: n, then k, as whole numbers.' };
    const [n, k] = lines.map(Number);
    if (n < 1 || n > MAX_N) return { ok: false, error: 'n must be from 1 to 10^5.' };
    if (k < 1 || k > n) return { ok: false, error: 'k must be from 1 to n.' };
    return { ok: true, args: [n, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
