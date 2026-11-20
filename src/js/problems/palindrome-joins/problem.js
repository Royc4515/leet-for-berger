/**
 * Problem: Palindrome Joins
 *
 * Equivalent to LeetCode 336; statement and tests are written for this project. Find every
 * ordered pair of distinct words whose concatenation reads the same backwards. Checking all n^2
 * pairs is too slow; instead split each word at every position: if one side is a palindrome, the
 * partner must be exactly the reverse of the other side, which a hash map finds in O(k).
 *
 * Classic wrong answers: forgetting the empty word (it joins every palindrome, on both sides),
 * pairing a palindrome with itself, reporting a pair twice when a word and its reverse have the
 * same length, and only checking equal-length partners.
 *
 * Words are capped at 50 letters (instead of a few hundred) so the O(n * k^2) split solution
 * stays well inside the time limit in every language while the n^2 pair check does not.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_WORDS = 10000;
const MAX_LEN = 50;

const reverse = (s) => {
  let r = '';
  for (let i = s.length - 1; i >= 0; i--) r += s[i];
  return r;
};
const isPalindrome = (s, lo = 0, hi = s.length - 1) => {
  while (lo < hi) if (s[lo++] !== s[hi--]) return false;
  return true;
};

/**
 * Reference: index every word by its reverse, then try every split of every word.
 * For words[i] = a + b: if b is a palindrome and some word j equals reverse(a), then
 * words[i] + words[j] = a + b + reverse(a) is a palindrome. Mirror-wise, if a is a palindrome and
 * word j equals reverse(b), then words[j] + words[i] is one. Requiring a non-empty a in the second
 * case keeps a pair of equal-length mirror words from being found twice. The palindrome check
 * runs first because it usually fails within a letter or two, which skips the lookup. This runs
 * at module load for the hidden tests, so it is kept fast.
 * @param {string[]} words distinct lowercase words
 * @returns {number[][]} pairs [i, j], sorted by i, then j
 */
export function reference(words) {
  const byReverse = new Map(words.map((w, i) => [reverse(w), i]));
  const out = [];
  words.forEach((w, i) => {
    const m = w.length;
    for (let cut = 0; cut <= m; cut++) {
      if (isPalindrome(w, cut, m - 1)) {
        const j = byReverse.get(w.slice(0, cut));
        if (j !== undefined && j !== i) out.push([i, j]);
      }
      if (cut > 0 && isPalindrome(w, 0, cut - 1)) {
        const j = byReverse.get(w.slice(cut));
        if (j !== undefined && j !== i) out.push([j, i]);
      }
    }
  });
  return out.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
}

/** Random word over the first `letters` letters of the alphabet. */
function randomWord(rnd, len, letters) {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(97 + Math.floor(rnd() * letters));
  return s;
}

