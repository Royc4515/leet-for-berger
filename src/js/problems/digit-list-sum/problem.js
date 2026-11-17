/**
 * Problem: Digit List Sum
 *
 * Two non-negative integers are stored as linked lists of digits, least significant digit
 * first; return their sum in the same form. Grade-school addition with a carry, one node at a
 * time. The classic bugs are converting the lists to built-in integers (the numbers here have up
 * to 10^5 digits), dropping the final carry (999 + 1), and stopping when the shorter list ends.
 *
 * Linked lists cross the worker boundary as arrays ([2,4,3]); engine/adapters.js turns them
 * into ListNode objects for the user's code and back.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;

/**
 * Reference on the JSON form: digit arrays, least significant first.
 * @param {number[]} a digits of the first number
 * @param {number[]} b digits of the second number
 * @returns {number[]}
 */
export function reference(a, b) {
  const out = [];
  let carry = 0;
  for (let i = 0; i < a.length || i < b.length || carry; i++) {
    const s = (a[i] ?? 0) + (b[i] ?? 0) + carry;
    out.push(s % 10);
    carry = s >= 10 ? 1 : 0;
  }
  return out;
}

/** Seeded number with exactly `n` digits: random digits, and a non-zero most significant one. */
function randomNumber(seed, n) {
  const rnd = mulberry32(seed);
  const d = Array.from({ length: n }, () => Math.floor(rnd() * 10));
  if (n > 1 && d[n - 1] === 0) d[n - 1] = 1 + Math.floor(rnd() * 9);
  return d;
}

const visible = [
  { args: [[2, 4, 3], [5, 6, 4]], expected: [7, 0, 8], note: '342 + 465 = 807, written least significant digit first.' },
  { args: [[0], [0]], expected: [0], note: 'Zero is a single 0 node.' },
  { args: [[9, 9, 9], [1]], expected: [0, 0, 0, 1], note: '999 + 1 = 1000: the last carry becomes a new node.' },
  { args: [[1, 8], [0]], expected: [1, 8], note: 'Adding zero changes nothing; the lists may have different lengths.' },
  { args: [[5], [5]], expected: [0, 1], note: '5 + 5 = 10.' },
];

// Hidden tests: a carry that ripples through a long run of 9s, a shorter first list, a carry
// out of the shorter list's range, and at max size 10^5-digit numbers (far beyond any built-in
// integer type), including 10^5 nines plus one, where the carry travels the whole list.
const hiddenArgs = [
  [[1], [9, 9, 9, 9, 9, 9, 9, 9, 9, 9]],
  [[3], [4, 5, 6]],
  [[9, 9, 9, 9], [9, 9, 9, 9]],
  [[0], [7, 3]],
  [[6, 7], [4, 2, 1]],
  [randomNumber(3, 40), randomNumber(5, 25)],
  [Array(MAX_N).fill(9), [1]],
  [randomNumber(7, MAX_N), randomNumber(11, MAX_N)],
  [randomNumber(13, MAX_N - 1), Array(MAX_N).fill(9)],
  [randomNumber(17, 1), randomNumber(19, MAX_N)],
];

const isNumber = (d) => Array.isArray(d) && d.length >= 1 && d.length <= MAX_N && d.every((x) => Number.isInteger(x) && x >= 0 && x <= 9) && (d.length === 1 || d[d.length - 1] !== 0);

export const problem = {
  id: 'digit-list-sum',
  title: 'Digit List Sum',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Linked List', 'Carry'],
  milestone: 2,
  timeLimitMs: 2000,
  argNames: ['l1', 'l2'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given two non-empty linked lists <code>l1</code> and <code>l2</code>, each holding
    the digits of a non-negative integer in <strong>reverse order</strong>: the head is the ones
    digit, the next node the tens digit, and so on. Return the sum of the two integers as a linked
    list in the same form.</p>
    <p>Neither number has leading zeros, except the number 0 itself (a single node holding 0).
    The numbers can have up to 100,000 digits.</p>
    <p>In the examples a list is written as its values from head to tail, so <code>[2,4,3]</code>
    is the number 342.</p>
  `,
  constraints: [
    '1 <= number of nodes in each list <= 10^5',
    '0 <= Node.val <= 9',
    'Neither list has leading zeros (its last node is not 0), except the number 0 itself',
    'Target complexity: O(max(m, n)) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `l1 = ${JSON.stringify(t.args[0])}, l2 = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How do you add two numbers by hand, and in which direction do you move through the digits?',
    'The lists already start at the ones digit. What do you carry from one position to the next?',
    'What should happen when one list ends before the other?',
    'Both lists have ended. Can there still be something left to write?',
    'Could you turn each list into an integer, add, and split it back into digits? How many digits can a number here have?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'addTwoNumbers',
    params: [
      { name: 'l1', type: 'ListNode' },
      { name: 'l2', type: 'ListNode' },
    ],
    returns: 'ListNode',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, each a JSON array of digits (ones digit first).
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: l1 and l2, each a JSON array of digits, for example [2,4,3].' };
    let a;
    let b;
    try {
      a = JSON.parse(lines[0]);
      b = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be JSON arrays of digits.' };
    }
    if (!isNumber(a) || !isNumber(b)) {
      return { ok: false, error: 'Each list needs 1 to 10^5 digits from 0 to 9, and no trailing 0 unless the number is 0.' };
    }
    return { ok: true, args: [a, b] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
