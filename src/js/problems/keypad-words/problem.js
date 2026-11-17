/**
 * Problem: Keypad Words
 *
 * Every letter string a phone keypad could type for a digit string. The smallest useful
 * backtracking (or iterative cartesian product) exercise: one choice per digit, every
 * combination kept. Output size is the product of 3s and 4s, so the work is inherently
 * O(4^n * n); the point is building it without missing or duplicating anything.
 *
 * The order is fixed as lexicographic, which is exactly the order a depth-first search produces
 * when each digit tries its letters alphabetically.
 */

const KEYS = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' };
const MAX_LEN = 8;

/**
 * Reference: depth-first search, letters of each digit in alphabetical order.
 * @param {string} digits characters '2' to '9'
 * @returns {string[]}
 */
export function reference(digits) {
  if (digits.length === 0) return [];
  const out = [];
  const path = [];
  const dfs = (i) => {
    if (i === digits.length) {
      out.push(path.join(''));
      return;
    }
    for (const c of KEYS[digits[i]]) {
      path.push(c);
      dfs(i + 1);
      path.pop();
    }
  };
  dfs(0);
  return out;
}

const visible = [
  { args: ['23'], expected: ['ad', 'ae', 'af', 'bd', 'be', 'bf', 'cd', 'ce', 'cf'], note: '3 letters times 3 letters, in dictionary order.' },
  { args: [''], expected: [], note: 'No digits, no combinations: the result is empty, not [""].' },
  { args: ['2'], expected: ['a', 'b', 'c'], note: 'One digit: its letters.' },
  { args: ['7'], expected: ['p', 'q', 'r', 's'], note: '7 and 9 carry four letters.' },
  {
    args: ['92'],
    expected: ['wa', 'wb', 'wc', 'xa', 'xb', 'xc', 'ya', 'yb', 'yc', 'za', 'zb', 'zc'],
    note: 'The order follows the digits: the first digit varies slowest.',
  },
];

// Hidden tests: repeated digits, both four-letter keys, every key once, and the largest outputs
// (8 digits of 7 and 9 give 4^8 = 65536 strings).
const hiddenArgs = [['9'], ['22'], ['79'], ['239'], ['5555'], ['2345'], ['23456789'], ['22222222'], ['77779999'], ['99999999']];

export const problem = {
  id: 'keypad-words',
  title: 'Keypad Words',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Backtracking', 'Cartesian Product'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['digits'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>On a phone keypad each digit from 2 to 9 carries letters:
    2 = abc, 3 = def, 4 = ghi, 5 = jkl, 6 = mno, 7 = pqrs, 8 = tuv, 9 = wxyz.</p>
    <p>Given a string <code>digits</code>, return every string that can be formed by picking one
    letter for each digit, in the same order as the digits. Return them in
    <strong>lexicographic (dictionary) order</strong>. If <code>digits</code> is empty, return an
    empty list.</p>
  `,
  constraints: [
    '0 <= digits.length <= 8 (raised from the usual 4)',
    "digits[i] is a digit from '2' to '9'",
    'Output in lexicographic order',
    'Target complexity: O(4^n * n) time, the size of the output',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `digits = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For the first digit you have 3 or 4 choices. What remains to decide after you make one?',
    'Can you describe the answer for "234" in terms of the answer for "34"?',
    'If each digit tries its letters in alphabetical order, in what order do the finished strings come out?',
    'What should an empty input return: no strings, or one empty string?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'letterCombinations',
    params: [{ name: 'digits', type: 'string' }],
    returns: 'string[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: digits as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let digits;
    try {
      digits = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter digits as a JSON string, for example "23".' };
    }
    if (typeof digits !== 'string' || digits.length > MAX_LEN) return { ok: false, error: 'digits must be a string of at most 8 characters.' };
    if (!/^[2-9]*$/.test(digits)) return { ok: false, error: 'digits may only contain the characters 2 to 9.' };
    return { ok: true, args: [digits] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
