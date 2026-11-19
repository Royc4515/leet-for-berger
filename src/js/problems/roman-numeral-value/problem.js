/**
 * Problem: Roman Numeral Value
 *
 * Convert a Roman numeral to an integer. Adding symbol values left to right is almost right; the
 * whole problem is noticing when a symbol is followed by a larger one and must be subtracted.
 */

import { mulberry32 } from '../../engine/rng.js';

const VALUES = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

/**
 * Reference: a symbol smaller than its right neighbour is subtracted, any other is added.
 * @param {string} s
 * @returns {number}
 */
export function reference(s) {
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const v = VALUES[s[i]];
    total += i + 1 < s.length && v < VALUES[s[i + 1]] ? -v : v;
  }
  return total;
}

// Standard form only: this is what makes every numeral map to exactly one value in 1..3999.
const CANONICAL = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

/**
 * Writes n (1..3999) as a standard Roman numeral; used for generated tests.
 * @param {number} n
 * @returns {string}
 */
export function toRoman(n) {
  const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, sym] of table) {
    while (n >= v) {
      out += sym;
      n -= v;
    }
  }
  return out;
}

const visible = [
  { args: ['III'], expected: 3, note: 'Three ones.' },
  { args: ['LVIII'], expected: 58, note: 'L = 50, V = 5, III = 3.' },
  { args: ['MCMXCIV'], expected: 1994, note: 'M = 1000, CM = 900, XC = 90, IV = 4.' },
  { args: ['IV'], expected: 4, note: 'I before V is subtracted.' },
  { args: ['IX'], expected: 9, note: 'I before X is subtracted.' },
];

// Hidden tests: the smallest and largest values, every subtractive pair on its own, the longest
// standard numeral (15 symbols), pairs back to back, and random numerals.
const rnd = mulberry32(31);
const hiddenArgs = [
  ['I'],
  ['MMMCMXCIX'],
  ['XL'],
  ['XC'],
  ['CDXLIV'],
  ['CM'],
  ['MMMDCCCLXXXVIII'],
  ['XLIX'],
  [toRoman(1 + Math.floor(rnd() * 3999))],
  [toRoman(1 + Math.floor(rnd() * 3999))],
];

export const problem = {
  id: 'roman-numeral-value',
  title: 'Roman Numeral Value',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Math', 'String Scan'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Roman numerals use seven symbols: <code>I</code> = 1, <code>V</code> = 5,
    <code>X</code> = 10, <code>L</code> = 50, <code>C</code> = 100, <code>D</code> = 500 and
    <code>M</code> = 1000. Symbols are normally written from largest to smallest and their values
    are added, so <code>XII</code> is 12.</p>
    <p>Six combinations use subtraction instead: when a smaller symbol sits directly before a larger
    one, the smaller one is subtracted. These are <code>IV</code> (4), <code>IX</code> (9),
    <code>XL</code> (40), <code>XC</code> (90), <code>CD</code> (400) and <code>CM</code> (900).</p>
    <p>Given a valid numeral <code>s</code> in this standard form, return its integer value.</p>
  `,
  constraints: [
    '1 <= s.length <= 15',
    's contains only I, V, X, L, C, D and M',
    's is a valid standard Roman numeral for a value from 1 to 3999',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you just add every symbol, which inputs come out wrong, and by how much?',
    'Looking at one symbol, what tells you it belongs to a subtractive pair?',
    'Do you need to look further than the next symbol?',
    'Would scanning from right to left make the decision simpler?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Scan left to right and look only at the next symbol. If the current symbol is worth less than
    the one after it, subtract its value; otherwise add it.</p>
    <h4>Why it works</h4>
    <p>In a standard numeral, symbols appear from largest to smallest except in the six subtractive
    pairs, and in each pair the smaller symbol sits directly before the larger one. So "smaller than
    my right neighbour" identifies exactly the left half of a pair. Subtracting it and then adding its
    partner gives, for example, <code>-1 + 5 = 4</code> for <code>IV</code>, the value the pair
    stands for.</p>
    <h4>Complexity</h4>
    <p>O(n) time, one comparison per symbol. O(1) space for the fixed table of seven values.</p>
    <h4>Pitfall</h4>
    <p>Reading past the end: the last symbol has no right neighbour and is always added, so guard the
    lookahead with <code>i + 1 &lt; n</code>. Comparing with the previous symbol instead of the next
    one also works, but then you must undo the earlier addition, which is easy to get wrong by a
    factor of two.</p>
  `,

  signature: {
    name: 'romanToInt',
    params: [{ name: 's', type: 'string' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one line, the numeral as a JSON string, for example "MCMXCIV".
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the numeral as a JSON string in double quotes, for example "XIV".' };
    }
    if (typeof s !== 'string' || !s.length || s.length > 15) return { ok: false, error: 's must be a string of 1 to 15 symbols.' };
    if (!CANONICAL.test(s)) return { ok: false, error: 's must be a standard Roman numeral from 1 to 3999.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
