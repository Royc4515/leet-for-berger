/**
 * Problem: Stair Paths
 *
 * Count the ways to climb n steps taking 1 or 2 at a time: ways(n) = ways(n - 1) + ways(n - 2),
 * the Fibonacci numbers. LeetCode stops at n = 45 so the answer fits in an int; here n goes up to
 * 10^6 and the count is returned modulo 1_000_000_007. That rules out naive recursion (exponential)
 * and memoized recursion (10^6 frames deep), and the sum must be reduced before it overflows.
 */

const MOD = 1000000007;
const MAX_N = 1000000;

/**
 * Reference: iterate the recurrence, reducing every step.
 * @param {number} n
 * @returns {number} number of ways modulo 1_000_000_007
 */
export function reference(n) {
  let a = 1; // ways(0)
  let b = 1; // ways(1)
  for (let i = 2; i <= n; i++) [a, b] = [b, (a + b) % MOD];
  return b;
}

const visible = [
  { args: [2], expected: 2, note: '1 + 1 or 2.' },
  { args: [3], expected: 3, note: '1 + 1 + 1, 1 + 2 or 2 + 1.' },
  { args: [1], expected: 1, note: 'A single step.' },
  { args: [10], expected: 89, note: 'Each count is the sum of the two before it.' },
  { args: [45], expected: 836311896, note: 'There are 1836311903 ways, which is 836311896 after reducing modulo 1000000007.' },
];

// Hidden tests: small n, the first counts past 2^31 and past the modulus, then large n where only
// a linear loop with a reduction at every step works.
const hiddenArgs = [[4], [44], [46], [80], [1000], [12345], [100000], [500000], [999999], [MAX_N]];

export const problem = {
  id: 'stair-paths',
  title: 'Stair Paths',
  difficulty: 'Easy',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Fibonacci', 'Modular Arithmetic'],
  timeLimitMs: 2000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A staircase has <code>n</code> steps. With each move you climb either <code>1</code> or
    <code>2</code> steps. Two climbs are different if their sequences of moves differ.</p>
    <p>Return the number of different ways to reach the top. The count grows very fast, so return it
    <strong>modulo</strong> <code>1000000007</code>.</p>
  `,
  constraints: [
    '1 <= n <= 10^6 (raised from LeetCode\'s 45)',
    'Return the count modulo 10^9 + 7',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Think about the very last move of a climb. What can it be, and where were you standing before it?',
    'So how does the count for n relate to the counts for smaller staircases?',
    'Plain recursion recomputes the same staircases many times. How many distinct ones are there?',
    'Two counts below 10^9 + 7 add up to about 2 * 10^9. Does that still fit in a 32-bit int, and when should you reduce?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'climbStairs',
    params: [{ name: 'n', type: 'int' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: n as a single integer.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter n as a positive integer, for example 10.' };
    const n = Number(text);
    if (n < 1 || n > MAX_N) return { ok: false, error: 'n must be from 1 to 10^6.' };
    return { ok: true, args: [n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
