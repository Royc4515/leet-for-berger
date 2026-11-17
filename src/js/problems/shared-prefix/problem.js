/**
 * Problem: Shared Prefix
 *
 * The longest string that starts every word in a list. Vertical scanning compares column i of
 * every word and stops at the first mismatch or the first word that runs out, so the work is
 * bounded by the total input size. The classic bugs are reading past the end of a shorter word,
 * returning the wrong slice when the first word is the shortest, and quadratic candidate checks:
 * trying every prefix length and re-comparing whole prefixes costs O(n * L^2) on long words.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_WORDS = 10000;
const MAX_TOTAL = 1000000;

/**
 * Reference: vertical scan, column by column.
 * @param {string[]} strs at least one word
 * @returns {string}
 */
export function reference(strs) {
  const first = strs[0];
  for (let i = 0; i < first.length; i++) {
    for (let j = 1; j < strs.length; j++) {
      if (i >= strs[j].length || strs[j][i] !== first[i]) return first.slice(0, i);
    }
  }
  return first;
}

/** Seeded word of `len` letters drawn from `letters`. */
function randomWord(rnd, len, letters) {
  let s = '';
  for (let i = 0; i < len; i++) s += letters[Math.floor(rnd() * letters.length)];
  return s;
}

/** `count` words that all start with `prefix`, each followed by a seeded tail of up to `tail` letters. */
function sharedStart(seed, count, prefix, tail) {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, () => prefix + randomWord(rnd, Math.floor(rnd() * (tail + 1)), 'abc'));
}

const visible = [
  { args: [['flower', 'flow', 'flight']], expected: 'fl', note: 'All three start with "fl"; the third letter already differs.' },
  { args: [['dog', 'racecar', 'car']], expected: '', note: 'The first letters differ, so the shared prefix is empty.' },
  { args: [['alone']], expected: 'alone', note: 'A single word is its own longest shared prefix.' },
  { args: [['', 'abc']], expected: '', note: 'An empty word shares only the empty prefix.' },
  { args: [['same', 'same', 'same']], expected: 'same', note: 'Identical words share all of themselves.' },
];

// Hidden tests: a later word shorter than the first (index past its end), a word that is a
// prefix of the first, a mismatch only in the last word, and at max size two 5 * 10^5-letter
// words (identical except the last letter, and differing at the second letter: these break
// quadratic "try every prefix length" loops from either end) plus 10^4 words with a long
// shared start.
const longA = 'ab'.repeat(250000);
const hiddenInputs = [
  [['a']],
  [['ab', 'a']],
  [['prefix', 'pre', 'prefixes']],
  [['abc', 'abc', 'abx']],
  [['x', 'y']],
  [['interview', 'internet', 'interval', 'internal', 'inter']],
  [[longA, `${longA.slice(0, -1)}c`]],
  [[longA, `a${'c'.repeat(longA.length - 1)}`]],
  [sharedStart(7, MAX_WORDS, 'q'.repeat(60), 30).map((w, i) => (i === MAX_WORDS - 1 ? `${'q'.repeat(59)}z` : w))],
  [Array.from({ length: MAX_WORDS }, () => 'k'.repeat(100))],
];

const isLowerWord = (s) => typeof s === 'string' && /^[a-z]*$/.test(s);

export const problem = {
  id: 'shared-prefix',
  title: 'Shared Prefix',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['String', 'Vertical Scan'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['strs'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a list of words <code>strs</code>, return the longest string that every word in the
    list starts with. If the words have no first letter in common, return the empty string
    <code>""</code>.</p>
    <p>A word is a prefix of itself, and the empty string is a prefix of every word.</p>
  `,
  constraints: [
    '1 <= strs.length <= 10^4',
    '0 <= strs[i].length, and the total length of all words is at most 10^6',
    'strs[i] consists of lowercase English letters',
    'Target complexity: O(total length)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `strs = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'The answer can never be longer than which word?',
    'If you look at position i of every word at once, when can you stop?',
    'What happens at position i when one of the words has fewer than i + 1 letters?',
    'If you instead tried every possible prefix length and compared whole prefixes, how much work would two words of 500,000 letters cost?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'longestCommonPrefix',
    params: [{ name: 'strs', type: 'string[]' }],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the words as a JSON array of strings.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let strs;
    try {
      strs = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the words as a JSON array of strings, for example ["flower","flow"].' };
    }
    if (!Array.isArray(strs) || strs.length < 1 || strs.length > MAX_WORDS) return { ok: false, error: 'Enter between 1 and 10^4 words as a JSON array.' };
    if (!strs.every(isLowerWord)) return { ok: false, error: 'Words must be strings of lowercase letters a-z.' };
    if (strs.reduce((t, s) => t + s.length, 0) > MAX_TOTAL) return { ok: false, error: 'The total length of all words is at most 10^6.' };
    return { ok: true, args: [strs] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
