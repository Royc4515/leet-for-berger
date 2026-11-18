/**
 * Problem: Fibonacci Mod
 *
 * F(n) modulo 1_000_000_007. The textbook recursion F(n) = F(n - 1) + F(n - 2) makes about
 * 1.6^n calls, hopeless beyond n = 45. Memoizing it fixes the time but recurses n deep, which
 * overflows the call stack long before n = 10^6. Carrying the last two values forward in a loop
 * is O(n) time and O(1) space.
 *
 * Limits are raised from the usual n <= 30 to n <= 10^6, with the modulus keeping every value
 * small, so that only the iterative (or a logarithmic matrix / fast-doubling) solution passes.
 */

import { mulberry32 } from '../../engine/rng.js';

const MOD = 1000000007;

/**
 * Reference: iterate, keeping F(i - 1) and F(i) reduced modulo 1_000_000_007.
 * @param {number} n
 * @returns {number}
 */
export function reference(n) {
  let prev = 0;
  let cur = 1;
  if (n === 0) return 0;
  for (let i = 2; i <= n; i++) {
    // Both values are below MOD, so the sum stays far below 2^53 and is exact.
    const next = (prev + cur) % MOD;
    prev = cur;
    cur = next;
  }
  return cur;
}

const MAX_N = 1000000;

/** A seeded n in [lo, hi]. */
function randomN(seed, lo, hi) {
  const rnd = mulberry32(seed);
  return lo + Math.floor(rnd() * (hi - lo + 1));
}

const visible = [
  { args: [2], expected: 1, note: 'F(2) = F(1) + F(0) = 1 + 0.' },
  { args: [3], expected: 2, note: 'F(3) = F(2) + F(1) = 1 + 1.' },
  { args: [10], expected: 55, note: '0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55.' },
  { args: [0], expected: 0, note: 'F(0) = 0 by definition.' },
  { args: [50], expected: 586268941, note: 'F(50) = 12586269025, which is larger than the modulus: reduce as you go.' },
];

// Hidden tests: F(1), the first value past 32 bits (F(47)), the first index where the modulus
// matters, values where naive recursion already takes billions of calls, and n near 10^6 where a
// memoized recursion runs out of stack.
const hiddenArgs = [
  [1],
  [30],
  [45],
  [47],
  [90],
  [1000],
  [randomN(251, 10000, 99999)],
  [MAX_N],
  [MAX_N - 1],
  [randomN(257, 500000, MAX_N)],
];

export const problem = {
  id: 'fibonacci-mod',
  title: 'Fibonacci Mod',
  difficulty: 'Easy',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Iteration', 'Math'],
  timeLimitMs: 2000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>The Fibonacci numbers are defined by <code>F(0) = 0</code>, <code>F(1) = 1</code> and
    <code>F(n) = F(n - 1) + F(n - 2)</code> for <code>n &gt;= 2</code>.</p>
    <p>Given <code>n</code>, return <code>F(n) mod 1000000007</code>.</p>
    <p><code>n</code> can be as large as 10<sup>6</sup>. The plain recursion makes an
    exponential number of calls, and a recursion that is a million calls deep overflows the
    stack in most languages.</p>
  `,
  constraints: [
    '0 <= n <= 10^6',
    'The answer is in [0, 1000000006]',
    'Target complexity: O(n) time, O(1) space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Draw the calls the plain recursion makes for F(5). Which values are computed more than once?',
    'If you store every value once it is computed, how deep does the recursion still go for n = 10^6?',
    'To compute F(i), which earlier values do you actually need?',
    'Why is it safe to take the remainder after every addition instead of only at the end?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Each Fibonacci number needs only the two before it, so walk forward from <code>F(0)</code> and
    <code>F(1)</code> in a loop, keeping just the last two values and reducing modulo
    <code>1000000007</code> after every addition.</p>
    <h4>Why it works</h4>
    <p>After <code>i</code> iterations the pair <code>(a, b)</code> holds <code>F(i)</code> and
    <code>F(i + 1)</code> modulo the prime, so after <code>n</code> iterations <code>a</code> is the
    answer. Taking the remainder early is safe because <code>(x + y) mod m</code> equals
    <code>((x mod m) + (y mod m)) mod m</code>, so the final remainder is unchanged.</p>
    <h4>Complexity</h4>
    <p>O(n) time, one addition per step. O(1) space. The plain recursion makes about 1.6^n calls, and a
    memoized recursion is O(n) time but n frames deep.</p>
    <h4>Pitfall</h4>
    <p>Memoized recursion looks correct but overflows the call stack at <code>n = 10^6</code>. Skipping the
    reduction until the end fails differently: the values have hundreds of thousands of digits, which
    overflows fixed-width integers and makes big-integer languages very slow. Also handle
    <code>n = 0</code>, which should return <code>0</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'fibonacciMod',
    params: [{ name: 'n', type: 'int' }],
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
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter n as a non-negative integer, for example 10.' };
    const n = Number(text);
    if (n > MAX_N) return { ok: false, error: 'n must be at most 10^6.' };
    return { ok: true, args: [n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
