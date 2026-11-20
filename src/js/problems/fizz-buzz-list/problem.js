/**
 * Problem: Fizz Buzz List
 *
 * Equivalent to LeetCode 412 with a larger limit (n up to 10^5, so the answer is a long array of
 * strings); statement and tests are written for this project. A warm-up: label 1..n with
 * "Fizz" for multiples of 3, "Buzz" for multiples of 5 and "FizzBuzz" for both, otherwise the
 * number as text. The only trap is the order of the checks: the multiple-of-both case has to be
 * decided before either single case, or built from both parts.
 *
 * Classic wrong answers: testing 3 and then 5 with else-if (15 becomes "Fizz"), starting at 0 or
 * stopping at n - 1, and returning numbers instead of strings for the plain positions.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;

/**
 * Reference: build each label from the words its divisors earn.
 * @param {number} n integer in [1, 10^5]
 * @returns {string[]} labels for 1..n
 */
export function reference(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    // don't touch / appending both words (not an else-if chain) is what makes 15 "FizzBuzz".
    let label = '';
    if (i % 3 === 0) label += 'Fizz';
    if (i % 5 === 0) label += 'Buzz';
    out.push(label || String(i));
  }
  return out;
}

/** A seeded value in [lo, hi]. */
function randomIn(seed, lo, hi) {
  return lo + Math.floor(mulberry32(seed)() * (hi - lo + 1));
}

const visible = [
  { args: [3], expected: ['1', '2', 'Fizz'], note: '3 is the first multiple of 3.' },
  { args: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'], note: '5 is the first multiple of 5.' },
  { args: [15], expected: reference(15), note: '15 is a multiple of both 3 and 5, so it reads FizzBuzz.' },
  { args: [1], expected: ['1'], note: 'The smallest input has one plain number.' },
  { args: [10], expected: reference(10), note: 'Buzz appears at 5 and again at 10.' },
];

// Hidden tests: n = 2 (no word yet), 14 (just before the first FizzBuzz), 16 (just after), 30 and
// 45 (several FizzBuzz), 100, a seeded mid-size value, and three sizes at the top of the range:
// 99999, 99991 and 100000, where the last label is Buzz.
const hiddenArgs = [
  [2],
  [14],
  [16],
  [30],
  [45],
  [100],
  [randomIn(7, 1000, 50000)],
  [99999],
  [99991],
  [MAX_N],
];

export const problem = {
  id: 'fizz-buzz-list',
  title: 'Fizz Buzz List',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Simulation', 'Modular Arithmetic'],
  timeLimitMs: 1000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a positive integer <code>n</code>, produce one label for each number from
    <code>1</code> to <code>n</code>, in order, and return them as an array of strings:</p>
    <ul>
      <li><code>"FizzBuzz"</code> if the number is divisible by both <code>3</code> and <code>5</code></li>
      <li><code>"Fizz"</code> if it is divisible by <code>3</code> only</li>
      <li><code>"Buzz"</code> if it is divisible by <code>5</code> only</li>
      <li>otherwise the number itself written as a string, such as <code>"7"</code></li>
    </ul>
    <p>The array has exactly <code>n</code> entries, and entry <code>i - 1</code> labels the number
    <code>i</code>.</p>
  `,
  constraints: [
    '1 <= n <= 10^5',
    'Every entry is a string, including the plain numbers',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How do you test whether one number is divisible by another?',
    'Which number is the first to need the word FizzBuzz, and what would your checks print for it?',
    'Does the order in which you test the three cases matter? What goes wrong if you test 3 before testing both?',
    'Could you build the label from two independent pieces instead of choosing between four branches?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Loop from 1 to n. For each number, start with an empty label, add <code>Fizz</code> if it is a
    multiple of 3, add <code>Buzz</code> if it is a multiple of 5, and fall back to the number as text
    when the label is still empty.</p>
    <h4>Why it works</h4>
    <p>The two checks are independent, so a multiple of both collects both words in order and reads
    <code>FizzBuzz</code> with no extra case. The four outcomes of the statement are exactly the four
    combinations of the two checks.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(n) space for the output. This is a warm-up: the only thing to get right is the
    check order and the off-by-one at both ends of the range.</p>
    <h4>Pitfall</h4>
    <p>An else-if chain that tests 3 first, then 5, then 15 never reaches the 15 branch, so 15 prints
    <code>Fizz</code>. Starting the loop at 0 gives a leading <code>FizzBuzz</code> and a shifted
    list, and stopping at <code>n - 1</code> drops the last label.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'fizzBuzzList',
    params: [{ name: 'n', type: 'int' }],
    returns: 'string[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one integer, for example 15.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter n as a positive whole number, for example 15.' };
    const n = Number(text);
    if (n < 1 || n > MAX_N) return { ok: false, error: 'n must be between 1 and 10^5.' };
    return { ok: true, args: [n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
