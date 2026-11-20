/**
 * Problem: List Mirror
 *
 * Equivalent to LeetCode 234; statement and tests are written for this project. Does a singly
 * linked list read the same from head to tail as from tail to head? Singly linked means there is
 * no way to walk backwards, so the answer needs either an array copy (O(n) space) or, for O(1)
 * extra space, finding the middle with two pointers, reversing the second half and comparing.
 *
 * Classic wrong answers: comparing only the two ends, comparing the multiset of values (a
 * rearrangement of a palindrome is not one), and turning the digits into one number (a double
 * keeps only about 15 significant digits, and a long list overflows to infinity).
 *
 * Lists are long (10^5 nodes), so a recursive solution overflows the call stack in some languages.
 */

import { mulberry32 } from '../../engine/rng.js';
import { linkedList } from '../../engine/growth-inputs.js';

const MAX_N = 100000;

/**
 * Reference: two pointers moving inward on the array form of the list.
 * @param {number[]} values list values head to tail
 * @returns {boolean}
 */
export function reference(values) {
  for (let i = 0, j = values.length - 1; i < j; i++, j--) {
    if (values[i] !== values[j]) return false;
  }
  return true;
}

/** Seeded digits, 0 to 9. */
function randomDigits(rnd, n) {
  return Array.from({ length: n }, () => Math.floor(rnd() * 10));
}

/** A palindrome of length n built from a random first half. */
function palindrome(seed, n) {
  const rnd = mulberry32(seed);
  const half = randomDigits(rnd, Math.floor(n / 2));
  const middle = n % 2 === 1 ? [Math.floor(rnd() * 10)] : [];
  return [...half, ...middle, ...half.slice().reverse()];
}

/** The palindrome with the digit at index i changed, so exactly the pair (i, n - 1 - i) differs. */
function broken(values, i) {
  const out = values.slice();
  out[i] = (out[i] + 1) % 10;
  return out;
}

const visible = [
  { args: [[1, 2, 2, 1]], expected: true, note: 'Reads 1221 from either end.' },
  { args: [[1, 2]], expected: false, note: 'Backwards it is 2, 1.' },
  { args: [[3, 0, 3]], expected: true, note: 'An odd length: the middle node matches itself.' },
  { args: [[1, 2, 3, 1]], expected: false, note: 'The two ends agree, but the inner pair does not.' },
  { args: [[9, 9]], expected: true, note: 'Two equal nodes.' },
];

// Hidden tests: one node, all-equal values, ends equal with a wrong inside, the same multiset as
// a palindrome, a 40-digit list whose only mismatch is in the middle pair (a double cannot tell
// it from its reverse), and 10^5-node lists: palindromes of both parities, a middle mismatch and
// a mismatch right next to the ends.
const hiddenInputs = [
  [0],
  [5, 5, 5, 5, 5],
  [1, 0, 0, 1, 0],
  [1, 1, 2],
  broken(palindrome(31, 40), 19),
  palindrome(37, 1000),
  palindrome(41, MAX_N - 1),
  broken(palindrome(43, MAX_N), MAX_N / 2 - 1),
  broken(palindrome(47, MAX_N), 1),
  palindrome(53, MAX_N),
];

/** A palindrome of n digits: the comparison never finds a mismatch, so every pair is checked. */
function growthPalindrome(n, rnd) {
  const half = linkedList(Math.floor(n / 2), rnd, { min: 0, max: 9 });
  const middle = n % 2 === 1 ? [Math.floor(rnd() * 10)] : [];
  return [...half, ...middle, ...half.slice().reverse()];
}

export const problem = {
  id: 'list-mirror',
  title: 'List Mirror',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Linked List', 'Two Pointers', 'Reverse Half'],
  timeLimitMs: 2000,
  argNames: ['head'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given the <code>head</code> of a singly linked list of digits. Return
    <code>true</code> if the list reads the same from head to tail as from tail to head, and
    <code>false</code> otherwise.</p>
    <p>In the examples a list is written as its values from head to tail, so <code>[1,2,1]</code>
    means <code>1 -> 2 -> 1</code>. A node only knows its next node, so you cannot walk backwards.
    You may change the list while you work, but the answer is just the boolean.</p>
  `,
  constraints: [
    '1 <= number of nodes <= 10^5',
    '0 <= Node.val <= 9',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `head = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you could copy the values somewhere you can index from both ends, how would you check them?',
    'Without a copy: where in the list would the two halves meet, and how can two pointers find that spot in one pass?',
    'You cannot walk backwards through the second half. What operation on a list turns it around?',
    'Once the second half is reversed, what do you compare, and where does the comparison stop for odd and even lengths?',
    'Is turning the digits into one number a safe shortcut when the list has 100,000 digits?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Find the middle with a slow and a fast pointer (fast moves two steps for each of slow's one).
    Reverse the list from the middle onward, then walk the first half and the reversed second half
    together, comparing values. Any difference means the list is not a mirror.</p>
    <h4>Why it works</h4>
    <p>A palindrome is a list whose first half equals its second half read backwards. Reversing the
    second half in place makes "read backwards" something a forward walk can do, and the two walks
    run side by side until the shorter half ends. For an odd length the middle node has nothing to
    pair with and is skipped automatically, since the comparison stops when the reversed half runs
    out.</p>
    <h4>Complexity</h4>
    <p>O(n) time: one pass to find the middle, one to reverse, one to compare. O(1) extra space, a
    few pointers. Copying the values into an array is also O(n) time but uses O(n) space.</p>
    <h4>Pitfall</h4>
    <p>Comparing only the ends, or whether the values have the same counts, accepts lists that are
    not mirrors. Building one number from the digits fails twice: a double keeps about 15 digits, so
    a list that differs only in its middle can look equal to its reverse, and 100,000 digits overflow
    to infinity. A recursive version needs 100,000 stack frames.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'isMirror',
    params: [{ name: 'head', type: 'ListNode' }],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((values) => ({ args: [values], expected: reference(values) })),

  /**
   * Custom input: the list as a JSON array of digits, head first.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let values;
    try {
      values = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the list as a JSON array, for example [1,2,1].' };
    }
    if (!Array.isArray(values)) return { ok: false, error: 'The list must be a JSON array.' };
    if (values.length < 1 || values.length > MAX_N) return { ok: false, error: 'The list needs 1 to 10^5 nodes.' };
    if (!values.every((v) => Number.isInteger(v) && v >= 0 && v <= 9)) {
      return { ok: false, error: 'Values must be digits from 0 to 9.' };
    }
    return { ok: true, args: [values] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
  growth: {
    target: 'n',
    n: 'number of nodes',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000],
    input: (n, seed) => [growthPalindrome(n, mulberry32(seed))],
  },
};

export default problem;
