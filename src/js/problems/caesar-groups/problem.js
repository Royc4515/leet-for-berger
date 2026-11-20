/**
 * Problem: Caesar Groups
 *
 * Shifting a word moves every letter forward by the same amount, wrapping z around to a (a
 * Caesar cipher). Group words that can be shifted into each other. It is group-by-key again, like
 * Anagram Buckets, but the key is subtler: the gaps between consecutive letters modulo 26, or
 * equivalently the word shifted so it starts with "a". The classic bugs are forgetting the wrap
 * (so "az" and "ba" end up apart), building the key from gaps joined without a separator (so the
 * gaps 1, 11 and 11, 1 collide), and comparing every word with every group (O(n^2 * k)).
 *
 * Output order is fixed so judging is exact: groups appear in the order of their first word,
 * and words inside a group keep their input order.
 */

import { mulberry32 } from '../../engine/rng.js';

const A = 97;
const MAX_N = 10000;
const MAX_LEN = 50;

/** The word shifted so that it starts with "a": equal exactly for words in the same group. */
function keyOf(w) {
  const d = w.charCodeAt(0) - A;
  let key = '';
  for (let i = 0; i < w.length; i++) key += String.fromCharCode(A + ((w.charCodeAt(i) - A - d + 26) % 26));
  return key;
}

/**
 * Reference: insertion-ordered map from normalized word to its group.
 * @param {string[]} words
 * @returns {string[][]}
 */
export function reference(words) {
  const groups = new Map();
  for (const w of words) {
    const k = keyOf(w);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(w);
  }
  return [...groups.values()];
}

/** Shifts a word by s letters, wrapping around. */
function shift(w, s) {
  let out = '';
  for (let i = 0; i < w.length; i++) out += String.fromCharCode(A + ((w.charCodeAt(i) - A + s) % 26));
  return out;
}

/** n words drawn from `classes` base patterns of length 1..maxLen, each shifted at random. */
function shiftedWords(seed, n, classes, minLen, maxLen) {
  const rnd = mulberry32(seed);
  const pick = (k) => Math.floor(rnd() * k);
  const bases = Array.from({ length: classes }, () => {
    const len = minLen + pick(maxLen - minLen + 1);
    return Array.from({ length: len }, () => String.fromCharCode(A + pick(26))).join('');
  });
  return Array.from({ length: n }, () => shift(bases[pick(classes)], pick(26)));
}

/**
 * n words of length 50 that share the first 47 letter gaps and differ only in the last three, so
 * each word is its own group and comparing a word against every group reads almost all of it.
 */
function nearMissWords(seed, n) {
  const rnd = mulberry32(seed);
  const pick = (k) => Math.floor(rnd() * k);
  const prefix = Array.from({ length: MAX_LEN - 3 }, () => String.fromCharCode(A + pick(26))).join('');
  const out = [];
  for (let i = 0; i < n; i++) {
    const tail = String.fromCharCode(A + (i % 26), A + (Math.floor(i / 26) % 26), A + (Math.floor(i / 676) % 26));
    out.push(shift(prefix + tail, pick(26)));
  }
  return out;
}

const visible = [
  {
    args: [['abc', 'hij', 'ace', 'bdf', 'xyz', 'ab']],
    expected: [['abc', 'hij', 'xyz'], ['ace', 'bdf'], ['ab']],
    note: 'Shifting "abc" by 7 gives "hij" and by 23 gives "xyz". Groups appear in the order of their first word.',
  },
  {
    args: [['az', 'ba', 'yx', 'by']],
    expected: [['az', 'ba', 'yx'], ['by']],
    note: 'Letters wrap: shifting "az" by 1 gives "ba". "by" would need a gap of 23, not 25.',
  },
  { args: [['q', 'a', 'zz', 'm']], expected: [['q', 'a', 'm'], ['zz']], note: 'Every one-letter word is a shift of every other one.' },
  { args: [['cat', 'cat', 'dbu']], expected: [['cat', 'cat', 'dbu']], note: 'Repeated words stay, in input order.' },
  { args: [['ab', 'abc', 'bc', 'bcd']], expected: [['ab', 'bc'], ['abc', 'bcd']], note: 'Words of different lengths are never in the same group.' },
];

