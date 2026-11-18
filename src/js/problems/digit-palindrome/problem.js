/**
 * Problem: Digit Palindrome
 *
 * Decide whether an integer reads the same forwards and backwards, using arithmetic only. The
 * trap is reversing the whole number: for inputs near 2^31 the reversal overflows a 32-bit int.
 * Reversing only the lower half avoids that and halves the work.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: reverse the lower half of the digits and compare with the upper half.
 * @param {number} x
 * @returns {boolean}
 */
export function reference(x) {
  // A trailing zero would need a leading zero to match; only 0 itself qualifies.
  if (x < 0 || (x % 10 === 0 && x !== 0)) return false;
  let rest = x;
  let half = 0;
  while (rest > half) {
    half = half * 10 + (rest % 10);
    rest = Math.floor(rest / 10);
  }
  // Odd digit count: the middle digit ended up in half, so drop it.
  return rest === half || rest === Math.floor(half / 10);
}

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

/** A random 9-digit palindrome; with `breakAt` >= 0 the digit there is changed so it no longer is. */
function nineDigitPalindrome(seed, breakAt = -1) {
  const rnd = mulberry32(seed);
  const left = [1 + Math.floor(rnd() * 9), ...Array.from({ length: 4 }, () => Math.floor(rnd() * 10))];
  const digits = [...left, ...left.slice(0, 4).reverse()];
  if (breakAt >= 0) digits[breakAt] = (digits[breakAt] + 1 + Math.floor(rnd() * 8)) % 10;
  return Number(digits.join(''));
}

const visible = [
  { args: [121], expected: true, note: 'Reads 121 in both directions.' },
  { args: [-121], expected: false, note: 'Backwards it reads 121-, which is not a number.' },
  { args: [10], expected: false, note: 'Backwards it reads 01.' },
  { args: [0], expected: true, note: 'A single digit is always a palindrome.' },
  { args: [12321], expected: true, note: 'Odd digit count: the middle digit pairs with itself.' },
];

// Hidden tests: single digit, zeros inside the number, the 32-bit extremes, a value whose full
// reversal overflows 32 bits, the largest 10-digit palindrome that fits, and random near-misses.
const hiddenArgs = [
  [7],
  [1001],
  [1000021],
  [1000000001],
  [INT_MAX],
  [INT_MIN],
  [1234567899],
  [2147447412],
  [nineDigitPalindrome(5)],
  [nineDigitPalindrome(9, 6)],
];

export const problem = {
  id: 'digit-palindrome',
  title: 'Digit Palindrome',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Math', 'Digit Manipulation'],
  timeLimitMs: 2000,
  argNames: ['x'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a 32-bit signed integer <code>x</code>, return <code>true</code> if its decimal digits
    read the same from left to right as from right to left, and <code>false</code> otherwise.</p>
    <p>A negative number is never a palindrome, because the minus sign only appears on the left.</p>
    <p>Work with the number itself: do not convert it to a string or an array of characters.</p>
  `,
  constraints: [
    '-2^31 <= x <= 2^31 - 1',
    'No string conversion',
    'Target complexity: O(log10 x) time, O(1) space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `x = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How do you get the last digit of a number, and how do you remove it?',
    'If you reverse the whole number, what happens for x = 1234567899 in a 32-bit int?',
    'Do you need the whole reversed number, or would half of it be enough to compare?',
    'How can you tell you have reversed exactly half of the digits?',
    'What does a number ending in 0 have to start with to be a palindrome?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Peel digits off the end of <code>x</code> and build the reverse of only the lower half. Stop
    once the reversed half is at least as large as what remains, then compare the two halves.</p>
    <h4>Why it works</h4>
    <p>Each step moves the last digit of <code>x</code> onto <code>half</code>, so <code>half</code> is
    the reversed suffix and <code>x</code> the prefix. The loop stops at the middle. With an even digit
    count a palindrome gives <code>x == half</code>; with an odd count the middle digit sits at the end
    of <code>half</code>, so compare <code>x == half / 10</code>. Negatives fail up front, and so does
    any nonzero number ending in <code>0</code>, since it would need a leading zero.</p>
    <h4>Complexity</h4>
    <p>O(log10 x) time, about half the digits are processed. O(1) space.</p>
    <h4>Pitfall</h4>
    <p>Reversing the whole number. For values near 2^31 the full reverse overflows a 32-bit integer.
    Skipping the trailing-zero check is the other trap: <code>10</code> would leave <code>x = 0</code>
    and <code>half = 1</code>, and <code>half / 10 == 0</code> wrongly reports a palindrome.</p>
  `,

  signature: {
    name: 'isPalindrome',
    params: [{ name: 'x', type: 'int' }],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one line, the integer x.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^-?\d+$/.test(text)) return { ok: false, error: 'Enter one integer, for example 121.' };
    const x = Number(text);
    if (x < INT_MIN || x > INT_MAX) return { ok: false, error: 'x must fit in a 32-bit signed integer.' };
    return { ok: true, args: [x] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
