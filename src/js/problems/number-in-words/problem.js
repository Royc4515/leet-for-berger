/**
 * Problem: Number in Words
 *
 * Equivalent to LeetCode 273 (Integer to English Words); statement and tests are written for this
 * project. Convert a non-negative 32-bit integer into its standard English words representation.
 * Splitting the number into 3-digit groups (ones, thousands, millions, billions) lets one small
 * helper handle every value from 1 to 999 while skipping zero groups cleanly.
 *
 * Classic wrong answers: returning "" instead of "Zero" for 0, emitting a scale word for a zero
 * middle group (e.g. "One Million Thousand Ten" for 1,000,010), leaving trailing or double spaces
 * on exact tens or hundreds (20, 100, 1000), and inserting British "and" or hyphens.
 */

const MAX_NUM = 2147483647;

const BELOW_20 = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const SCALES = ['', 'Thousand', 'Million', 'Billion'];

/**
 * Reference: split into base-1000 chunks, spell each non-zero chunk with one 1..999 helper,
 * and append its scale word.
 * @param {number} num
 * @returns {string}
 */
export function reference(num) {
  if (num === 0) return 'Zero';

  const spellUnder1000 = (n) => {
    const words = [];
    if (n >= 100) {
      words.push(BELOW_20[Math.floor(n / 100)], 'Hundred');
      n %= 100;
    }
    if (n >= 20) {
      words.push(TENS[Math.floor(n / 10)]);
      n %= 10;
    }
    if (n > 0) words.push(BELOW_20[n]);
    return words.join(' ');
  };

  const parts = [];
  let scale = 0;
  let rem = num;
  while (rem > 0) {
    const chunk = rem % 1000;
    if (chunk > 0) {
      const text = spellUnder1000(chunk);
      parts.push(SCALES[scale] ? `${text} ${SCALES[scale]}` : text);
    }
    rem = Math.floor(rem / 1000);
    scale++;
  }
  return parts.reverse().join(' ');
}

const visible = [
  { args: [123], expected: 'One Hundred Twenty Three', note: 'Single three-digit group with hundreds, tens, and ones.' },
  { args: [12345], expected: 'Twelve Thousand Three Hundred Forty Five', note: 'Two groups: 12 thousands and 345 ones.' },
  { args: [1234567], expected: 'One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven', note: 'Three groups across millions, thousands, and ones.' },
  { args: [0], expected: 'Zero', note: 'Zero is the only input that emits the word "Zero".' },
  { args: [1000010], expected: 'One Million Ten', note: 'The zero thousands group is omitted completely.' },
];

// Hidden tests target every boundary: 1, upper teen 19, exact ten 20, exact hundred 100,
// exact scale boundaries (10^3, 10^5, 10^6, 10^9), skipped middle groups, and INT_MAX.
const hiddenArgs = [
  [1],
  [19],
  [20],
  [100],
  [1000],
  [100000],
  [1000000],
  [1000000000],
  [2000000019],
  [MAX_NUM],
];

export const problem = {
  id: 'number-in-words',
  title: 'Number in Words',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Recursion', 'Math', 'String'],
  timeLimitMs: 2000,
  argNames: ['num'],

  statementHtml: `
    <p>Given a non-negative 32-bit integer <code>num</code>, return its standard English words
    representation.</p>
    <p>Use American scale names (<code>Thousand</code>, <code>Million</code>, <code>Billion</code>),
    title-case every word, and separate words with a single space. Do not include <code>"and"</code>,
    commas, hyphens, or leading/trailing spaces.</p>
  `,
  constraints: [
    '0 <= num <= 2^31 - 1 (2,147,483,647)',
    'Words are title-cased and separated by single spaces, with no "and" or hyphens',
    'Target complexity: O(1) time and space (at most 4 three-digit groups)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `num = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  hints: [
    'English repeats the same naming pattern every three digits. What are the scale labels for each 3-digit chunk?',
    'If you write one small helper that spells any integer from 1 to 999, how does the full solution use it?',
    'Inside 1..999, why do numbers below 20 need a separate lookup table from 20..99?',
    'What should happen when a middle 3-digit chunk is 0, as in 1,000,010?',
    'How can you join words without accidentally leaving double spaces or a trailing space?',
  ],

  explanationHtml: `
    <h4>Idea</h4>
    <p>English numbers are grouped in base 1000: ones, thousands, millions, and billions. Write one
    helper that converts any integer from <code>1</code> to <code>999</code> into words, peel off
    <code>num % 1000</code> in a loop, skip zero chunks, and attach the matching scale word.</p>
    <h4>Why it works</h4>
    <p>A 32-bit signed integer has at most 10 digits, so it splits into at most four chunks. Inside
    <code>1..999</code>, the hundreds digit uses <code>1..9 + "Hundred"</code>, and the remaining
    <code>0..99</code> either comes directly from the <code>1..19</code> table or combines a tens
    word (<code>Twenty..Ninety</code>) with a ones word.</p>
    <h4>Complexity</h4>
    <p>O(1) time and O(1) space: there are at most 4 three-digit chunks and under 20 words in the
    output.</p>
    <h4>Pitfall</h4>
    <p>Two common bugs are spacing and zero groups: emitting <code>"Thousand"</code> for a zero
    middle group (<code>1,000,010</code> becoming <code>"One Million Thousand Ten"</code>) or
    leaving a trailing space on exact hundreds and multiples of ten (<code>100</code>,
    <code>20</code>). Collecting non-empty tokens and joining with a single space eliminates both.</p>
  `,

  signature: {
    name: 'numberToWords',
    params: [{ name: 'num', type: 'int' }],
    returns: 'string',
  },

  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one non-negative 32-bit integer.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let num;
    try {
      num = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter a single integer from 0 to 2147483647, for example 12345.' };
    }
    if (!Number.isInteger(num) || num < 0 || num > MAX_NUM) {
      return { ok: false, error: 'num must be an integer from 0 to 2147483647.' };
    }
    return { ok: true, args: [num] };
  },

  solveReference: (args) => reference(args[0]),
};

export default problem;
