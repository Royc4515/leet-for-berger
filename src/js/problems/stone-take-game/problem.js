/**
 * Problem: Stone Take Game
 *
 * Two players remove 1 to 3 stones in turn; whoever takes the last stone wins. A win/lose table
 * over pile sizes shows the losing positions are exactly the multiples of 4, because from any
 * other size you can move to one. The DP that discovers this is O(n), and n goes up to 2^31 - 1,
 * so the point of the problem is to spot the pattern and answer in O(1).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 2147483647;

/**
 * Reference: the player to move loses exactly when n is a multiple of 4.
 * @param {number} n
 * @returns {boolean}
 */
export function reference(n) {
  return n % 4 !== 0;
}

/** A seeded pile size in [1, 2^31 - 1]; with `step` 4, a multiple of 4 (a losing size). */
function randomPile(seed, step = 1) {
  const rnd = mulberry32(seed);
  return step * (1 + Math.floor(rnd() * Math.floor(MAX_N / step)));
}

const visible = [
  { args: [4], expected: false, note: 'Whatever you take (1, 2 or 3), your opponent takes the rest.' },
  { args: [1], expected: true, note: 'Take the only stone.' },
  { args: [2], expected: true, note: 'Take both stones.' },
  { args: [7], expected: true, note: 'Take 3 and leave 4: now your opponent is the one who cannot win.' },
  { args: [8], expected: false, note: 'Every move leaves 5, 6 or 7, and from each of those your opponent can leave you 4.' },
];

// Hidden tests: the other small sizes, multiples of 4 next to winning sizes, and pile sizes near
// 2^31 - 1 where a table or a recursion over every size runs out of time or memory.
const hiddenArgs = [
  [3],
  [5],
  [12],
  [1000000000],
  [999999999],
  [MAX_N],
  [MAX_N - 3],
  [MAX_N - 1],
  [randomPile(41, 4)],
  [randomPile(43)],
];

export const problem = {
  id: 'stone-take-game',
  title: 'Stone Take Game',
  difficulty: 'Easy',
  topics: ['dp'],
  patterns: ['Math', 'Game Theory'],
  timeLimitMs: 2000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A pile holds <code>n</code> stones. You and a friend take turns, and you move first. On
    each turn a player removes 1, 2 or 3 stones from the pile. The player who removes the last
    stone wins.</p>
    <p>Both players play perfectly. Return <code>true</code> if you can win, otherwise
    <code>false</code>.</p>
    <p>The pile can hold up to 2<sup>31</sup> - 1 stones, so a table over every pile size is
    too slow.</p>
  `,
  constraints: [
    '1 <= n <= 2^31 - 1',
    'Target complexity: O(1) time and space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For n = 1, 2, 3 and 4, who wins? Can you play each one out by hand?',
    'A position is winning if some move leads to a losing position for the other player. Can you fill in a table for n up to 12?',
    'Which pile sizes in your table are losing? What do they have in common?',
    'Can you explain why, from any other size, there is always a move to one of those losing sizes?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'canWinStones',
    params: [{ name: 'n', type: 'int' }],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: n on one line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter n as a positive integer, for example 7.' };
    const n = Number(text);
    if (n < 1 || n > MAX_N) return { ok: false, error: 'n must be between 1 and 2^31 - 1.' };
    return { ok: true, args: [n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
