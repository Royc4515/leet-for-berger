/**
 * Problem: Base Four Check
 *
 * Equivalent to LeetCode 342; statement and tests are written for this project. Is a signed
 * 32-bit integer exactly 4^k for some k >= 0? A power of four is a power of two whose single 1 bit
 * sits at an even position, so two bit tests decide it with no loop: n & (n - 1) == 0 for "one bit
 * only" and a mask of the even positions for "the right one".
 *
 * Classic wrong answers: stopping at the power-of-two test (2 and 8 are not powers of four),
 * testing only divisibility by 4 (12 is not a power of four), using the odd-position mask
 * 0xAAAAAAAA by mistake, and taking the absolute value (-4 is not a power of four). The sign guard
 * also keeps n - 1 from overflowing at the smallest 32-bit value.
 */

const MIN_INT = -2147483648;
const MAX_INT = 2147483647;

/**
 * Reference: positive, a single bit set, and that bit at an even position.
 * @param {number} n signed 32-bit integer
 * @returns {boolean} true when n is 4^k for some k >= 0
 */
export function reference(n) {
  // don't touch / the n > 0 guard comes first: it rejects 0 and negatives, and keeps n - 1 from
  // overflowing for the smallest int in Java, C, C++ and C#.
  return n > 0 && (n & (n - 1)) === 0 && (n & 0x55555555) !== 0;
}

const visible = [
  { args: [16], expected: true, note: '16 = 4^2.' },
  { args: [5], expected: false, note: '5 is not a power of anything.' },
  { args: [1], expected: true, note: '4^0 = 1.' },
  { args: [8], expected: false, note: '8 = 2^3 is a power of two but not of four.' },
  { args: [64], expected: true, note: '64 = 4^3.' },
];

// Hidden tests: 0, a negative power of four, the smallest and largest 32-bit values, the largest
// power of four that fits (4^15), the largest power of two that is not a power of four (2^29), a
// mid-range power of four, the mask 0x55555555 itself (many 1 bits at even positions), a negative
// multiple of a big power of four, and 4^7.
const hiddenArgs = [
  [0],
  [-4],
  [MIN_INT],
  [MAX_INT],
  [1073741824],
  [536870912],
  [268435456],
  [1431655765],
  [-1073741824],
  [16384],
];

export const problem = {
  id: 'base-four-check',
  title: 'Base Four Check',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Bit Manipulation', 'Math'],
  timeLimitMs: 1000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a signed 32-bit integer <code>n</code>. Return <code>true</code> if there is a
    whole number <code>k &gt;= 0</code> with <code>n = 4<sup>k</sup></code>, and <code>false</code>
    otherwise.</p>
    <p>Zero and negative numbers are never powers of four. Try to answer without a loop or recursion.</p>
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
    'Write 1, 4, 16, 64 and 256 in binary. What do the numbers have in common?',
    'How can you test that a number has exactly one bit set, without counting the bits?',
    'Powers of two such as 2 and 8 also have one bit. Where does that bit sit for the powers of four, and which positions are those?',
    'What constant has 1s in exactly those positions, and what does ANDing n with it tell you?',
    'Which values of n must be rejected before you compute n - 1, and why?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>A power of four is a power of two whose only 1 bit is at an even position (bit 0, 2, 4, ...).
    Check three things: <code>n &gt; 0</code>, <code>n &amp; (n - 1) == 0</code> (exactly one bit set),
    and <code>n &amp; 0x55555555 != 0</code> (that bit is one of the even positions; the constant is
    <code>0101...01</code> in binary).</p>
    <h4>Why it works</h4>
    <p><code>n - 1</code> flips the lowest 1 bit and everything below it, so ANDing with n is zero
    exactly when n had one bit. Powers of four are <code>1, 100, 10000, ...</code>, and the mask keeps
    only the even positions, so powers of two like 2, 8, 32 land on a masked-out position and fail.</p>
    <h4>Complexity</h4>
    <p>O(1) time and space: three constant-time tests on a 32-bit value. A loop that divides by 4
    works too and takes at most 16 steps.</p>
    <h4>Pitfall</h4>
    <p>Stopping at the power-of-two test accepts 2 and 8. Testing only <code>n % 4 == 0</code> accepts
    12. Mixing up the mask (<code>0xAAAAAAAA</code> marks the odd positions) flips every answer.
    Leave out the sign check and the smallest int makes <code>n - 1</code> overflow in some
    languages, and an absolute value turns -4 into a power of four.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'isPowerOfFour',
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
