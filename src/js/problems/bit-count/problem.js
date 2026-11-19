/**
 * Problem: Bit Count
 *
 * Count the 1 bits of an unsigned 32-bit value. The input is typed as a 64-bit integer so values
 * with the top bit set (2^31 and up) are plain non-negative numbers in every language, instead of
 * showing up as negative ints in Java, C# or JavaScript bitwise code. The lesson is n & (n - 1),
 * which clears the lowest set bit, so the loop runs once per 1 bit instead of once per bit.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 4294967295; // 2^32 - 1

/**
 * Reference: clear the lowest set bit until nothing is left.
 * @param {number} n integer in [0, 2^32 - 1]
 * @returns {number} how many bits of n are 1
 */
export function reference(n) {
  // don't touch / `>>> 0` maps 2^31..2^32-1 onto the same 32 bits; `x & (x - 1)` then works on
  // the signed view and still reaches 0 after exactly popcount steps.
  let x = n >>> 0;
  let count = 0;
  while (x !== 0) {
    x &= x - 1;
    count++;
  }
  return count;
}

/** A seeded value in [lo, hi]. */
function randomIn(seed, lo, hi) {
  return lo + Math.floor(mulberry32(seed)() * (hi - lo + 1));
}

const visible = [
  { args: [11], expected: 3, note: '11 is 1011 in binary.' },
  { args: [128], expected: 1, note: '128 is a single 1 followed by seven 0s.' },
  { args: [4294967293], expected: 31, note: 'Above 2^31 the value is still an ordinary non-negative number; only bit 1 is 0.' },
  { args: [0], expected: 0, note: 'No bits set.' },
  { args: [1], expected: 1, note: 'The lowest bit alone.' },
];

// Hidden tests: all 32 bits set, only the top bit (where signed code sees a negative number or
// shifts forever), the largest signed value, alternating patterns, and seeded values across the
// range, including ones above 2^31.
const hiddenArgs = [
  [MAX_N],
  [2147483648],
  [2147483647],
  [2863311530],
  [1431655765],
  [MAX_N - 1],
  [3],
  [randomIn(7, 2147483648, MAX_N)],
  [randomIn(11, 0, 2147483647)],
  [randomIn(13, 0, MAX_N)],
];

export const problem = {
  id: 'bit-count',
  title: 'Bit Count',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Bit Manipulation'],
  timeLimitMs: 1000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an integer <code>n</code> between <code>0</code> and <code>2^32 - 1</code>.
    Think of it as an unsigned 32-bit binary number.</p>
    <p>Return how many of its 32 bits are <code>1</code> (its population count, also called its
    Hamming weight).</p>
    <p><code>n</code> is passed as a 64-bit integer so that values of <code>2^31</code> and above
    arrive as ordinary non-negative numbers in every language.</p>
  `,
  constraints: [
    '0 <= n <= 2^32 - 1 (passed as a 64-bit integer)',
    'Target complexity: O(number of 1 bits), at most 32 steps',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How can you tell whether the lowest bit of n is 1, and how do you move on to the next bit?',
    'If n is stored in a signed 32-bit type, what happens to a right shift when the top bit is set?',
    'Write n and n - 1 in binary next to each other. Which bits differ?',
    'What does n & (n - 1) remove, and how many times can you do it before n is 0?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Repeatedly apply <code>n &amp; (n - 1)</code>, which clears the lowest 1 bit, and count how many
    times you can do it before <code>n</code> reaches <code>0</code>.</p>
    <h4>Why it works</h4>
    <p>Subtracting 1 turns the lowest set bit into <code>0</code> and every <code>0</code> below it into
    <code>1</code>, leaving higher bits alone. ANDing with the original keeps the higher bits and zeroes
    everything from that lowest set bit down. Each step removes exactly one 1 bit, so the number of steps
    is the population count.</p>
    <h4>Complexity</h4>
    <p>O(k) time where k is the number of 1 bits, at most 32 steps. O(1) space. Checking every bit
    position one by one always costs 32 steps.</p>
    <h4>Pitfall</h4>
    <p>Values from <code>2^31</code> up have the top bit set. Treated as a signed 32-bit number they turn
    negative, and a loop that shifts right with sign extension or tests <code>n &gt; 0</code> never ends
    or stops early. That is why <code>n</code> arrives as a 64-bit integer; in JavaScript,
    <code>n &gt;&gt;&gt; 0</code> keeps the 32 bits unsigned.</p>
  `,

  signature: {
    name: 'hammingWeight',
    params: [{ name: 'n', type: 'long' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one integer, for example 11.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter n as a non-negative whole number, for example 11.' };
    const n = Number(text);
    if (n > MAX_N) return { ok: false, error: 'n must be at most 2^32 - 1 (4294967295).' };
    return { ok: true, args: [n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
