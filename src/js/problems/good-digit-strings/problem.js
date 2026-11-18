/**
 * Problem: Good Digit Strings
 *
 * Count digit strings of length n where even positions hold an even digit (5 choices) and odd
 * positions a prime digit (4 choices). Positions are independent, so the count is
 * 5^ceil(n/2) * 4^floor(n/2) mod 1_000_000_007. The work is the modular fast power: n goes up to
 * 10^15, so multiplying n times is hopeless, and two residues multiply to about 10^18, which
 * needs 64-bit arithmetic (or BigInt in JavaScript).
 *
 * n stays below 2^53, so every value travels exactly as a JSON number.
 */

import { mulberry32 } from '../../engine/rng.js';

const MOD = 1000000007n;

/** base^e mod MOD in BigInt. */
function powMod(base, e) {
  let b = BigInt(base) % MOD;
  let k = BigInt(e);
  let r = 1n;
  while (k > 0n) {
    if (k & 1n) r = (r * b) % MOD;
    b = (b * b) % MOD;
    k >>= 1n;
  }
  return r;
}

/**
 * Reference: 5^(even positions) * 4^(odd positions), with exact BigInt arithmetic.
 * @param {number} n
 * @returns {number}
 */
export function reference(n) {
  const big = BigInt(n);
  const odd = big / 2n; // positions 1, 3, 5, ...
  const even = big - odd; // positions 0, 2, 4, ...
  return Number((powMod(5, even) * powMod(4, odd)) % MOD);
}

const MAX_N = 10 ** 15;

/** A seeded n in [1, 10^15]. */
function randomN(seed) {
  const rnd = mulberry32(seed);
  // Two draws: one mulberry32 draw has only 32 bits of resolution, too coarse for 10^15 values.
  return Math.floor(rnd() * 1e6) * 1e9 + Math.floor(rnd() * 1e9) + 1;
}

const visible = [
  { args: [1], expected: 5, note: 'One digit at position 0, which must be even: 0, 2, 4, 6 or 8.' },
  { args: [4], expected: 400, note: 'Positions 0 and 2 have 5 choices, positions 1 and 3 have 4: 5 * 4 * 5 * 4.' },
  { args: [50], expected: 564908303, note: '5^25 * 4^25 is far past 32 bits; reduce modulo 1000000007 as you go.' },
  { args: [2], expected: 20, note: 'An even digit followed by 2, 3, 5 or 7.' },
  { args: [3], expected: 100, note: 'Leading zeros are allowed: "020" is good.' },
];

// Hidden tests: odd and even n near the 32-bit boundary (a 32-bit loop counter or shift breaks),
// 2^40, n = 10^15 and 10^15 - 1, and seeded n up to 10^15 where looping n times cannot finish.
const hiddenArgs = [
  [5],
  [1000000],
  [2147483647],
  [4294967298],
  [MAX_N],
  [MAX_N - 1],
  [1099511627776],
  [randomN(239)],
  [randomN(241)],
  [123456789012345],
];

export const problem = {
  id: 'good-digit-strings',
  title: 'Good Digit Strings',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Math', 'Combinatorics', 'Fast Exponentiation'],
  timeLimitMs: 2000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A string of digits is <em>good</em> if every digit at an even index (0, 2, 4, ...) is even
    (<code>0, 2, 4, 6, 8</code>) and every digit at an odd index (1, 3, 5, ...) is a prime
    (<code>2, 3, 5, 7</code>). Leading zeros are allowed.</p>
    <p>Given <code>n</code>, return the number of good digit strings of length <code>n</code>,
    modulo 1&nbsp;000&nbsp;000&nbsp;007.</p>
    <p><code>n</code> can be as large as 10<sup>15</sup>, so it is a 64-bit integer.</p>
  `,
  constraints: [
    '1 <= n <= 10^15 (64-bit)',
    'The answer is in [0, 1000000006]',
    'Target complexity: O(log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Does the choice of digit at one position limit the choices anywhere else?',
    'How many even indices and how many odd indices does a string of length n have?',
    'How do you compute 5^k modulo 1000000007 when k is around 5 * 10^14?',
    'Two remainders below 1000000007 multiply to about 10^18. Which type holds that exactly?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Every position is chosen independently: the <code>ceil(n / 2)</code> even indices have 5 options
    each and the <code>floor(n / 2)</code> odd indices have 4. The count is
    <code>5^ceil(n/2) * 4^floor(n/2)</code>, computed with fast modular exponentiation.</p>
    <h4>Why it works</h4>
    <p>No rule links two positions, so by the product rule the number of strings is the product of the
    per-position choices. Binary exponentiation squares the base and halves the exponent each step,
    multiplying the result in whenever the current exponent bit is set, which rebuilds the power from
    its binary digits. Reducing modulo 1 000 000 007 after every multiplication keeps the numbers small
    without changing the final remainder.</p>
    <h4>Complexity</h4>
    <p>O(log n) time, about 50 squaring steps per power at n = 10^15, and O(1) space. Multiplying one
    factor per position would take 10^15 steps.</p>
    <h4>Pitfall</h4>
    <p>Integer width. Two residues below the modulus multiply to about 10^18, which overflows 32 bits
    and loses precision in a double, so the products need 64-bit integers (BigInt in JavaScript).
    <code>n</code> itself is also 64-bit, so halving it with 32-bit bit operators truncates it.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'countGoodStrings',
    params: [{ name: 'n', type: 'long' }],
    returns: 'int',
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
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter n as a positive integer, for example 50.' };
    const big = BigInt(text);
    if (big < 1n || big > BigInt(MAX_N)) return { ok: false, error: 'n must be between 1 and 10^15.' };
    return { ok: true, args: [Number(big)] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
