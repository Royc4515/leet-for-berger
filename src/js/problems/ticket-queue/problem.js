/**
 * Problem: Ticket Queue
 *
 * People queue for tickets, one ticket per turn, rejoining the back until they are done. How long
 * until a given person finishes? Small inputs invite a literal simulation; at these limits the
 * point is to see what the simulation computes and count it directly: everyone ahead buys up to
 * t[k] tickets, everyone behind up to t[k] - 1.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: closed form.
 * @param {number[]} tickets
 * @param {number} k
 * @returns {number} seconds until person k has all their tickets
 */
export function reference(tickets, k) {
  const target = tickets[k];
  let total = 0;
  for (let i = 0; i < tickets.length; i++) total += Math.min(tickets[i], i <= k ? target : target - 1);
  return total;
}

const MAX_N = 100000;
const MAX_T = 1000000000;

function randomTickets(seed, n, maxT) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => 1 + Math.floor(rnd() * maxT));
}

const visible = [
  { args: [[2, 3, 2], 2], expected: 6, note: 'Turns go 0,1,2,0,1,2: person 2 finishes at second 6.' },
  { args: [[5, 1, 1, 1], 0], expected: 8, note: 'The others leave after one turn; person 0 then buys alone.' },
  { args: [[1], 0], expected: 1, note: 'Alone in the queue.' },
  { args: [[1, 1, 1], 1], expected: 2, note: 'Everyone needs one ticket; person 1 is second.' },
  { args: [[4, 4, 4], 2], expected: 12, note: 'Last in line among equals finishes last.' },
];

// Hidden tests: the target first and last in line, people behind who need more than the target,
// 32-bit overflow (answers near 10^14), and 10^9 tickets where simulating each turn is far too slow.
const big = randomTickets(11, MAX_N, MAX_T);
const hiddenArgs = [
  [[3, 1, 5], 0],
  [[1, 9, 9, 9], 0],
  [[7, 2, 9, 1], 3],
  [[MAX_T, MAX_T], 1],
  [[3, 8, 3, 8, 3], 2],
  [randomTickets(7, 1000, 1000), 500],
  [big, MAX_N - 1],
  [big, 0],
  [Array(MAX_N).fill(MAX_T), MAX_N - 1],
  [randomTickets(13, MAX_N, 100), 77777],
];

export const problem = {
  id: 'ticket-queue',
  title: 'Ticket Queue',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Simulation', 'Counting'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['tickets', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>People stand in a line to buy tickets; person <code>i</code> wants <code>tickets[i]</code>
    of them. Each second, the person at the front buys exactly one ticket. If they still need more,
    they go to the back of the line; otherwise they leave.</p>
    <p>Return how many seconds pass until person <code>k</code> (0-indexed, in the starting line)
    has bought all of their tickets.</p>
  `,
  constraints: [
    '1 <= tickets.length <= 10^5',
    '1 <= tickets[i] <= 10^9',
    '0 <= k < tickets.length',
    'The answer can exceed 32 bits; return a 64-bit integer',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `tickets = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Simulate a few seconds by hand. With tickets up to 10^9, how many seconds would a simulation take?',
    'When person k buys their last ticket, how many tickets has each person ahead of them bought?',
    'Is the answer different for someone standing behind person k?',
    'What is the largest possible answer, and does it fit in a 32-bit integer?',
  ],

  signature: {
    name: 'timeToBuy',
    params: [
      { name: 'tickets', type: 'int[]' },
      { name: 'k', type: 'int' },
    ],
    returns: 'long',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, tickets (JSON array) then k.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: tickets as a JSON array, then k.' };
    let tickets;
    let k;
    try {
      tickets = JSON.parse(lines[0]);
      k = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON.' };
    }
    if (!Array.isArray(tickets) || tickets.length < 1 || tickets.length > MAX_N) return { ok: false, error: 'tickets must have 1 to 10^5 entries.' };
    if (!tickets.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_T)) return { ok: false, error: 'Each entry must be an integer from 1 to 10^9.' };
    if (!Number.isInteger(k) || k < 0 || k >= tickets.length) return { ok: false, error: 'k must be a valid index.' };
    return { ok: true, args: [tickets, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
