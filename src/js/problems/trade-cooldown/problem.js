/**
 * Problem: Trade Cooldown
 *
 * Maximum profit from buying and selling one share at a time, as often as you like, where the day
 * after a sale is a forced rest. A three-state machine per day (holding, just sold, free to buy),
 * kept in three variables: O(n) time, O(1) space.
 *
 * Classic wrong answers: summing every rising step (the no-cooldown answer), which buys the day
 * after a sale; and recursion over days, which is exponential plain and, memoized, recurses
 * 10^5 calls deep. n is raised from LeetCode's 5000 to 10^5 so an O(n^2) DP also times out.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_P = 10000;

/**
 * Reference: hold = best profit while holding a share, sold = best profit having sold today,
 * rest = best profit with no share and free to buy.
 * @param {number[]} prices
 * @returns {number}
 */
export function reference(prices) {
  let hold = -Infinity;
  let sold = 0;
  let rest = 0;
  for (const p of prices) {
    const prevSold = sold;
    sold = hold + p;
    hold = Math.max(hold, rest - p);
    rest = Math.max(rest, prevSold);
  }
  return Math.max(sold, rest);
}

function randomPrices(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

/** A random walk, so prices trend instead of jumping around. */
function walk(seed, n, step) {
  const rnd = mulberry32(seed);
  let p = MAX_P / 2;
  return Array.from({ length: n }, () => {
    p = Math.min(MAX_P, Math.max(0, p + Math.floor(rnd() * (2 * step + 1)) - step));
    return p;
  });
}

const visible = [
  { args: [[1, 2, 3, 0, 2]], expected: 3, note: 'Buy at 1, sell at 2, rest, buy at 0, sell at 2.' },
  { args: [[1]], expected: 0, note: 'One day: no trade is possible.' },
  { args: [[5, 4, 3, 2, 1]], expected: 0, note: 'Prices only fall, so never buy.' },
  { args: [[1, 4, 2, 7]], expected: 6, note: 'Buy at 1 and sell at 7. Selling at 4 forces a rest on the day priced 2.' },
  { args: [[3, 3, 5, 0, 0, 3, 1, 4]], expected: 6, note: 'Buy at 3, sell at 5, rest on day 3, buy at 0 on day 4, sell at 4 on the last day.' },
];

// Hidden tests: two days, a flat line, a rise right after a sale, small zigzags, then 10^5 days:
// random prices, a random walk, a strictly rising line, and a two-day zigzag where the cooldown
// changes the answer most and an O(n^2) DP times out.
const hiddenArgs = [
  [[2, 1]],
  [[7, 7, 7, 7]],
  [[1, 2, 4, 2, 5, 7, 2, 4, 9, 0]],
  [[6, 1, 3, 2, 4, 7]],
  [randomPrices(239, 1000, 0, 20)],
  [randomPrices(241, MAX_N, 0, MAX_P)],
  [walk(251, MAX_N, 50)],
  [Array.from({ length: MAX_N }, (_, i) => Math.floor(i / 10))],
  [Array.from({ length: MAX_N }, (_, i) => (i % 2 ? MAX_P : 0))],
  [Array.from({ length: MAX_N - 1 }, (_, i) => [0, MAX_P, MAX_P - 1, 1][i % 4])],
];

export const problem = {
  id: 'trade-cooldown',
  title: 'Trade Cooldown',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'State Machine'],
  timeLimitMs: 2000,
  argNames: ['prices'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p><code>prices[i]</code> is the price of a stock on day <code>i</code>. You may complete as
    many transactions as you like (buy one share, then sell it), with two rules:</p>
    <ul>
      <li>You hold at most one share at a time: sell before you buy again.</li>
      <li>After you sell, you must rest for one day: you cannot buy on the next day.</li>
    </ul>
    <p>Return the largest total profit you can make. Making no trades at all gives 0.</p>
  `,
  constraints: [
    '1 <= prices.length <= 10^5 (raised from LeetCode\'s 5000)',
    '0 <= prices[i] <= 10^4',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `prices = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Without the rest day, taking every rising step is optimal. Which of those trades does the rest day forbid?',
    'At the end of a day, what situations can you be in? Holding a share, having just sold, or something else?',
    'For each situation, which situations on the previous day could have led to it?',
    'You only ever look one day back. How many numbers do you need to keep?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maxProfit',
    params: [{ name: 'prices', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: prices as a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let prices;
    try {
      prices = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter prices as a JSON array, for example [1,2,3,0,2].' };
    }
    if (!Array.isArray(prices) || prices.length < 1 || prices.length > MAX_N) return { ok: false, error: 'prices must have 1 to 10^5 elements.' };
    if (!prices.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_P)) return { ok: false, error: 'Prices must be integers from 0 to 10^4.' };
    return { ok: true, args: [prices] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
