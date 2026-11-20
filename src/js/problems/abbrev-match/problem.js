/**
 * Problem: Abbreviation Match
 *
 * A shorthand keeps some letters of a word and replaces runs of letters with the run's length, so
 * "internationalization" can be written "i12iz4n". Decide whether a shorthand is a valid shorthand
 * of a given word. Two pointers, one per string; a digit run is read as one number and the word
 * pointer jumps by it. A number can be up to 10^9, so expanding the shorthand into a string is
 * the trap: the solution must only move a pointer.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Reference: walk both strings; a digit run (no leading zero) skips that many letters of word.
 * @param {string} word
 * @param {string} abbr
 * @returns {boolean}
 */
export function reference(word, abbr) {
  let i = 0;
  let j = 0;
  while (i < word.length && j < abbr.length) {
    const c = abbr[j];
    if (c >= '0' && c <= '9') {
      // A number may not start with 0 (this also rules out the number 0).
      if (c === '0') return false;
      let num = 0;
      while (j < abbr.length && abbr[j] >= '0' && abbr[j] <= '9') {
        num = num * 10 + (abbr.charCodeAt(j) - 48);
        j++;
      }
      i += num;
    } else {
      if (word[i] !== c) return false;
      i++;
      j++;
    }
  }
  // Both strings must be used up together. A skip that overshoots the word leaves i past its end.
  return i === word.length && j === abbr.length;
}

/** Seeded word of length n over `alphabet`. */
function randomWord(rnd, n, alphabet = LETTERS) {
  let out = '';
  for (let i = 0; i < n; i++) out += alphabet[Math.floor(rnd() * alphabet.length)];
  return out;
}

/** A valid shorthand of `word`: each stretch is kept as letters or replaced by its length. */
function shorthand(rnd, word, replaceChance, maxRun) {
  let out = '';
  let i = 0;
  let lastWasNumber = false;
  while (i < word.length) {
    // Two numbers in a row would read as one longer number, so a number is followed by a letter.
    if (!lastWasNumber && rnd() < replaceChance) {
      const run = 1 + Math.floor(rnd() * Math.min(maxRun, word.length - i));
      out += String(run);
      i += run;
      lastWasNumber = true;
    } else {
      out += word[i++];
      lastWasNumber = false;
    }
  }
  return out;
}

const visible = [
  { args: ['internationalization', 'i12iz4n'], expected: true, note: 'i, then 12 letters, then iz, then 4 letters, then n.' },
  { args: ['apple', 'a2e'], expected: false, note: 'a, 2 letters, e: that covers 4 letters, but "apple" has 5.' },
  { args: ['substitution', 's10n'], expected: true, note: 's, 10 letters, n.' },
  { args: ['word', '4'], expected: true, note: 'A single number may replace the whole word.' },
  { args: ['hi', 'h01'], expected: false, note: 'A number may not have a leading zero.' },
];

const bigWord = randomWord(mulberry32(21), MAX_LEN);
const bigWord2 = randomWord(mulberry32(22), MAX_LEN, 'ab');
const sh1 = shorthand(mulberry32(24), bigWord, 0.5, 40);
const sh2 = shorthand(mulberry32(25), bigWord2, 0.3, 3);

/** The same shorthand with its last letter changed, so exactly one position disagrees. */
function corrupt(abbr) {
  let k = abbr.length - 1;
  while (abbr[k] >= '0' && abbr[k] <= '9') k--;
  return abbr.slice(0, k) + (abbr[k] === 'z' ? 'y' : 'z') + abbr.slice(k + 1);
}

// Hidden tests: a single letter as a number, a leading zero in the middle, a number written as
// separate digits ("a10" is ten letters, not one and zero), a skip one short and one too far, then
// max-size inputs: 10^5 plain letters, a whole word as one number, a 9-digit number that must not
// be expanded, and long seeded shorthands (one valid, one with a single wrong letter at the end).
const hiddenArgs = [
  ['a', '1'],
  ['abc', 'a0bc'],
  ['abcdefghijk', 'a10'],
  ['abcdefghijkl', 'a10'],
  ['abcdefghijk', 'a11'],
  [bigWord, bigWord],
  [bigWord, String(MAX_LEN)],
  [bigWord, '999999999'],
  [bigWord2, sh2],
  [bigWord, corrupt(sh1)],
];

