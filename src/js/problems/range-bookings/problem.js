/**
 * Problem: Range Bookings
 *
 * Many "add s to every slot from a to b" updates, then read every slot once. The canonical
 * difference array: record +s where a range starts and -s just after it ends, and one prefix sum
 * at the end turns those boundary marks into the totals. Adding each booking slot by slot is
 * O(bookings * n), about 10^10 at the limits.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_BOOKINGS = 100000;
const MAX_SEATS = 10000;

/**
 * Reference: difference array, then a running sum.
 * @param {number[][]} bookings each [first, last, seats], flights numbered from 1
 * @param {number} n number of flights
 * @returns {number[]} seats reserved on flights 1..n
 */
export function reference(bookings, n) {
  // One slot past the end, so a booking that ends on flight n needs no bounds check.
  const diff = new Array(n + 1).fill(0);
  for (const [first, last, seats] of bookings) {
    diff[first - 1] += seats;
    diff[last] -= seats;
  }
  const out = new Array(n);
  let running = 0;
  for (let i = 0; i < n; i++) {
    running += diff[i];
    out[i] = running;
  }
  return out;
}

/** `count` bookings over n flights; `rangeOf` picks [first, last] from the generator. */
function randomBookings(seed, count, n, rangeOf, seatsOf = (rnd) => 1 + Math.floor(rnd() * MAX_SEATS)) {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, () => [...rangeOf(rnd, n), seatsOf(rnd)]);
}

const anyRange = (rnd, n) => {
  const a = 1 + Math.floor(rnd() * n);
  const b = 1 + Math.floor(rnd() * n);
  return [Math.min(a, b), Math.max(a, b)];
};
const endsAtLast = (rnd, n) => [1 + Math.floor(rnd() * n), n];

const visible = [
  { args: [[[1, 2, 10], [2, 3, 20], [2, 5, 25]], 5], expected: [10, 55, 45, 25, 25], note: 'Flight 2 is covered by all three bookings: 10 + 20 + 25.' },
  { args: [[[1, 2, 10], [2, 2, 15]], 2], expected: [10, 25], note: 'A booking can cover a single flight.' },
  { args: [[[1, 1, 5]], 1], expected: [5], note: 'One flight, one booking.' },
  { args: [[[3, 3, 7]], 4], expected: [0, 0, 7, 0], note: 'Flights without bookings have 0 seats.' },
  { args: [[[1, 4, 1], [1, 4, 2]], 4], expected: [3, 3, 3, 3], note: 'Identical ranges add up.' },
];

// Hidden tests: bookings that end on the last flight (an off-by-one past the array), the largest
// seat counts (10^9 seats on one flight still fits 32 bits), and 10^5 bookings over 10^5 flights
// where adding each booking seat by seat is far too slow.
const hiddenArgs = [
  [[[1, 1, 1]], 1],
  [[[5, 5, 3]], 5],
  [[[1, 5, MAX_SEATS]], 5],
  [[[2, 3, 4], [1, 1, 1], [3, 5, 2], [5, 5, 9]], 6],
  [randomBookings(7, 100, 50, anyRange), 50],
  [randomBookings(11, 2000, 1000, anyRange), 1000],
  [randomBookings(13, MAX_BOOKINGS, MAX_N, anyRange), MAX_N],
  [Array.from({ length: MAX_BOOKINGS }, () => [1, MAX_N, MAX_SEATS]), MAX_N],
  [randomBookings(17, MAX_BOOKINGS, MAX_N, endsAtLast), MAX_N],
  [[[MAX_N, MAX_N, 1]], MAX_N],
];

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export const problem = {
  id: 'range-bookings',
  title: 'Range Bookings',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Difference Array', 'Prefix Sum'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['bookings', 'n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>An airline runs <code>n</code> flights, numbered <code>1</code> to <code>n</code>. Each
    entry <code>bookings[i] = [first, last, seats]</code> reserves <code>seats</code> seats on
    every flight from <code>first</code> to <code>last</code>, both included.</p>
    <p>Return an array of length <code>n</code> whose element at index <code>j</code> is the total
    number of seats reserved on flight <code>j + 1</code>.</p>
  `,
  constraints: [
    '1 <= n <= 10^5',
    '1 <= bookings.length <= 10^5',
    '1 <= first <= last <= n',
    '1 <= seats <= 10^4',
    'Target complexity: O(n + bookings.length) time',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `bookings = ${JSON.stringify(t.args[0])}, n = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If every booking touches up to n flights, how much work is the direct approach in the worst case?',
    'Walking from flight 1 to flight n, at which flights does the number of reserved seats actually change?',
    'Could you record each booking only where it starts and where it stops, and recover the totals later?',
    'What single pass turns those "change here" marks into the totals for every flight?',
    'Where exactly should a booking stop counting: at flight last, or just after it? What array size does that need?',
  ],

  signature: {
    name: 'corpFlightBookings',
    params: [
      { name: 'bookings', type: 'int[][]' },
      { name: 'n', type: 'int' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, bookings as a JSON array of [first, last, seats], then n.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: bookings as a JSON array of [first,last,seats], then n.' };
    let bookings;
    let n;
    try {
      bookings = JSON.parse(lines[0]);
      n = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON.' };
    }
    if (!isInt(n, 1, MAX_N)) return { ok: false, error: 'n must be an integer from 1 to 10^5.' };
    if (!Array.isArray(bookings) || bookings.length < 1 || bookings.length > MAX_BOOKINGS) return { ok: false, error: 'bookings must have 1 to 10^5 entries.' };
    for (const b of bookings) {
      if (!Array.isArray(b) || b.length !== 3 || !isInt(b[0], 1, n) || !isInt(b[1], b[0], n) || !isInt(b[2], 1, MAX_SEATS)) {
        return { ok: false, error: 'Each booking must be [first, last, seats] with 1 <= first <= last <= n and 1 <= seats <= 10^4.' };
      }
    }
    return { ok: true, args: [bookings, n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
