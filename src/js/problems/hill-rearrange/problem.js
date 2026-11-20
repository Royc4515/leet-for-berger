/**
 * Problem: Hill Rearrange
 *
 * Read 1 as a step up and 0 as a step down. A "hill" is a non-empty walk that ends where it
 * started and never goes below its start (the same as: equal counts, and no prefix with more 0s
 * than 1s). A move swaps two neighboring substrings that are each a hill; find the lexicographically
 * largest string reachable.
 *
 * Every hill splits uniquely into top-level hills (cut each time the height returns to 0), and
 * each top-level hill is 1 + (a hill) + 0. Moves can reorder the top-level pieces freely and act
 * inside each piece independently, so: rearrange the inside of every piece recursively, then put
 * the pieces in descending order. Descending order of whole pieces is the largest concatenation
 * because pieces are prefix-free (no piece is a prefix of another, as each ends exactly when its
 * height first returns to 0).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 1000;

/**
 * Is `s` a hill: non-empty, never below its start, ending at its start.
 * @param {string} s
 * @returns {boolean}
 */
export function isHill(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h += s[i] === '1' ? 1 : -1;
    if (h < 0) return false;
  }
  return s.length > 0 && h === 0;
}

/**
 * Reference: split into top-level hills, rearrange inside each, sort the pieces descending.
 * @param {string} s a hill
 * @returns {string}
 */
export function reference(s) {
  const pieces = [];
  let h = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    h += s[i] === '1' ? 1 : -1;
    if (h === 0) {
      pieces.push('1' + reference(s.slice(start + 1, i)) + '0');
      start = i + 1;
    }
  }
  pieces.sort().reverse();
  return pieces.join('');
}

/** A seeded hill of exactly n characters (n even). `up` is the chance of stepping up when free. */
function randomHill(seed, n, up) {
  const rnd = mulberry32(seed);
  const out = [];
  let h = 0;
  for (let i = 0; i < n; i++) {
    const left = n - i;
    if (h === left) {
      out.push('0');
      h--;
    } else if (h === 0 || (rnd() < up && h + 1 <= left - 1)) {
      out.push('1');
      h++;
    } else {
      out.push('0');
      h--;
    }
  }
  return out.join('');
}

const visible = [
  { args: ['11011000'], expected: '11100100', note: 'Inside the outer hill, 10 and 1100 swap to give 1100 then 10: 1 + 110010 + 0.' },
  { args: ['10'], expected: '10', note: 'The smallest hill has nothing to swap.' },
  { args: ['101100'], expected: '110010', note: 'The pieces 10 and 1100 swap, putting the taller hill first.' },
  { args: ['1100'], expected: '1100', note: 'One piece with 10 inside: only one hill to move, so nothing changes.' },
  { args: ['1011010010'], expected: '1101001010', note: 'Three pieces 10, 110100 and 10: the biggest comes first, the equal ones keep their text.' },
];

// Hidden tests: equal pieces, a swap at the top, a swap one level down, then small and medium
// random hills and five at 1000 characters: the deepest hill, the flattest, two random walks and
// ten equal mountains.
const hiddenArgs = [
  ['1010101010'],
  ['10101100'],
  ['1110010100'],
  [randomHill(5, 30, 0.5)],
  [randomHill(6, 60, 0.5)],
  ['1'.repeat(500) + '0'.repeat(500)],
  ['10'.repeat(500)],
  [randomHill(7, MAX_LEN, 0.5)],
  [randomHill(8, MAX_LEN, 0.7)],
  [('1'.repeat(50) + '0'.repeat(50)).repeat(10)],
];

export const problem = {
  id: 'hill-rearrange',
  title: 'Hill Rearrange',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Recursion', 'Divide and Conquer', 'Sorting'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Read a binary string as a walk: <code>1</code> goes one step up and <code>0</code> one step
    down. A <strong>hill</strong> is a non-empty piece of walk that ends at the height where it
    started and never goes below that height. For example <code>10</code>, <code>1100</code> and
    <code>101100</code> are hills; <code>01</code> and <code>1000</code> are not.</p>
    <p>You are given a string <code>s</code> that is itself a hill. In one move you pick two
    neighboring substrings of <code>s</code>, each of which is a hill, and swap their places. You may
    make any number of moves.</p>
    <p>Return the lexicographically largest string you can end up with.</p>
  `,
  constraints: [
    '2 <= s.length <= 1000',
    's consists of 0 and 1 and is a hill',
    'Target complexity: O(n^2) time in the worst case (a deeply nested hill), O(n) extra space per level',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Walk along s and track the height. Where does the string split into hills that sit side by side?',
    'What does each of those top-level hills look like at its two ends, and what is left in the middle?',
    'Are moves inside one hill able to affect the others? What does that say about solving the middle first?',
    'Once every piece is as large as it can be on its own, in which order should the pieces be placed?',
    'Is it enough to compare whole pieces as strings, or can one piece be a prefix of another?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Cut the string into top-level hills: scan with a height counter and cut each time it returns
    to 0. Every piece has the form <code>1</code> + hill + <code>0</code>. Rearrange the inner hill
    recursively, wrap it again, then sort the pieces from largest to smallest and join them.</p>
    <h4>Why it works</h4>
    <p>Swapping neighboring hills can reorder the top-level pieces in any way, and it can also
    reorder pieces inside a piece without touching the outside, so the two levels are independent.
    Making each piece as large as possible first, and then ordering pieces by descending text, gives
    the largest total. No piece is a prefix of another (each ends exactly when its height first hits
    0), so comparing whole pieces never has a tie to break by what follows.</p>
    <h4>Complexity</h4>
    <p>O(n^2) time in the worst case: every level re-slices its piece and sorts it, and a hill like
    <code>111000</code> nests n/2 levels deep. Recursion depth is at most n/2.</p>
    <h4>Pitfall</h4>
    <p>Sorting only the top-level pieces is not enough: the hills inside each piece must be improved
    too, as in <code>11011000</code>. Also strip the outer <code>1</code> and <code>0</code> before
    recursing, or the recursion never gets smaller.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'rearrangeHills',
    params: [{ name: 's', type: 'string' }],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the string as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the string as JSON, for example "11011000".' };
    }
    if (typeof s !== 'string' || s.length < 2 || s.length > MAX_LEN) return { ok: false, error: 'Enter a string of 2 to 1000 characters.' };
    if (!/^[01]+$/.test(s)) return { ok: false, error: 'Use only the characters 0 and 1.' };
    if (!isHill(s)) return { ok: false, error: 'The string must be a hill: equal numbers of 1 and 0, and no prefix with more 0s than 1s.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