/** Fisher-Yates with the seeded generator, so word order (and so indices) is deterministic. */
function shuffle(rnd, values) {
  const a = values.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** `n` distinct random words, lengths in [minLen, maxLen], over `letters` letters. */
function randomWords(seed, n, minLen, maxLen, letters) {
  const rnd = mulberry32(seed);
  const seen = new Set();
  while (seen.size < n) seen.add(randomWord(rnd, minLen + Math.floor(rnd() * (maxLen - minLen + 1)), letters));
  return [...seen];
}

/**
 * Words built to pair up: random stems together with their reverses, extended by a palindrome on
 * either side, so all three ways to match (equal length, longer word on the left, longer word on
 * the right) occur many times, among random filler. Lengths stay within MAX_LEN.
 */
function mirroredWords(seed, n) {
  const rnd = mulberry32(seed);
  const seen = new Set();
  const add = (w) => {
    if (seen.size < n && w.length <= MAX_LEN) seen.add(w);
  };
  const palindrome = (len) => {
    const half = randomWord(rnd, Math.ceil(len / 2), 3);
    return half + reverse(half.slice(0, Math.floor(len / 2)));
  };
  while (seen.size < n) {
    const stem = randomWord(rnd, 1 + Math.floor(rnd() * 20), 3);
    const roll = rnd();
    add(stem);
    if (roll < 0.3) add(reverse(stem));
    else if (roll < 0.55) add(reverse(stem) + palindrome(1 + Math.floor(rnd() * 25)));
    else if (roll < 0.8) add(palindrome(1 + Math.floor(rnd() * 25)) + reverse(stem));
    else add(randomWord(rnd, 1 + Math.floor(rnd() * MAX_LEN), 3));
  }
  return shuffle(rnd, [...seen]);
}

/**
 * Every word has the maximum length 50: a palindrome whose half is 20 a's and 5 random letters
 * from {a, b}, with one letter changed. Any two words then agree on their outer 20 letters, so
 * even a pair check that stops at the first mismatch compares about 20 letters per pair. Output
 * stays small: a word matches only its exact mirror.
 */
function longNearPalindromes(seed, n) {
  const rnd = mulberry32(seed);
  const seen = new Set();
  while (seen.size < n) {
    const h = 'a'.repeat(20) + randomWord(rnd, MAX_LEN / 2 - 20, 2);
    const chars = [...(h + reverse(h))];
    chars[Math.floor(rnd() * MAX_LEN)] = String.fromCharCode(97 + Math.floor(rnd() * 26));
    seen.add(chars.join(''));
  }
  return shuffle(rnd, [...seen]);
}

/** The empty word and runs of one letter: every pair joins into a palindrome. */
const oneLetterRuns = (count) => Array.from({ length: count }, (_, i) => 'z'.repeat(i));

const visible = [
  { args: [['bat', 'tab', 'cat']], expected: [[0, 1], [1, 0]], note: '"battab" and "tabbat" are palindromes; "cat" pairs with nothing.' },
  { args: [['mn', 'nm', 'yyx', 'x', 'xyyyy']], expected: [[0, 1], [1, 0], [3, 2], [4, 2], [4, 3]], note: '"xyyx", "xyyyyyyx" and "xyyyyx": the partner can be shorter or longer.' },
  { args: [['a', '']], expected: [[0, 1], [1, 0]], note: 'The empty word joins any palindrome on either side.' },
  { args: [['abc', 'xyz']], expected: [], note: 'No join reads the same backwards.' },
  { args: [['aba', 'ba', 'a', 'xab']], expected: [[0, 1], [1, 3], [2, 1]], note: '"aba" is a palindrome, but a word is never joined with itself.' },
];

// Hidden tests: a single word, the empty word next to several palindromes, a word and its own
// reverse (each order once, never twice), one-letter runs where every pair matches, partners that
// differ in length on either side, and 10^4-word inputs where checking every pair is too slow.
const hiddenInputs = [
  ['abba'],
  ['', 'aba', 'xy', 'c', 'cc'],
  ['ab', 'ba', 'abc', 'cba'],
  oneLetterRuns(51),
  ['race', 'car', 'ecar', 'racecar', 'e', 'rac'],
  randomWords(31, 300, 1, 8, 2),
  mirroredWords(37, 2000),
  mirroredWords(41, MAX_WORDS),
  randomWords(43, MAX_WORDS, 0, MAX_LEN, 2),
  longNearPalindromes(47, MAX_WORDS),
];

export const problem = {
  id: 'palindrome-joins',
  title: 'Palindrome Joins',
  difficulty: 'Hard',
  topics: ['arrays-strings', 'trees'],
  patterns: ['Hash Map Index', 'String Splitting', 'Palindrome', 'Trie'],
  timeLimitMs: 3000,
  argNames: ['words'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a list of distinct lowercase <code>words</code>. Joining
    <code>words[i]</code> and <code>words[j]</code> means writing <code>words[i]</code> followed
    directly by <code>words[j]</code>.</p>
    <p>Return every pair of indices <code>[i, j]</code> with <code>i != j</code> whose join is a
    palindrome, a string that reads the same forwards and backwards. Order matters inside a pair:
    <code>[i, j]</code> and <code>[j, i]</code> are different joins and each is reported only if it
    is a palindrome.</p>
    <p>Return the pairs sorted by <code>i</code>, then by <code>j</code>. The empty word is allowed,
    and joins with it are judged like any other.</p>
  `,
  constraints: [
    '1 <= words.length <= 10^4',
    '0 <= words[i].length <= 50',
    'words[i] consists of lowercase English letters; all words are distinct',
    'Target complexity: O(n * k^2) for n words of length at most k (plus sorting the output)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `words = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'With 10^4 words there are about 10^8 ordered pairs. Can you avoid looking at most of them?',
    'If words[i] + words[j] is a palindrome and words[j] is the shorter one, what must words[j] look like compared with the start of words[i]?',
    'Split a word into a left part and a right part. If the right part is a palindrome, which exact word would complete it on the right?',
    'What structure tells you in O(k) whether a given string is one of the words, and which index it has?',
    'How do the empty word, a palindrome word, and a word whose reverse has the same length behave? Could any pair be counted twice or paired with itself?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Map every word to its index. Then split each word <code>w</code> at every position into
    <code>a + b</code>. If <code>b</code> is a palindrome and <code>reverse(a)</code> is another
    word, joining <code>w</code> with it works. If <code>a</code> is a palindrome and
    <code>reverse(b)</code> is another word, joining that word with <code>w</code> works.</p>
    <h4>Why it works</h4>
    <p>In a palindromic join of two words, the longer word's outer end must mirror the whole shorter
    word, and what is left of the longer word sits in the middle, so it must be a palindrome by
    itself. Trying every split of every word covers every possible shorter partner on either side.
    Only taking the second case for a non-empty <code>a</code> keeps equal-length mirror words from
    being reported twice.</p>
    <h4>Complexity</h4>
    <p>O(n * k^2) time for n words of length at most k: k + 1 splits per word, each with O(k)
    reversing, hashing and palindrome checks, plus sorting the pairs. O(n * k) space for the map.
    Checking every pair costs O(n^2 * k).</p>
    <h4>Pitfall</h4>
    <p>The empty word. It joins every palindrome word on both sides, and it is only found if the
    split at position 0 (an empty left part) is tried. Also skip a match with the word's own index:
    a palindrome is its own reverse.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'palindromeJoins',
    params: [{ name: 'words', type: 'string[]' }],
    returns: 'int[][]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((words) => ({ args: [words], expected: reference(words) })),

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
      return { ok: false, error: 'Enter the words as a JSON array, for example ["bat","tab","cat"].' };
    }
    if (!Array.isArray(words) || words.length < 1 || words.length > MAX_WORDS) return { ok: false, error: 'words must be an array of 1 to 10^4 strings.' };
    if (!words.every((w) => typeof w === 'string' && /^[a-z]{0,50}$/.test(w))) return { ok: false, error: 'Each word is 0 to 50 lowercase letters.' };
    if (new Set(words).size !== words.length) return { ok: false, error: 'All words must be distinct.' };
    return { ok: true, args: [words] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Distinct words of up to 50 letters over three letters, built as stems and their mirrored
  // partners with palindromic middles, so the palindrome checks run deep and pairs exist. Word
  // length stays at most 50, so n is the word count; trying every ordered pair is n^2.
  growth: {
    target: 'n',
    n: 'words.length',
    sizes: [1000, 2000, 4000, 8000, 16000],
    input: (n, seed) => [mirroredWords(seed, n)],
  },
};

export default problem;
