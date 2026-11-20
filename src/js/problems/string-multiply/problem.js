/**
 * Problem: String Multiply
 *
 * Multiply two non-negative integers given as decimal strings, without big-integer libraries.
 * The numbers are far too long for any machine integer, so this is grade-school multiplication:
 * digit i times digit j lands at position i + j + 1, and carries are settled at the end.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: digit-by-digit long multiplication into a positional array.
 * @param {string} num1
 * @param {string} num2
 * @returns {string}
 */
export function reference(num1, num2) {
  if (num1 === '0' || num2 === '0') return '0';
  const m = num1.length;
  const n = num2.length;
  const pos = new Array(m + n).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const sum = pos[i + j + 1] + (num1.charCodeAt(i) - 48) * (num2.charCodeAt(j) - 48);
      pos[i + j + 1] = sum % 10;
      pos[i + j] += Math.floor(sum / 10);
    }
  }
  // The product of an m-digit and an n-digit number has m + n or m + n - 1 digits.
  return (pos[0] === 0 ? pos.slice(1) : pos).join('');
}

const MAX_LEN = 1000;

/** A random number with exactly `len` digits and no leading zero. */
function randomNumber(seed, len) {
  const rnd = mulberry32(seed);
  let s = String(1 + Math.floor(rnd() * 9));
  for (let i = 1; i < len; i++) s += String(Math.floor(rnd() * 10));
  return s;
}

const visible = [
  { args: ['2', '3'], expected: '6', note: 'Single digits.' },
  { args: ['123', '456'], expected: '56088', note: '123 * 456 = 56088.' },
  { args: ['0', '52'], expected: '0', note: 'Zero times anything is "0", with no extra zeros.' },
  { args: ['999', '999'], expected: '998001', note: 'Carries ripple through every position.' },
  { args: ['100', '100'], expected: '10000', note: 'Trailing zeros are part of the answer.' },
];

// Hidden tests: both inputs "0", a long number times "0" (no leading zeros in the answer), "1"
// as identity, products past 64 bits, and 1000-digit inputs (random, all nines, powers of ten).
const hiddenArgs = [
  ['0', '0'],
  ['1', randomNumber(41, 300)],
  [randomNumber(43, MAX_LEN), '0'],
  ['99999999999', '99999999999'],
  ['18446744073709551616', '18446744073709551616'],
  [randomNumber(47, 500), '7'],
  [randomNumber(53, MAX_LEN), randomNumber(59, MAX_LEN)],
  ['9'.repeat(MAX_LEN), '9'.repeat(MAX_LEN)],
  ['1' + '0'.repeat(MAX_LEN - 1), '1' + '0'.repeat(MAX_LEN - 1)],
  [randomNumber(61, MAX_LEN), randomNumber(67, 999)],
];

export const problem = {
  id: 'string-multiply',
  title: 'String Multiply',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Math', 'Simulation'],
  timeLimitMs: 3000,
  argNames: ['num1', 'num2'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You get two non-negative integers <code>num1</code> and <code>num2</code> written as
    decimal strings. Return their product, also as a decimal string with no leading zeros
    (the product zero is written <code>"0"</code>).</p>
    <p>The numbers can be up to 1000 digits long, far beyond any built-in integer type. Do the
    arithmetic yourself: do not use a big-integer library or type (such as <code>BigInt</code>,
    Java's <code>BigInteger</code> or C#'s <code>System.Numerics</code>), and do not convert
    the whole input to a number.</p>
  `,
  constraints: [
    '1 <= num1.length, num2.length <= 1000',
    'num1 and num2 contain only digits 0-9',
    'Neither number has leading zeros, except the number "0" itself',
    'No big-integer libraries or types',
    'Target complexity: O(m * n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `num1 = ${JSON.stringify(t.args[0])}, num2 = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How did you multiply two multi-digit numbers on paper in school?',
    'If digit i of num1 and digit j of num2 are multiplied, which position of the product does the result belong to?',
    'How many digits can the product have at most?',
    'Can you add all the partial products into one array and deal with carries as you go?',
    'What should happen to leading zeros, and what if one input is "0"?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Do long multiplication into an array <code>pos</code> of <code>m + n</code> digits. The product
    of digit <code>i</code> of <code>num1</code> and digit <code>j</code> of <code>num2</code> belongs
    at position <code>i + j + 1</code>, counting from the most significant end, and carries move one
    position left.</p>
    <h4>Why it works</h4>
    <p>Digit <code>i</code> carries weight 10^(m-1-i) and digit <code>j</code> weight 10^(n-1-j), so
    their product has weight 10^(m+n-2-i-j), which is slot <code>i + j + 1</code> in an array of length
    <code>m + n</code>. For each <code>i</code>, the inner loop runs right to left, keeps each slot a
    single digit and pushes the overflow into the carry, and the final carry lands at slot
    <code>i</code>. The product of an m-digit and an n-digit number has at most <code>m + n</code>
    digits, so nothing is lost.</p>
    <h4>Complexity</h4>
    <p>O(m * n) time, one step per pair of digits. O(m + n) space for the result.</p>
    <h4>Pitfall</h4>
    <p>Leading zeros. The top slot can be <code>0</code> and must be dropped, and when either input is
    <code>"0"</code> the product would be all zeros, so return <code>"0"</code> directly.</p>
  `,

  signature: {
    name: 'multiply',
    params: [
      { name: 'num1', type: 'string' },
      { name: 'num2', type: 'string' },
    ],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, each a JSON string of digits, for example "123" then "456".
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines, each a JSON string, for example "123" then "456".' };
    let nums;
    try {
      nums = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'Both lines must be JSON strings in double quotes.' };
    }
    for (const s of nums) {
      if (typeof s !== 'string' || !s.length || s.length > MAX_LEN) return { ok: false, error: 'Each number must be a string of 1 to 1000 digits.' };
      if (!/^(0|[1-9]\d*)$/.test(s)) return { ok: false, error: 'Use digits only, with no leading zeros (except "0" itself).' };
    }
    return { ok: true, args: nums };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Both numbers have n
  // digits (no leading zero, no zero factor), so the schoolbook loop runs all n * n digit products.
  growth: {
    target: 'n^2',
    n: 'num1.length (num2.length the same)',
    sizes: [500, 1000, 2000, 4000, 8000],
    input: (n, seed) => {
      const rng = mulberry32(seed);
      const digits = () => {
        const d = new Array(n);
        d[0] = 1 + Math.floor(rng() * 9);
        for (let i = 1; i < n; i++) d[i] = Math.floor(rng() * 10);
        return d.join('');
      };
      return [digits(), digits()];
    },
  },
};

export default problem;
