/**
 * Problem: Fewest Coins
 *
 * Fewest coins (unlimited supply of each denomination) that add up to an amount, or -1. Taking
 * the largest coin first is the classic wrong answer ([1, 3, 4] for 6: greedy says 3, the answer is
 * 2), and plain recursion over "which coin next" is exponential. Bottom-up DP over amounts is
 * O(amount * coins).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_COINS = 12;
const MAX_COIN = 2147483647;
const MAX_AMOUNT = 10000;

/**
 * Reference: dp[a] = fewest coins summing to a.
 * @param {number[]} coins
 * @param {number} amount
 * @returns {number}
 */
export function reference(coins, amount) {
  const INF = amount + 1;
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
  }
  return dp[amount] >= INF ? -1 : dp[amount];
}

/** Twelve distinct random denominations in [lo, hi]. */
function randomCoins(seed, lo, hi) {
  const rnd = mulberry32(seed);
  const set = new Set();
  while (set.size < MAX_COINS) set.add(lo + Math.floor(rnd() * (hi - lo + 1)));
  return [...set];
}

const visible = [
  { args: [[1, 2, 5], 11], expected: 3, note: '11 = 5 + 5 + 1.' },
  { args: [[2], 3], expected: -1, note: 'Only even totals can be made from 2s.' },
  { args: [[1], 0], expected: 0, note: 'An amount of 0 needs no coins.' },
  { args: [[1, 3, 4], 6], expected: 2, note: '3 + 3. Taking the 4 first forces 4 + 1 + 1, which is worse.' },
  { args: [[186, 419, 83, 408], 6249], expected: 20, note: 'No simple pattern: every amount up to 6249 has to be considered.' },
];

// Hidden tests: amount 0 with a big coin, a coin larger than the amount, an unreachable odd total,
// a coin of 2^31 - 1 (overflow if you add before comparing), greedy traps, then the maximum
// amount with 12 denominations, where trying coin sequences recursively is exponential.
const hiddenArgs = [
  [[7], 0],
  [[MAX_COIN], 2],
  [[2, 4, 6], 9999],
  [[MAX_COIN, 1, 3], 10],
  [[1, 5, 6, 9], 11],
  [[25, 10, 1], 30],
  [[3, 7, 405, 436], 8839],
  [randomCoins(67, 2, 40), MAX_AMOUNT],
  [randomCoins(71, 97, 997), MAX_AMOUNT - 1],
  [[9973, 9967, 9949, 9941, 9931, 9929, 9923, 9907, 9901, 9887, 9883, 2], MAX_AMOUNT],
];

export const problem = {
  id: 'fewest-coins',
  title: 'Fewest Coins',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Unbounded Knapsack'],
  milestone: 2,
  timeLimitMs: 2000,
  argNames: ['coins', 'amount'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You have an unlimited number of coins of each denomination in <code>coins</code>. Return the
    <strong>fewest</strong> coins whose values add up to exactly <code>amount</code>.</p>
    <p>If no combination of coins reaches <code>amount</code>, return <code>-1</code>. An
    <code>amount</code> of <code>0</code> takes zero coins.</p>
  `,
  constraints: [
    '1 <= coins.length <= 12',
    '1 <= coins[i] <= 2^31 - 1',
    '0 <= amount <= 10^4',
    'Target complexity: O(amount * coins.length) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `coins = ${JSON.stringify(t.args[0])}, amount = ${t.args[1]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Does always taking the largest coin that fits give the fewest coins? Try coins [1, 3, 4] and amount 6.',
    'If the last coin you use has value c, what smaller problem is left?',
    'How many different amounts can that smaller problem ever be? Why does that matter?',
    'In what order should you solve those smaller amounts so each answer is ready when you need it?',
    'What value marks an amount as unreachable without causing overflow when you add 1 to it?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'coinChange',
    params: [
      { name: 'coins', type: 'int[]' },
      { name: 'amount', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, coins as a JSON array, then amount.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: coins as a JSON array, then amount.' };
    let coins;
    let amount;
    try {
      coins = JSON.parse(lines[0]);
      amount = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON.' };
    }
    if (!Array.isArray(coins) || coins.length < 1 || coins.length > MAX_COINS) return { ok: false, error: 'coins must have 1 to 12 elements.' };
    if (!coins.every((c) => Number.isInteger(c) && c >= 1 && c <= MAX_COIN)) return { ok: false, error: 'Coins must be integers from 1 to 2^31 - 1.' };
    if (!Number.isInteger(amount) || amount < 0 || amount > MAX_AMOUNT) return { ok: false, error: 'amount must be an integer from 0 to 10^4.' };
    return { ok: true, args: [coins, amount] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
