/**
 * Problem: Word Order Flip
 *
 * A line of text has its words in the wrong order and sloppy spacing. Return the words in reverse
 * order, joined by single spaces, with nothing before the first word or after the last. The
 * trap is the spaces: the text may start or end with them and may have runs of them between
 * words, so cutting at every single space produces empty "words".
 *
 * Reference: scan from the end of the text, skipping spaces and then copying one word at a time,
 * O(n) time and O(n) output. Limits go to 10^5 characters, so building the answer by repeatedly
 * prepending to a string is quadratic in the languages where strings are immutable.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;
const ALNUM = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Reference: walk from the right end; each maximal run of non-space characters is one word,
 * emitted in the order it is met.
 * @param {string} s
 * @returns {string}
 */
export function reference(s) {
  const words = [];
  let i = s.length - 1;
  while (i >= 0) {
    while (i >= 0 && s[i] === ' ') i--;
    if (i < 0) break;
    const end = i;
    while (i >= 0 && s[i] !== ' ') i--;
    words.push(s.slice(i + 1, end + 1));
  }
  return words.join(' ');
}

/**
 * Seeded text of exactly `len` characters: each position is a space with probability `gap`,
 * otherwise a letter or digit. One position is forced to be a non-space so a word exists.
 */
function randomText(seed, len, gap) {
  const rnd = mulberry32(seed);
  const chars = Array.from({ length: len }, () => (rnd() < gap ? ' ' : ALNUM[Math.floor(rnd() * ALNUM.length)]));
  const keep = Math.floor(rnd() * len);
  if (chars[keep] === ' ') chars[keep] = ALNUM[Math.floor(rnd() * ALNUM.length)];
  return chars.join('');
}

const visible = [
  { args: ['the sky is blue'], expected: 'blue is sky the', note: 'Four words, one space between each.' },
  { args: ['  hello world  '], expected: 'world hello', note: 'The extra spaces at both ends disappear.' },
  { args: ['a   good   example'], expected: 'example good a', note: 'Runs of spaces between words become a single space.' },
  { args: ['x'], expected: 'x', note: 'A single word stays as it is.' },
  { args: ['  7   '], expected: '7', note: 'Only one word, surrounded by spaces.' },
];

// Hidden tests: a lone word, a word with padding, a mix of letters and digits, then six inputs
// at 10^5 characters (one giant word, 50000 single-letter words, random text with sparse and
// dense gaps, spaces everywhere with one word at the very start and one at the very end), and a
// short random text.
const hiddenInputs = [
  'hello',
  '          a          ',
  'Route66 is 4 Kids  and 2 Dogs',
  'A'.repeat(MAX_LEN),
  'a '.repeat(MAX_LEN / 2 - 1) + 'ab',
  randomText(11, MAX_LEN, 0.1),
  randomText(13, MAX_LEN, 0.6),
  'q' + ' '.repeat(MAX_LEN - 1),
  ' '.repeat(MAX_LEN - 3) + 'xyz',
  randomText(17, 25, 0.3),
];

export const problem = {
  id: 'word-order-flip',
  title: 'Word Order Flip',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'String Parsing'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a line of text <code>s</code> made of letters, digits and spaces. A <em>word</em>
    is a maximal run of characters that are not spaces. The text can begin or end with spaces, and
    words can be separated by more than one space.</p>
    <p>Return a string that holds the words of <code>s</code> in reverse order, separated by exactly
    one space, with no space before the first word or after the last. The characters inside each word
    keep their order.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of English letters, digits and spaces',
    's contains at least one word',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you split the text at every single space, what do you get when two spaces sit next to each other?',
    'What would you have to throw away from the pieces before reversing them?',
    'Could you find the words from the right end of the text, so that they already come out in the order you need?',
    'When you are standing between words, how many spaces must you skip, and when do you write one space into the answer?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Read the text from right to left. Skip spaces until a letter or digit shows up, remember where
    that word ends, walk left to its first character, and copy the word to the answer. Put one space
    in front of every word except the first one you copy.</p>
    <h4>Why it works</h4>
    <p>Walking from the right meets the last word first, which is exactly the order the answer needs, so
    nothing has to be reversed afterwards. Skipping every space before a word is what removes the
    leading, trailing and repeated spaces, and writing the separator only between copied words
    guarantees exactly one space between neighbors.</p>
    <h4>Complexity</h4>
    <p>O(n) time, since every character is looked at once or twice, and O(n) space for the answer.</p>
    <h4>Pitfall</h4>
    <p>Splitting at a single space and reversing keeps the empty strings between consecutive spaces, so
    <code>"a   b"</code> turns into a result with extra spaces. Prepending each word to the front of a
    growing string also copies the whole answer every time and is quadratic on 10^5 characters.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'flipWordOrder',
    params: [{ name: 's', type: 'string' }],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((s) => ({ args: [s], expected: reference(s) })),

  /**
   * Custom input: the text as one JSON string, so leading and trailing spaces survive.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the text as a JSON string, for example "  hello world  ".' };
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_LEN) return { ok: false, error: 'The text must have 1 to 10^5 characters.' };
    if (!/^[A-Za-z0-9 ]+$/.test(s)) return { ok: false, error: 'Use only letters, digits and spaces.' };
    if (s.trim() === '') return { ok: false, error: 'The text needs at least one word.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