// Hidden tests: one word; a near miss in the last letter; gaps 1, 11 and 11, 1 (a key of gaps
// joined without a separator merges them); a wrap in the middle of the word; every shift of one
// word; random lists; then 10^4 words at maximum length in a few groups, and 10^4 words that each
// form their own group while sharing 47 of 49 gaps (comparing against every group is far too slow).
const hiddenArgs = [
  [['k']],
  [['abc', 'abd', 'bce']],
  [['abm', 'alm', 'bcn', 'bmn']],
  [['zab', 'abc', 'yza', 'zbc']],
  [Array.from({ length: 26 }, (_, s) => shift('wordshift', 25 - s))],
  [shiftedWords(7, 500, 30, 1, 6)],
  [shiftedWords(11, MAX_N, 4, MAX_LEN, MAX_LEN)],
  [nearMissWords(13, MAX_N)],
  [shiftedWords(17, MAX_N, 3000, 1, MAX_LEN)],
  [shiftedWords(19, 3000, 40, 1, 2)],
];

export const problem = {
  id: 'caesar-groups',
  title: 'Caesar Groups',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Hash Map', 'Group by Key', 'Normalization'],
  timeLimitMs: 3000,
  argNames: ['words'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p><strong>Shifting</strong> a word moves each of its letters forward in the alphabet by the
    same amount, and <code>z</code> wraps around to <code>a</code>. For example, shifting
    <code>"abz"</code> by 1 gives <code>"bca"</code>, and shifting it by 3 gives
    <code>"dec"</code>.</p>
    <p>Given an array of lowercase <code>words</code>, put two words in the same group when one
    can be shifted into the other (a word is a shift of itself, by 0).</p>
    <p>Return the groups ordered by where their first word appears in the input. Inside a group,
    keep the words in their input order.</p>
  `,
  constraints: [
    '1 <= words.length <= 10^4',
    '1 <= words[i].length <= 50',
    'words[i] consists of lowercase English letters',
    'Target complexity: O(n * k) for n words of length up to k',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `words = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'When you shift a whole word, which property of its letters stays the same?',
    'Could you turn every word into one representative that all of its shifts share? Which shift would you pick?',
    'What should the gap from "z" to "a" be? How do you keep it from going negative?',
    'If your key lists the gaps as numbers, can two different gap lists produce the same key?',
    'Once every word has a key, how do you keep the groups in first-appearance order in your language?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Give every word a key that all of its shifts share: the word shifted back so that it starts
    with <code>a</code>. Group words by that key in an insertion-ordered hash map, then return the
    map's lists.</p>
    <h4>Why it works</h4>
    <p>Shifting by s adds s to every letter modulo 26, so the gap between any two letters of a word
    stays the same. Shifting back by the first letter fixes the first letter at <code>a</code>,
    and the unchanged gaps then fix every other letter. Two words share a key exactly when they
    have the same length and the same gaps, which is exactly when one is a shift of the other.</p>
    <h4>Complexity</h4>
    <p>O(n * k) time and space for n words of length up to k: each word is read once to build its
    key, and the map lookup hashes that key. Comparing each word with every group found so far
    is O(n^2 * k).</p>
    <h4>Pitfall</h4>
    <p>The wrap. In <code>"az"</code> the gap is 25, and in <code>"ba"</code> it is -1, which is
    the same gap modulo 26; add 26 before taking the remainder so it does not go negative. A key
    made of gap numbers glued together also breaks: gaps 1, 11 and 11, 1 both read
    <code>"111"</code> without a separator.</p>
  `,

  signature: {
    name: 'groupByShift',
    params: [{ name: 'words', type: 'string[]' }],
    returns: 'string[][]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the words as a JSON array of strings.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let words;
    try {
      words = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the words as a JSON array, for example ["abc","bcd"].' };
    }
    if (!Array.isArray(words) || words.length < 1 || words.length > MAX_N) return { ok: false, error: 'words must have 1 to 10^4 entries.' };
    if (!words.every((w) => typeof w === 'string' && /^[a-z]{1,50}$/.test(w))) {
      return { ok: false, error: 'Each word must be 1 to 50 lowercase letters.' };
    }
    return { ok: true, args: [words] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Words of 50 letters, each a random shift of one of n / 4 base words: every word is normalized
  // letter by letter and joins a group. Word length stays fixed, so n is the word count; comparing
  // every pair of words for a common shift is n^2.
  growth: {
    target: 'n',
    n: 'words.length',
    sizes: [1000, 2000, 4000, 8000, 16000],
    input: (n, seed) => [shiftedWords(seed, n, Math.max(1, n >> 2), MAX_LEN, MAX_LEN)],
  },
};

export default problem;
