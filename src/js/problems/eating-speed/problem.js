/**
 * Problem: Eating Speed
 *
 * The slowest constant speed that finishes every pile within h hours. Hours needed only go down
 * as the speed goes up, so "can she finish at speed k?" flips from no to yes exactly once, and
 * binary search on the answer finds the flip in O(n log maxPile) instead of trying every speed.
 *
 * The total hours at a slow speed can reach 10^4 * 10^9 = 10^13, beyond 32 bits, which the
 * hidden tests exercise (and summing in a 32-bit int silently wraps).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 10000;
const MAX_PILE = 1000000000;
const MAX_H = 1000000000;

/**
 * Hours needed at speed k. Plain doubles are exact here: the total stays below 2^53.
 * @param {number[]} piles
 * @param {number} k
 */
function hoursAt(piles, k) {
  let total = 0;
  for (const p of piles) total += Math.ceil(p / k);
  return total;
}

/**
 * Reference: smallest k in [1, max pile] with hoursAt(k) <= h, by binary search.
 * @param {number[]} piles
 * @param {number} h
 * @returns {number}
 */
export function reference(piles, h) {
  let lo = 1;
  let hi = Math.max(...piles);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (hoursAt(piles, mid) <= h) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** Seeded pile sizes in [lo, hi]. */
function randomPiles(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[3, 6, 7, 11], 8], expected: 4, note: 'At 4 per hour: 1 + 2 + 2 + 3 = 8 hours. At 3 per hour it takes 10.' },
  { args: [[30, 11, 23, 4, 20], 5], expected: 30, note: 'One hour per pile, so the speed must cover the largest pile.' },
  { args: [[30, 11, 23, 4, 20], 6], expected: 23, note: 'One spare hour lets the pile of 30 take two hours at 23 per hour.' },
  { args: [[5], 100], expected: 1, note: 'Speed 1 already finishes in time; she never eats faster than needed.' },
  { args: [[9, 9], 5], expected: 5, note: 'At 4 per hour each pile takes 3 hours (6 in total); at 5 per hour, 2 + 2 = 4.' },
];

// Hidden tests: a single huge pile, speed 1 being enough, h equal to n, and 10^4 piles of up to
// 10^9 where trying speeds one by one would take ages and where 32-bit hour sums overflow.
const hiddenArgs = [
  [[1000000000], 2],
  [[312884470], 968709470],
  [[1, 1, 1, 999999999], 4],
  [[2, 2], 2],
  [[805306368, 805306368, 805306368], 1000000000],
  [randomPiles(7, 500, 1, 1000), 2000],
  [new Array(MAX_N).fill(MAX_PILE), MAX_H],
  [new Array(MAX_N).fill(MAX_PILE), MAX_H - 1],
  [randomPiles(11, MAX_N, 1, MAX_PILE), MAX_N + 12345],
  [randomPiles(13, MAX_N, 1, MAX_PILE), 987654321],
];

export const problem = {
  id: 'eating-speed',
  title: 'Eating Speed',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Binary Search on Answer'],
  timeLimitMs: 3000,
  argNames: ['piles', 'h'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>There are <code>piles.length</code> piles of bananas; pile <code>i</code> holds
    <code>piles[i]</code> bananas. Each hour, Koko picks one pile and eats up to <code>k</code>
    bananas from it. If the pile has fewer than <code>k</code> left, she finishes it and waits
    out the rest of that hour; she never moves to another pile within the same hour.</p>
    <p>Return the smallest whole number <code>k</code> that lets her finish all the piles within
    <code>h</code> hours.</p>
  `,
  constraints: [
    '1 <= piles.length <= 10^4',
    'piles.length <= h <= 10^9',
    '1 <= piles[i] <= 10^9',
    'Total hours at a slow speed can exceed 2^31: sum them in 64 bits',
    'Target complexity: O(n log(max pile)) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `piles = ${JSON.stringify(t.args[0])}, h = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Given a speed k, how many hours does one pile take? And all of them?',
    'If speed k is fast enough, is k + 1 also fast enough? What does that say about the answers?',
    'What are the smallest and largest speeds that could ever be the answer?',
    'At speed 1 with 10^4 piles of 10^9, how big is the hour count, and does it fit in your integer type?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'minEatingSpeed',
    params: [
      { name: 'piles', type: 'int[]' },
      { name: 'h', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: piles as a JSON array, then h, one per line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter piles on line 1 and h on line 2.' };
    let piles;
    let h;
    try {
      piles = JSON.parse(lines[0]);
      h = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter piles as a JSON array and h as an integer, for example [3,6,7,11] then 8.' };
    }
    if (!Array.isArray(piles) || piles.length < 1 || piles.length > MAX_N) return { ok: false, error: 'piles must have 1 to 10^4 elements.' };
    if (!piles.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_PILE)) return { ok: false, error: 'Each pile must be an integer from 1 to 10^9.' };
    if (!Number.isInteger(h) || h < piles.length || h > MAX_H) return { ok: false, error: 'h must be an integer from piles.length to 10^9.' };
    return { ok: true, args: [piles, h] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
