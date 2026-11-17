/**
 * Problem: Add Without Plus
 *
 * Add two 32-bit integers using only bitwise operations. XOR adds without carrying, AND finds
 * the columns that carry, a left shift moves each carry to the column it lands in; repeat until
 * nothing carries. The sum wraps like 32-bit two's complement hardware, which is natural in
 * Java and C#, needs unsigned types in C and C++ (signed overflow is undefined there), a uint32
 * in Go (int is 64-bit), and an explicit 32-bit mask in Python (ints never overflow).
 */

import { mulberry32 } from '../../engine/rng.js';

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

/**
 * Reference: carry propagation with JS 32-bit bitwise operators.
 * @param {number} a 32-bit signed integer
 * @param {number} b 32-bit signed integer
 * @returns {number} a + b wrapped to 32-bit two's complement
 */
export function reference(a, b) {
  let x = a | 0;
  let y = b | 0;
  // Each round moves every carry one column left, so after at most 32 rounds it falls off.
  while (y !== 0) {
    const carry = (x & y) << 1;
    x ^= y;
    y = carry;
  }
  return x;
}

/** A seeded pair of 32-bit signed integers. */
function randomPair(seed) {
  const rnd = mulberry32(seed);
  const draw = () => Math.floor(rnd() * 4294967296) + INT_MIN;
  return [draw(), draw()];
}

const visible = [
  { args: [1, 2], expected: 3, note: '01 and 10 share no bits, so nothing carries.' },
  { args: [2, 3], expected: 5, note: '10 + 11: the shared bit carries one column left.' },
  { args: [-1, 1], expected: 0, note: 'In two\'s complement -1 is all 1s; the carry ripples off the top.' },
  { args: [-5, -7], expected: -12, note: 'Two negatives.' },
  { args: [INT_MAX, 1], expected: INT_MIN, note: 'The sum does not fit, so it wraps to the smallest 32-bit value.' },
];

// Hidden tests: zero, mixed signs that cancel, overflow in both directions, the carry chain
// through all 32 bits, and seeded pairs spread over the full range.
const hiddenArgs = [
  [0, 0],
  [1000, -1000],
  [INT_MIN, -1],
  [INT_MIN, INT_MIN],
  [INT_MAX, INT_MAX],
  [0, INT_MIN],
  [1, -2],
  [123456789, -987654321],
  randomPair(7),
  randomPair(11),
];

/** Parses one line as a 32-bit signed integer, or returns null. */
function parseInt32(line) {
  if (!/^-?\d+$/.test(line)) return null;
  const v = Number(line);
  return v >= INT_MIN && v <= INT_MAX ? v : null;
}

export const problem = {
  id: 'add-without-plus',
  title: 'Add Without Plus',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Bit Manipulation', 'Carry Propagation'],
  milestone: 1,
  timeLimitMs: 1000,
  argNames: ['a', 'b'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given two 32-bit signed integers <code>a</code> and <code>b</code>. Return their
    sum <strong>without</strong> using the <code>+</code> or <code>-</code> operators (or library
    calls that add for you).</p>
    <p>Treat the numbers as 32-bit two's complement values, the way the hardware does: if the
    true sum does not fit in 32 bits, keep only the lowest 32 bits and read them as a signed
    number. For example, <code>2147483647 + 1</code> gives <code>-2147483648</code>.</p>
  `,
  constraints: [
    '-2^31 <= a, b <= 2^31 - 1',
    'The result is a + b wrapped to 32-bit two\'s complement',
    'Target complexity: O(32) bit operations',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `a = ${t.args[0]}, b = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Add two one-bit numbers by hand. Which bitwise operation gives the sum digit, and which gives the carry?',
    'Once you know which columns carry, where does each carry go, and how do you add it in?',
    'When does that process stop, and why can it not go on forever with 32 bits?',
    'In your language, what happens to a value that grows past 32 bits, or to a negative number shifted left?',
  ],

  signature: {
    name: 'getSum',
    params: [
      { name: 'a', type: 'int' },
      { name: 'b', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, a then b.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: a, then b.' };
    const a = parseInt32(lines[0]);
    const b = parseInt32(lines[1]);
    if (a === null || b === null) return { ok: false, error: 'a and b must be whole numbers from -2^31 to 2^31 - 1.' };
    return { ok: true, args: [a, b] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
