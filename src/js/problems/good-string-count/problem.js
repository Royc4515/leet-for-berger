/**
 * Problem: Good String Count
 *
 * Build strings by repeatedly appending either `zero` copies of '0' or `one` copies of '1'; count
 * the distinct results whose length lies in [low, high], modulo 1_000_000_007. Different append
 * sequences always give different strings (the first differing block differs in its first
 * character), so this is "count sequences of steps of size zero or one that sum to L", summed
 * over L. dp[L] = dp[L - zero] + dp[L - one]. When zero == one the two blocks are still different
 * strings, which a "set of step sizes" shortcut gets wrong.
 */

const MOD = 1000000007;
const MAX_HIGH = 100000;

/**
 * Reference: dp over lengths, summing the lengths in [low, high].
 * @param {number} low
 * @param {number} high
 * @param {number} zero
 * @param {number} one
 * @returns {number}
 */
export function reference(low, high, zero, one) {
  const dp = new Array(high + 1).fill(0);
  dp[0] = 1;
  let total = 0;
  for (let len = 1; len <= high; len++) {
    let ways = 0;
    if (len >= zero) ways += dp[len - zero];
    if (len >= one) ways += dp[len - one];
    dp[len] = ways % MOD;
    if (len >= low) total = (total + dp[len]) % MOD;
  }
  return total;
}

const visible = [
  { args: [3, 3, 1, 1], expected: 8, note: 'Every binary string of length 3: "000", "001", ..., "111".' },
  { args: [2, 3, 1, 2], expected: 5, note: '"00", "11", "000", "110" and "011".' },
  { args: [1, 1, 1, 1], expected: 2, note: '"0" and "1".' },
  { args: [4, 4, 3, 3], expected: 0, note: 'Every block has length 3, so no string has length exactly 4.' },
  { args: [2, 2, 2, 2], expected: 2, note: '"00" and "11" are different strings even though the blocks have the same length.' },
];

// Hidden tests: unreachable lengths, equal block sizes, a single valid length at the top, the
// full range with blocks of 1 (2^L terms, reduced modulo the prime), then high = 10^5 where
// plain recursion over choices is exponential.
const hiddenArgs = [
  [5, 5, 2, 3],
  [10, 12, 4, 4],
  [9, 10, 7, 9],
  [1, 30, 1, 1],
  [200, 200, 1, 2],
  [1, MAX_HIGH, 1, 1],
  [MAX_HIGH, MAX_HIGH, 1, 1],
  [50000, MAX_HIGH, 7, 13],
  [2, MAX_HIGH, 2, 2],
  [99000, MAX_HIGH, 317, 1000],
];

export const problem = {
  id: 'good-string-count',
  title: 'Good String Count',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Counting', 'Modular Arithmetic'],
  timeLimitMs: 2000,
  argNames: ['low', 'high', 'zero', 'one'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Start with an empty string. At each step, append either the character <code>'0'</code>
    exactly <code>zero</code> times, or the character <code>'1'</code> exactly <code>one</code>
    times. You may take any number of steps.</p>
    <p>A string built this way is <em>good</em> if its length is between <code>low</code> and
    <code>high</code>, inclusive. Return the number of <strong>distinct</strong> good strings,
    modulo <code>1000000007</code>.</p>
  `,
  constraints: [
    '1 <= low <= high <= 10^5',
    '1 <= zero, one <= low',
    'Return the count modulo 10^9 + 7',
    'Target complexity: O(high) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `low = ${t.args[0]}, high = ${t.args[1]}, zero = ${t.args[2]}, one = ${t.args[3]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Can two different sequences of steps ever build the same string? Look at the first step where they differ.',
    'So counting strings of length L is the same as counting step sequences of total length L. What was the last step?',
    'If you knew the counts for every shorter length, how would you get the count for L?',
    'Which lengths do you add to the answer, and where do you take the modulus so nothing overflows?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Different step sequences always build different strings, so count step sequences by total
    length: <code>f[i] = f[i - zero] + f[i - one]</code> with <code>f[0] = 1</code>. The answer is
    the sum of <code>f[low..high]</code>.</p>
    <h4>Why it works</h4>
    <p>Take two sequences and the first step where they differ: up to that point the strings agree,
    and then one appends <code>'0'</code> while the other appends <code>'1'</code> at the same
    position. So strings of length <code>i</code> correspond one to one with sequences whose blocks
    add up to <code>i</code>, and the last block is either <code>zero</code> zeros or
    <code>one</code> ones.</p>
    <h4>Complexity</h4>
    <p>O(high) time and O(high) space, one table entry per length. Listing the strings themselves
    grows exponentially.</p>
    <h4>Pitfall</h4>
    <p>The counts grow like Fibonacci numbers, so reduce modulo 10^9 + 7 at every table entry and at
    every addition to the running sum, not once at the end. Lengths below <code>low</code> still
    have to be computed; they are just not added to the answer.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'countGoodStrings',
    params: [
      { name: 'low', type: 'int' },
      { name: 'high', type: 'int' },
      { name: 'zero', type: 'int' },
      { name: 'one', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: four integers low, high, zero, one (spaces, commas or new lines between them).
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const parts = raw.trim().split(/[\s,]+/).filter(Boolean);
    if (parts.length !== 4 || !parts.every((p) => /^\d+$/.test(p))) return { ok: false, error: 'Enter four integers: low high zero one.' };
    const [low, high, zero, one] = parts.map(Number);
    if (low < 1 || low > high || high > MAX_HIGH) return { ok: false, error: 'Need 1 <= low <= high <= 10^5.' };
    if (zero < 1 || zero > low || one < 1 || one > low) return { ok: false, error: 'zero and one must be from 1 to low.' };
    return { ok: true, args: [low, high, zero, one] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1], args[2], args[3]),
  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). n = high, low = high / 2,
  // blocks of 2 zeros or 3 ones: the table runs over every length up to high, and the answer
  // counts lengths from low to high. The ladder passes the statement's 10^5 because one call takes
  // about a millisecond at that size.
  growth: {
    target: 'n',
    n: 'high',
    sizes: [250000, 500000, 1000000, 2000000, 4000000, 8000000],
    input: (n) => [Math.floor(n / 2), n, 2, 3],
  },
};

export default problem;
