/**
 * Problem: Two Power Check
 *
 * Equivalent to LeetCode 231 (Power of Two); statement and tests are written for this project.
 * Is a signed 32-bit integer exactly 2^k for some k >= 0? A positive power of two has exactly one
 * 1 bit, and n & (n - 1) clears the lowest 1 bit, so the test is n > 0 && (n & (n - 1)) == 0.
 *
 * Classic wrong answers: leaving out the sign check (0 passes the bit test, and the smallest
 * 32-bit value -2^31 has one bit set too), testing n % 2 == 0 (6 is even), taking the absolute
 * value (-8 is not a power of two), and a float log2 test that rounds 2^29 + 1 or similar values.
 */

const MIN_INT = -2147483648;
const MAX_INT = 2147483647;

/**
 * Reference: positive and exactly one bit set.
 * @param {number} n signed 32-bit integer
 * @returns {boolean} true when n is 2^k for some k >= 0
 */
export function reference(n) {
  // don't touch / n > 0 comes first: 0 passes the bit test, -2^31 has a single bit too, and in
  // Java, C, C++ and C# n - 1 overflows for the smallest int.
  return n > 0 && (n & (n - 1)) === 0;
}

const visible = [
  { args: [1], expected: true, note: '2^0 = 1.' },
  { args: [16], expected: true, note: '16 = 2^4.' },
  { args: [6], expected: false, note: '6 is even but 6 = 2 * 3, so it is not a power of two.' },
  { args: [0], expected: false, note: 'No power of two is zero.' },
  { args: [1024], expected: true, note: '1024 = 2^10.' },
];

// Hidden tests: the smallest 32-bit value (one bit set, but negative), -1 (every bit set), the
// largest 32-bit value, the largest power of two that fits (2^30), 2^30 + 1, 2^30 - 1 (thirty 1
// bits), a negative power of two, an odd prime, 2^29 + 2^28 (two bits), and 2^17.
const hiddenArgs = [
  [MIN_INT],
  [-1],
  [MAX_INT],
  [1073741824],
  [1073741825],
  [1073741823],
  [-8],
  [3],
  [805306368],
  [131072],
];

export const problem = {
  id: 'two-power-check',
  title: 'Two Power Check',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Bit Manipulation', 'Math'],
  timeLimitMs: 1000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a signed 32-bit integer <code>n</code>. Return <code>true</code> if there is a
    whole number <code>k &gt;= 0</code> with <code>n = 2<sup>k</sup></code>, and <code>false</code>
    otherwise.</p>
    <p>Zero and negative numbers are never powers of two. Try to answer without a loop or recursion.</p>
  `,
  constraints: [
    '-2^31 <= n <= 2^31 - 1',
    'Target complexity: O(1) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Write 1, 2, 4, 8 and 16 in binary. What do they have in common?',
    'What happens to the bits of a number when you subtract 1 from it?',
    'So what is n & (n - 1) for a number with exactly one 1 bit, and for a number with two?',
    'Which inputs pass that bit test without being powers of two? Think about 0 and the most negative 32-bit value.',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>A power of two is a <code>1</code> followed by zeros in binary: exactly one bit is set. Subtracting 1
    turns the lowest 1 bit into a 0 and every bit below it into a 1, so <code>n &amp; (n - 1)</code> clears
    the lowest 1 bit. It is zero exactly when n had a single bit.</p>
    <h4>Why it works</h4>
    <p>If n has one bit, clearing it leaves 0. If n has two or more, a higher bit survives and the result is
    non-zero. The check <code>n &gt; 0</code> removes the two values that fool the bit test: 0 (no bits at
    all) and <code>-2<sup>31</sup></code>, whose only set bit is the sign bit.</p>
    <h4>Complexity</h4>
    <p>O(1) time and space. Dividing by 2 while the number is even also works and takes at most 31 steps.</p>
    <h4>Pitfall</h4>
    <p>Without the sign check the smallest int passes, and in Java, C, C++ and C# computing
    <code>n - 1</code> for it overflows. Checking only that n is even accepts 6. A floating-point
    <code>log2</code> can round a value next to a power of two onto it.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'isPowerOfTwo',
    params: [{ name: 'n', type: 'int' }],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one integer, for example 16.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^-?\d+$/.test(text)) return { ok: false, error: 'Enter n as a whole number, for example 16.' };
    const n = Number(text);
    if (n < MIN_INT || n > MAX_INT) return { ok: false, error: 'n must fit in a signed 32-bit integer (-2147483648 to 2147483647).' };
    return { ok: true, args: [n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
