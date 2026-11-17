/**
 * Problem: Prime Count
 *
 * Count the primes below n. Testing each number by trial division is fine for small n and far too
 * slow at 5 * 10^6; the Sieve of Eratosthenes crosses out multiples instead and runs in
 * O(n log log n). The usual slips: counting n itself, and crossing out from 2p instead of p * p.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: Sieve of Eratosthenes.
 * @param {number} n
 * @returns {number} how many primes p satisfy p < n
 */
export function reference(n) {
  if (n < 3) return 0;
  const composite = new Uint8Array(n);
  let count = 0;
  for (let p = 2; p < n; p++) {
    if (composite[p]) continue;
    count++;
    for (let q = p * p; q < n; q += p) composite[q] = 1;
  }
  return count;
}

const MAX_N = 5000000;

const visible = [
  { args: [10], expected: 4, note: 'The primes below 10 are 2, 3, 5 and 7.' },
  { args: [0], expected: 0, note: 'There are no primes below 0.' },
  { args: [2], expected: 0, note: '2 is prime but not below 2.' },
  { args: [3], expected: 1, note: 'Only 2.' },
  { args: [100], expected: 25, note: 'There are 25 primes below 100.' },
];

// Hidden tests: n = 1, n itself prime (must not be counted), squares of primes (where sieving
// from p * p matters), the 1000th prime plus one, and n near 5 * 10^6 where trial division is too slow.
const rnd = mulberry32(71);
const hiddenArgs = [
  [1],
  [5],
  [49],
  [121],
  [7920],
  [1000000],
  [4000000 + Math.floor(rnd() * 1000000)],
  [4999999],
  [MAX_N],
  [4999963],
];

export const problem = {
  id: 'prime-count',
  title: 'Prime Count',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Math', 'Sieve'],
  milestone: 1,
  timeLimitMs: 3000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer <code>n</code>, return how many prime numbers are strictly less than
    <code>n</code>.</p>
    <p>A prime is an integer greater than 1 whose only positive divisors are 1 and itself.</p>
  `,
  constraints: [
    '0 <= n <= 5 * 10^6',
    'Target complexity: O(n log log n) time, O(n) space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How long does checking one number for primality take, and how many numbers are there?',
    'Once you know 3 is prime, what do you learn about 6, 9, 12 and so on?',
    'If you mark the multiples of each prime, which numbers are still unmarked at the end?',
    'When crossing out multiples of p, which ones were already crossed out by smaller primes?',
    'Do you need to sieve with primes larger than the square root of n?',
  ],

  signature: {
    name: 'countPrimes',
    params: [{ name: 'n', type: 'int' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one line, the integer n.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter one non-negative integer, for example 10.' };
    const n = Number(text);
    if (n > MAX_N) return { ok: false, error: 'n must be at most 5 * 10^6.' };
    return { ok: true, args: [n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
