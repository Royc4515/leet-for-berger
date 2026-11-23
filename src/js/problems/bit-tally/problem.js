/**
 * Problem: Bit Tally
 *
 * Equivalent to LeetCode 338 (Counting Bits); statement and tests are written for this project.
 * Return the number of 1 bits of every integer from 0 to n. Dropping the lowest bit of i gives
 * i >> 1, a smaller number whose count is already known, so tally[i] = tally[i >> 1] + (i & 1)
 * fills the whole table in one pass with no per-number bit loop.
 *
 * Classic wrong answers: an array of length n instead of n + 1 (the count for n itself is
 * missing), tally[i] = tally[i - 1] + 1 (counts up like a counter and ignores carries), and a
 * table that starts at 1 instead of 0. The per-number bit loop is correct but O(n log n).
 */

const MAX_N = 100000;

/**
 * Reference: each count from the count of i with its lowest bit dropped.
 * @param {number} n
 * @returns {number[]} the number of 1 bits of 0, 1, ..., n
 */
export function reference(n) {
  const tally = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) tally[i] = tally[i >> 1] + (i & 1);
  return tally;
}

const visible = [
  { args: [2], expected: [0, 1, 1], note: '0 has no 1 bits, 1 = 1 and 2 = 10 have one each.' },
  { args: [5], expected: [0, 1, 1, 2, 1, 2], note: '3 = 11 and 5 = 101 have two 1 bits; 4 = 100 has one.' },
  { args: [0], expected: [0], note: 'Only the number 0 itself, with no 1 bits.' },
  { args: [8], expected: [0, 1, 1, 2, 1, 2, 2, 3, 1], note: '7 = 111 has three 1 bits; 8 = 1000 drops back to one.' },
  { args: [1], expected: [0, 1], note: 'The table always holds n + 1 counts.' },
];

// Hidden tests: the largest n, the largest n minus one, the powers of two 2^16 and 2^16 - 1 (where
// the count jumps from 16 ones down to one), 1023 (ten ones at the end), a mid value, two small
// odd values, 3 and the first value with three 1 bits.
const hiddenArgs = [[MAX_N], [MAX_N - 1], [65536], [65535], [1023], [54321], [17], [31], [3], [7]];

export const problem = {
  id: 'bit-tally',
  title: 'Bit Tally',
  difficulty: 'Easy',
  topics: ['dp'],
  patterns: ['Bit Manipulation', 'Dynamic Programming'],
  timeLimitMs: 1000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a non-negative integer <code>n</code>, return an array <code>tally</code> of length
    <code>n + 1</code> where <code>tally[i]</code> is the number of <code>1</code> bits in the binary form
    of <code>i</code>, for every <code>i</code> from <code>0</code> to <code>n</code>.</p>
    <p>Counting the bits of each number one bit at a time works. Can you fill the table in a single pass,
    with constant work per number?</p>
  `,
  constraints: [
    '0 <= n <= 10^5',
    'Target complexity: O(n)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Write 0 to 8 in binary next to their counts. Do you see counts repeating?',
    'What number do you get when you drop the last binary digit of i? Is it bigger or smaller than i?',
    'If you already know the count for i with its last digit dropped, what do you add to get the count for i?',
    'How long does the whole table need to be, and what is the count for 0?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Shifting <code>i</code> right by one drops its lowest binary digit and gives <code>i &gt;&gt; 1</code>,
    which is smaller than <code>i</code>, so its count is already in the table. The dropped digit is
    <code>i &amp; 1</code>. So <code>tally[i] = tally[i &gt;&gt; 1] + (i &amp; 1)</code>, filled from 1 up to n
    with <code>tally[0] = 0</code>.</p>
    <h4>Why it works</h4>
    <p>The 1 bits of <code>i</code> are the 1 bits of <code>i &gt;&gt; 1</code> plus possibly its last bit, and
    nothing else. Another rule works too: <code>tally[i] = tally[i &amp; (i - 1)] + 1</code>, because
    <code>i &amp; (i - 1)</code> is <code>i</code> with its lowest 1 bit cleared.</p>
    <h4>Complexity</h4>
    <p>O(n) time, and the output itself is the only O(n) space. Counting every number bit by bit is
    O(n log n).</p>
    <h4>Pitfall</h4>
    <p>The table has <code>n + 1</code> entries, not <code>n</code>. Adding one to the previous count is wrong
    as soon as a carry happens: 4 = 100 has fewer 1 bits than 3 = 11.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'countBits',
    params: [{ name: 'n', type: 'int' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one integer from 0 to 10^5.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter n as a whole number from 0 to 10^5, for example 5.' };
    const n = Number(text);
    if (n > MAX_N) return { ok: false, error: 'n must be at most 10^5.' };
    return { ok: true, args: [n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
