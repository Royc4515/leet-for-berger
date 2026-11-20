/**
 * Problem: Zero By Powers
 *
 * Equivalent to LeetCode 2571 with a larger limit; statement and tests are written for this
 * project. Starting from n, each step adds or subtracts one power of two; return the fewest steps
 * to reach 0. Reading n in binary, a lone 1 is removed by one subtraction, but a run of 1s is
 * cheaper as one addition that carries through the run (111 is 1000 - 1), so the greedy rule
 * looks at the two lowest bits.
 *
 * Classic wrong answers: counting the 1 bits (7 costs 2, not 3) and always subtracting the
 * largest power of two that fits (7 becomes 3, then 1, then 0). Searching over the values
 * (BFS or memoised recursion over n +- 2^k) is correct but the state space explodes at 10^9.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 1000000000;

/**
 * Reference: peel bits from the bottom; a 1 below another 1 is better carried than cleared.
 * @param {number} n integer in [1, 10^9]
 * @returns {number} fewest +-2^k steps from n to 0
 */
export function reference(n) {
  let steps = 0;
  while (n > 0) {
    if (n & 1) {
      // don't touch / ...11 is the end of a run of 1s: +1 clears the whole run with one carry.
      // n === 3 is a tie (3 - 1 - 2 or 3 + 1 - 4), so the shared rule is safe. n + 1 <= 10^9 + 1 fits an int.
      n += (n & 3) === 3 ? 1 : -1;
      steps++;
    }
    n >>= 1;
  }
  return steps;
}

/** A seeded value in [lo, hi]. */
function randomIn(seed, lo, hi) {
  return lo + Math.floor(mulberry32(seed)() * (hi - lo + 1));
}

const visible = [
  { args: [39], expected: 3, note: '39 = 32 + 8 - 1: add 1, subtract 8, subtract 32.' },
  { args: [7], expected: 2, note: 'Add 1 to reach 8, then subtract 8. Removing the three 1 bits one by one costs 3.' },
  { args: [1], expected: 1, note: 'One subtraction.' },
  { args: [12], expected: 2, note: '12 = 8 + 4, two subtractions.' },
  { args: [29], expected: 3, note: '29 = 32 - 4 + 1 needs three steps; there are four 1 bits.' },
];

// Hidden tests: 2 (a lone power), the maximum 10^9 and its neighbor, 29 ones in a row, the
// alternating pattern 1010...10, 2^29 (a power of two near the top), a short run with a gap,
// and three seeded values of different sizes.
const hiddenArgs = [
  [2],
  [MAX_N],
  [MAX_N - 1],
  [536870911],
  [715827882],
  [536870912],
  [95],
  [randomIn(7, 1, MAX_N)],
  [randomIn(11, 1, 1000)],
  [randomIn(13, 500000000, MAX_N)],
];

export const problem = {
  id: 'zero-by-powers',
  title: 'Zero By Powers',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Bit Manipulation', 'Greedy'],
  timeLimitMs: 1000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a positive integer <code>n</code>. In one step you may add any power of two to
    it or subtract any power of two from it (<code>1, 2, 4, 8, ...</code>), and you may use the same
    power again.</p>
    <p>Return the fewest steps that turn <code>n</code> into <code>0</code>. Intermediate values may
    go above <code>n</code>.</p>
  `,
  constraints: [
    '1 <= n <= 10^9',
    'Target complexity: O(log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Write n in binary. What does a single subtraction of a power of two do to the bits?',
    'For n = 7, how many steps does it take to clear the 1 bits one at a time, and is there a shorter route that goes above 7?',
    'When two or more 1 bits sit side by side, what happens to the whole run if you add the lowest power of two in it?',
    'Look only at the two lowest bits of n. For each of the four patterns, what is the cheapest single step?',
    'After one step the lowest bit is 0 and can be dropped. What loop does that give you, and how many times does it run?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Work through the bits from the lowest. A 0 bit costs nothing: shift it away. A 1 bit costs one
    step, and the question is only whether to subtract it or to add it. If the next bit is also 1
    (the lowest two bits are <code>11</code>), add 1: the carry turns the whole run of 1s into a single
    1 higher up, which a later step can remove. If the next bit is 0 (<code>01</code>), subtract 1.</p>
    <h4>Why it works</h4>
    <p>A run of k ones costs k steps if cleared one by one, but only 2 steps as
    <code>2^k - 1</code>: add one, then subtract <code>2^k</code>. Whenever the lowest two bits are
    <code>11</code> the carry is never worse; the case <code>n = 3</code> ties and either choice
    gives 2.</p>
    <h4>Complexity</h4>
    <p>O(log n) time, O(1) space: each iteration drops one bit.</p>
    <h4>Pitfall</h4>
    <p>Counting the 1 bits gives 3 for 7 instead of 2. Always subtracting the largest power of two
    that fits is no better: 7 becomes 3, then 1, then 0. Trying every value reachable from n by
    adding and subtracting powers of two is correct but hopeless near 10^9, so the bit pattern has to
    decide.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'minSteps',
    params: [{ name: 'n', type: 'int' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one integer, for example 39.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter n as a positive whole number, for example 39.' };
    const n = Number(text);
    if (n < 1 || n > MAX_N) return { ok: false, error: 'n must be between 1 and 10^9.' };
    return { ok: true, args: [n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
