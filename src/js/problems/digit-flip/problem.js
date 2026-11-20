/**
 * Problem: Digit Flip
 *
 * Write the digits of a signed 32-bit integer in the opposite order and keep the sign. If the
 * flipped number no longer fits in 32 bits the answer is 0. Peeling digits with % 10 and / 10
 * builds the result one step at a time; the point of the problem is that the intermediate result
 * can leave the 32-bit range, so the range has to be checked (or a wider type used) in every
 * language. The input and output are plain `int`; everything stays below 2^53, so JavaScript
 * numbers are exact, and the other languages widen to 64 bits for the loop.
 */

import { mulberry32 } from '../../engine/rng.js';

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

/**
 * Reference: peel the last digit of |x| and append it to the result, then restore the sign and
 * range-check once at the end (a 10-digit result is below 10^10, exact in a double).
 * @param {number} x integer in [-2^31, 2^31 - 1]
 * @returns {number} x with its digits reversed, or 0 if that leaves the 32-bit range
 */
export function reference(x) {
  let rest = Math.abs(x);
  let flipped = 0;
  while (rest > 0) {
    flipped = flipped * 10 + (rest % 10);
    rest = Math.floor(rest / 10);
  }
  if (x < 0) flipped = -flipped;
  if (flipped < INT_MIN || flipped > INT_MAX) return 0;
  // Negating a flipped 0 gives -0, which deepEqual would tell apart from 0; normalize it.
  return flipped === 0 ? 0 : flipped;
}

/** A seeded integer in [lo, hi]. */
function randomIn(seed, lo, hi) {
  return lo + Math.floor(mulberry32(seed)() * (hi - lo + 1));
}

const visible = [
  { args: [123], expected: 321, note: 'The digits 1, 2, 3 read backwards.' },
  { args: [-123], expected: -321, note: 'The sign stays with the number.' },
  { args: [120], expected: 21, note: 'The trailing zero becomes a leading zero and vanishes.' },
  { args: [0], expected: 0, note: 'Zero stays zero.' },
  { args: [1534236469], expected: 0, note: 'The flipped value 9646324351 does not fit in 32 bits.' },
];

// Hidden tests: both extremes of the input range (each flips to 10 digits above the limit), a
// flip that lands exactly inside the range (2147483641, for each sign), one just past it, a
// palindrome at the limit, a small number with many zeros, and seeded values with 9 and 10 digits.
const hiddenArgs = [
  [INT_MAX],
  [INT_MIN],
  [1463847412],
  [-1463847412],
  [1563847412],
  [-1563847412],
  [2147447412],
  [900000],
  [randomIn(7, 100000000, 999999999)],
  [-randomIn(11, 1000000000, INT_MAX)],
];

export const problem = {
  id: 'digit-flip',
  title: 'Digit Flip',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Math', 'Overflow Handling'],
  timeLimitMs: 1000,
  argNames: ['x'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a signed 32-bit integer <code>x</code>. Return the integer you get by writing
    the digits of <code>x</code> in the opposite order, keeping its sign. Leading zeros of the result
    do not matter (<code>120</code> becomes <code>21</code>).</p>
    <p>If the flipped number is outside the signed 32-bit range
    <code>[-2^31, 2^31 - 1]</code>, return <code>0</code>.</p>
    <p>Work as if your language had no integer wider than 32 bits for the answer: the check for
    going out of range is part of the task.</p>
  `,
  constraints: [
    '-2^31 <= x <= 2^31 - 1',
    'Target complexity: O(log x), one step per digit',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `x = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How can you read the last digit of a number, and how can you remove it?',
    'If you already hold the flipped digits so far, what do you do to make room for the next digit?',
    'How does the sign behave when you do these steps on a negative number in your language?',
    'The result can need more than 32 bits. How can you notice that before it breaks, or avoid the problem altogether?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Take the last digit with <code>x % 10</code>, drop it with <code>x / 10</code>, and append it to the
    result with <code>result = result * 10 + digit</code>. Repeat until nothing is left, then check the
    range.</p>
    <h4>Why it works</h4>
    <p>Each step moves one digit from the end of <code>x</code> to the end of the result, so the
    digits arrive in the opposite order. The number has at most 10 digits, so the loop runs at most
    10 times. The flipped value of a 10-digit number is below <code>10^10</code>, which a 64-bit integer
    holds exactly; with 32-bit arithmetic only, test <code>result</code> against
    <code>INT_MAX / 10</code> before each multiplication instead.</p>
    <h4>Complexity</h4>
    <p>O(number of digits) time, at most 10 steps, and O(1) space.</p>
    <h4>Pitfall</h4>
    <p>Skipping the range check returns a number that is not a valid answer (in Java or C++ it silently
    wraps around; in Python or JavaScript it is simply too large). <code>-2147483648</code> has no
    positive counterpart, so taking <code>-x</code> or <code>abs(x)</code> in 32-bit arithmetic overflows
    too. Both the positive and the negative limit need checking.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'flipDigits',
    params: [{ name: 'x', type: 'int' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one integer, for example -123.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^-?\d+$/.test(text)) return { ok: false, error: 'Enter x as a whole number, for example -123.' };
    const x = Number(text);
    if (x < INT_MIN || x > INT_MAX) return { ok: false, error: 'x must fit in a signed 32-bit integer (-2147483648 to 2147483647).' };
    return { ok: true, args: [x] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