export const problem = {
  id: 'abbrev-match',
  title: 'Abbreviation Match',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Strings'],
  timeLimitMs: 2000,
  argNames: ['word', 'abbr'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A word can be shortened by choosing some non-overlapping, non-empty groups of consecutive
    letters and replacing each group with the number of letters in it. Letters that are not
    chosen stay as they are. For example, <code>"internationalization"</code> can be written
    <code>"i12iz4n"</code> or <code>"20"</code>, but not <code>"i12iz3n"</code>.</p>
    <p>Given <code>word</code> and a string <code>abbr</code>, return <code>true</code> if
    <code>abbr</code> is a valid shortening of <code>word</code>, and <code>false</code> otherwise.</p>
    <p>A number in <code>abbr</code> is a maximal run of digits and may not start with
    <code>0</code>, so <code>"a01"</code> and <code>"a0"</code> are never valid. Because a run of digits
    is one number, <code>"a10"</code> means ten letters, not one and then zero.</p>
  `,
  constraints: [
    '1 <= word.length, abbr.length <= 10^5',
    'word consists of lowercase English letters',
    'abbr consists of lowercase English letters and digits',
    'Every number in abbr has at most 9 digits',
    'Target complexity: O(n + m) time and O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `word = ${JSON.stringify(t.args[0])}, abbr = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If abbr has a letter at its pointer, what must be true about the word at its own pointer?',
    'What should happen to the two pointers when abbr has a digit, and how do you read "12" as one number?',
    'Is "a0" or "a01" a legal number, and where would you check for it?',
    'How do you know the whole word was covered, and what if a number runs past the end of the word?',
    'A number can have nine digits. Do you need to build the expanded string to use it?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Move two pointers together, one in <code>word</code> and one in <code>abbr</code>. A letter in
    <code>abbr</code> must equal the letter at the word's pointer, and both advance. A digit starts a
    number: read the whole digit run as one value, then move the word's pointer forward by that
    value without touching the letters it skips.</p>
    <h4>Why it works</h4>
    <p>Each part of <code>abbr</code> accounts for a fixed stretch of the word: a letter for one
    position, a number for that many positions. So the shorthand is valid exactly when every letter
    matches in place, every number is well formed, and the stretches add up to the whole word, which
    means both pointers finish at the same time.</p>
    <h4>Complexity</h4>
    <p>O(n + m) time, each character is read once. O(1) space. Expanding numbers into strings is
    not just slower: a number like 999999999 would need a billion characters.</p>
    <h4>Pitfall</h4>
    <p>Reject a number that starts with <code>0</code> before reading it. After the loop, check both
    pointers: a skip can overshoot the word, and leftover letters on either side mean no match.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'matchesAbbreviation',
    params: [
      { name: 'word', type: 'string' },
      { name: 'abbr', type: 'string' },
    ],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: word on line 1, abbr on line 2, each a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter word on line 1 and abbr on line 2, each a JSON string.' };
    let word;
    let abbr;
    try {
      word = JSON.parse(lines[0]);
      abbr = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter each string as JSON, for example "apple" then "a3e".' };
    }
    if (typeof word !== 'string' || word.length < 1 || word.length > MAX_LEN) return { ok: false, error: 'word must be a string of 1 to 10^5 characters.' };
    if (!/^[a-z]+$/.test(word)) return { ok: false, error: 'word may only contain lowercase English letters.' };
    if (typeof abbr !== 'string' || abbr.length < 1 || abbr.length > MAX_LEN) return { ok: false, error: 'abbr must be a string of 1 to 10^5 characters.' };
    if (!/^[a-z0-9]+$/.test(abbr)) return { ok: false, error: 'abbr may only contain lowercase letters and digits.' };
    if (/[0-9]{10}/.test(abbr)) return { ok: false, error: 'A number in abbr may have at most 9 digits.' };
    return { ok: true, args: [word, abbr] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). The shorthand is
  // valid, so the walk runs to the end instead of stopping at a mismatch.
  growth: {
    target: 'n',
    n: 'word.length',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const word = randomWord(rnd, n);
      return [word, shorthand(rnd, word, 0.4, 3)];
    },
  },
};

export default problem;
