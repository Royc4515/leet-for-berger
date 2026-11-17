/**
 * Problem: Power Mod
 *
 * Compute x^n modulo 1_000_000_007 for n up to 10^18. Multiplying n times is hopeless; squaring
 * halves the exponent each step (O(log n)). The traps are all about integer width: residues up to
 * 10^9 multiply to about 10^18, which overflows 32 bits and loses precision in a double, and n
 * itself needs 64 bits.
 */

import { mulberry32 } from '../../engine/rng.js';

const MOD = 1000000007n;

/**
 * Reference: binary exponentiation in BigInt, so no step can lose precision.
 * @param {number} x
 * @param {number} n
 * @returns {number} x^n mod 1_000_000_007 (with 0^0 = 1)
 */
export function reference(x, n) {
  let base = BigInt(x) % MOD;
  let e = BigInt(n);
  let result = 1n;
  while (e > 0n) {
    if (e & 1n) result = (result * base) % MOD;
    base = (base * base) % MOD;
    e >>= 1n;
  }
  return Number(result);
}

const MAX_X = 1000000000;
const MAX_N = 10n ** 18n;

// don't touch / exponents travel as JSON numbers (doubles), so every n above 2^53 in a test must be
// exactly representable and print exactly; a * 10^9 with a < 2^32 is both. The unit test checks it.
const EXACT_STEP = 1000000000;

/** A random [x, n] pair with n a multiple of 10^9 near 10^18, exact as a double (see EXACT_STEP). */
function randomCase(seed) {
  const rnd = mulberry32(seed);
  const x = 2 + Math.floor(rnd() * (MAX_X - 1));
  const a = 1 + Math.floor(rnd() * 999999999);
  return [x, a * EXACT_STEP];
}

const visible = [
  { args: [2, 10], expected: 1024, note: '2^10 = 1024, already below the modulus.' },
  { args: [3, 0], expected: 1, note: 'Anything to the power 0 is 1.' },
  { args: [2, 31], expected: 147483634, note: '2^31 = 2147483648, minus 2 * 1000000007.' },
  { args: [10, 10], expected: 999999937, note: '10^10 = 9 * 1000000007 + 999999937.' },
  { args: [123456789, 2], expected: 643499475, note: 'The square has 17 digits: it overflows 32 bits before the reduction.' },
];

// Hidden tests: 0^0 and 0^big, 1^big, n = 1 with the largest x, Fermat's little theorem
// (x^(p-1) = 1), exponents right above 2^31 and 2^32 (where 32-bit shifts break), and exponents near
// 10^18 where looping n times or a double-based pow cannot work.
const hiddenArgs = [
  [0, 0],
  [0, 1000000000000000000],
  [1, 1000000000000000000],
  [MAX_X, 1],
  [7, 1000000006],
  [2, 2147483648],
  [3, 4294967297],
  [MAX_X, 1000000000000000000],
  [999999999, 999999999000000000],
  randomCase(83),
];

export const problem = {
  id: 'power-mod',
  title: 'Power Mod',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Math', 'Fast Exponentiation'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['x', 'n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given integers <code>x</code> and <code>n</code>, return
    <code>x<sup>n</sup> mod 1000000007</code>, that is, the remainder of <code>x</code> raised to
    the power <code>n</code> when divided by 1&nbsp;000&nbsp;000&nbsp;007. By convention
    <code>0<sup>0</sup> = 1</code>.</p>
    <p>The exponent can be as large as 10<sup>18</sup>, so <code>n</code> is a 64-bit integer.
    Use integer arithmetic only: floating-point powers lose precision long before these values.</p>
  `,
  constraints: [
    '0 <= x <= 10^9',
    '0 <= n <= 10^18 (64-bit)',
    'The answer is in [0, 1000000006]',
    'Target complexity: O(log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `x = ${t.args[0]}, n = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How many multiplications does the obvious loop need when n = 10^18?',
    'If you already know x^(n/2), how do you get x^n with one or two more multiplications?',
    'How does the binary representation of n tell you which squares to multiply together?',
    'Two remainders below 1000000007 multiply to about 10^18. Which integer type holds that exactly?',
    'Why is reducing modulo 1000000007 after every multiplication allowed?',
  ],

  signature: {
    name: 'powerMod',
    params: [
      { name: 'x', type: 'int' },
      { name: 'n', type: 'long' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, x then n.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: x, then n.' };
    if (!lines.every((l) => /^\d+$/.test(l))) return { ok: false, error: 'x and n must be non-negative integers.' };
    const x = Number(lines[0]);
    if (x > MAX_X) return { ok: false, error: 'x must be at most 10^9.' };
    const big = BigInt(lines[1]);
    if (big > MAX_N) return { ok: false, error: 'n must be at most 10^18.' };
    // The runner passes n as a JSON number. Above 2^53 most integers silently round, which would
    // run the code on a different n than the one typed, so only exactly representable ones pass.
    const n = Number(big);
    if (BigInt(n) !== big || String(n) !== big.toString()) {
      return { ok: false, error: 'Above 2^53 the browser can only pass some values of n exactly, such as 10^18 or 123456789000000000. Pick one of those or a smaller n.' };
    }
    return { ok: true, args: [x, n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
