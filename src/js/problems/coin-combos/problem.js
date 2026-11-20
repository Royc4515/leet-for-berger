/**
 * Problem: Coin Combos
 *
 * Count the combinations of coins (unlimited supply of each) that add up to an amount, where
 * order does not matter: 1 + 2 and 2 + 1 are the same combination. Unbounded knapsack counting
 * with the coin loop OUTSIDE the amount loop, so each combination is built in one fixed coin order.
 *
 * Classic wrong answers: swapping the loops (that counts ordered sequences), forgetting that
 * amount 0 has exactly one combination (the empty one), and plain recursion, which is exponential.
 *
 * LeetCode guarantees the count fits in 32 bits, but intermediate counts for smaller amounts do
 * not, which is a silent overflow trap. With these limits the true count can exceed even 64 bits,
 * so the answer is taken modulo 10^9 + 7: every value stays exact and every language agrees.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MOD = 1_000_000_007;
const MAX_AMOUNT = 5000;
const MAX_COINS = 300;
const MAX_COIN = 5000;

/**
 * Reference: ways[a] counts combinations of the coins seen so far that sum to a.
 * @param {number} amount
 * @param {number[]} coins distinct denominations
 * @returns {number}
 */
export function reference(amount, coins) {
  const ways = new Array(amount + 1).fill(0);
  ways[0] = 1;
  for (const c of coins) {
    for (let a = c; a <= amount; a++) ways[a] = (ways[a] + ways[a - c]) % MOD;
  }
  return ways[amount];
}

/** `k` distinct random denominations in [lo, hi]. */
function randomCoins(seed, k, lo, hi) {
  const rnd = mulberry32(seed);
  const set = new Set();
  while (set.size < k) set.add(lo + Math.floor(rnd() * (hi - lo + 1)));
  return [...set];
}

const visible = [
  { args: [5, [1, 2, 5]], expected: 4, note: '5, 2+2+1, 2+1+1+1, 1+1+1+1+1.' },
  { args: [3, [2]], expected: 0, note: 'Only even amounts can be made from 2s.' },
  { args: [0, [7]], expected: 1, note: 'Amount 0 has exactly one combination: take no coins.' },
  { args: [4, [1, 2]], expected: 3, note: '1+1+1+1, 2+1+1, 2+2. The orders 1+2+1 and 1+1+2 are the same combination as 2+1+1.' },
  { args: [500, Array.from({ length: 50 }, (_, i) => i + 1)], expected: 191632341, note: 'Coins 1 to 50. The exact count is about 7.5 * 10^20, more than 64 bits can hold, so it is reported modulo 10^9 + 7.' },
];

// Hidden tests: coins larger than the amount, a single coin of 1, unsorted coins, amount 0 with
// many coins, an amount no coin reaches, then the full 300 coins against amount 5000 (dense
// small coins push every intermediate count past 64 bits), where recursion is exponential.
const hiddenArgs = [
  [10, [11, 20]],
  [MAX_AMOUNT, [1]],
  [11, [5, 2, 1]],
  [0, randomCoins(223, 50, 1, MAX_COIN)],
  [4999, [10, 50, 250]],
  [500, [3, 5, 7, 8, 9, 10, 11]],
  [MAX_AMOUNT, Array.from({ length: MAX_COINS }, (_, i) => i + 1)],
  [MAX_AMOUNT, randomCoins(227, MAX_COINS, 1, MAX_COIN)],
  [MAX_AMOUNT - 1, randomCoins(229, MAX_COINS, 1, 600)],
  [2500, randomCoins(233, 120, 7, 2500)],
];

export const problem = {
  id: 'coin-combos',
  title: 'Coin Combos',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Unbounded Knapsack', 'Counting'],
  timeLimitMs: 2000,
  argNames: ['amount', 'coins'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You have an unlimited number of coins of each denomination in <code>coins</code>. Return the
    number of <strong>combinations</strong> of coins whose values add up to exactly
    <code>amount</code>.</p>
    <p>Order does not matter: <code>1 + 2</code> and <code>2 + 1</code> are the same combination.
    An <code>amount</code> of <code>0</code> has exactly one combination, using no coins.</p>
    <p>The count can be astronomically large, so return it <strong>modulo
    1,000,000,007</strong> (10<sup>9</sup> + 7).</p>
  `,
  constraints: [
    '1 <= coins.length <= 300',
    '1 <= coins[i] <= 5000, all denominations distinct',
    '0 <= amount <= 5000',
    'Return the count modulo 10^9 + 7 (the exact count can exceed 64 bits)',
    'Target complexity: O(amount * coins.length) time, O(amount) space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `amount = ${t.args[0]}, coins = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How would you count ordered sequences of coins? Why does that overcount combinations?',
    'If you decide coin by coin how many of each to use, can the same combination be counted twice?',
    'Process one denomination at a time: how does adding a new coin change the number of ways to reach each amount?',
    'Which loop goes outside, coins or amounts, and what does each order count?',
    'Two counts below 10^9 + 7 are added. Does their sum fit in a 32-bit integer before you reduce it?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Let <code>ways[a]</code> count the combinations that reach amount <code>a</code>. Add the coins
    one denomination at a time: for coin <code>c</code>, every amount <code>a &gt;= c</code> gains
    <code>ways[a - c]</code>. Start with <code>ways[0] = 1</code>, the empty combination.</p>
    <h4>Why it works</h4>
    <p>With the coin loop outside, after processing the first <code>k</code> denominations,
    <code>ways[a]</code> counts combinations that use only those coins. Every combination is therefore
    built in one fixed coin order, so <code>1 + 2</code> and <code>2 + 1</code> are counted once. Running
    amounts upward inside the coin loop lets the same coin be reused any number of times.</p>
    <h4>Complexity</h4>
    <p>O(amount * coins.length) time and O(amount) space. Recursion over every choice is exponential.</p>
    <h4>Pitfall</h4>
    <p>Swapping the loops (amounts outside, coins inside) counts ordered sequences instead of
    combinations. Reduce modulo <code>10^9 + 7</code> after every addition: the exact counts exceed 64
    bits, and in 32-bit arithmetic the sum of two reduced values can already overflow.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'change',
    params: [
      { name: 'amount', type: 'int' },
      { name: 'coins', type: 'int[]' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, amount, then coins as a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: amount, then coins as a JSON array.' };
    let amount;
    let coins;
    try {
      amount = JSON.parse(lines[0]);
      coins = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON.' };
    }
    if (!Number.isInteger(amount) || amount < 0 || amount > MAX_AMOUNT) return { ok: false, error: 'amount must be an integer from 0 to 5000.' };
    if (!Array.isArray(coins) || coins.length < 1 || coins.length > MAX_COINS) return { ok: false, error: 'coins must have 1 to 300 elements.' };
    if (!coins.every((c) => Number.isInteger(c) && c >= 1 && c <= MAX_COIN)) return { ok: false, error: 'Coins must be integers from 1 to 5000.' };
    if (new Set(coins).size !== coins.length) return { ok: false, error: 'Denominations must be distinct.' };
    return { ok: true, args: [amount, coins] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). The target is amount * coins.length. amount is capped at 5000 and 300 coins take only a few milliseconds, so the coin count grows (distinct denominations in 1..5000, up to every value): amount stays 5000 and every coin sweeps about half the table.
  growth: {
    target: 'n',
    n: 'coins.length',
    sizes: [313, 625, 1250, 2500, 5000],
    input: (n, seed) => [5000, intArray(n, mulberry32(seed), { min: 1, max: 5000, distinct: true })],
  },
};

export default problem;
