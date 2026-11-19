/**
 * Problem: Growing Word Chain
 *
 * A word grows into another by inserting exactly one letter anywhere. Find the longest chain of
 * growth steps using words from a list. Comparing every pair of words is the obvious DP; the
 * faster one turns it around and looks each word's predecessors up in a hash map by deleting
 * one letter at a time.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_WORDS = 20000;
const MAX_LEN = 16;

/**
 * Reference: process words from short to long; a word's best chain is one more than the best
 * chain ending at any word obtained by deleting one of its letters. O(n * L^2) time.
 * @param {string[]} words
 * @returns {number}
 */
export function reference(words) {
  const sorted = [...words].sort((a, b) => a.length - b.length);
  const best = new Map();
  let answer = 0;
  for (const w of sorted) {
    let here = 1;
    for (let i = 0; i < w.length; i++) {
      const prev = best.get(w.slice(0, i) + w.slice(i + 1));
      if (prev !== undefined && prev + 1 > here) here = prev + 1;
    }
    best.set(w, here);
    if (here > answer) answer = here;
  }
  return answer;
}

/** Seeded random word of length `len` over `alphabet`. */
function randomWord(rnd, len, alphabet) {
  let w = '';
  for (let i = 0; i < len; i++) w += alphabet[Math.floor(rnd() * alphabet.length)];
  return w;
}

/** Fisher-Yates with the seeded generator, so the list is not given in chain order. */
function shuffle(rnd, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** One chain of `len` words grown by random insertions over `alphabet`. */
function growChain(rnd, len, alphabet) {
  const chain = [randomWord(rnd, 1, alphabet)];
  while (chain.length < len) {
    const w = chain[chain.length - 1];
    const at = Math.floor(rnd() * (w.length + 1));
    chain.push(w.slice(0, at) + randomWord(rnd, 1, alphabet) + w.slice(at));
  }
  return chain;
}

/** n random words with lengths uniform in [minLen, maxLen]. */
function randomWords(seed, n, alphabet, minLen, maxLen) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => randomWord(rnd, minLen + Math.floor(rnd() * (maxLen - minLen + 1)), alphabet));
}

/** A full 16-word chain over "xyz" hidden among words over "cdef", shuffled together. */
function buriedChain(seed) {
  const rnd = mulberry32(seed);
  const noise = randomWords(seed + 1, MAX_WORDS - MAX_LEN, 'cdef', 1, MAX_LEN);
  return shuffle(rnd, [...noise, ...growChain(rnd, MAX_LEN, 'xyz')]);
}

/**
 * Half the words of length 15 and half of length 16 over "ab": almost every short word has a
 * successor, so comparing every pair of words does 10^8 string checks.
 */
function twoAdjacentLengths(seed) {
  const rnd = mulberry32(seed);
  return Array.from({ length: MAX_WORDS }, (_, i) => randomWord(rnd, i % 2 ? MAX_LEN : MAX_LEN - 1, 'ab'));
}

const visible = [
  {
    args: [['o', 'on', 'one', 'bone', 'boned', 'x']],
    expected: 5,
    note: 'o -> on -> one -> bone -> boned, one inserted letter per step.',
  },
  {
    args: [['cat', 'dog', 'bird']],
    expected: 1,
    note: 'No word grows into another, so every chain is a single word.',
  },
  {
    args: [['a', 'abc', 'abcd']],
    expected: 2,
    note: 'a to abc inserts two letters, which is not a step. abc -> abcd is.',
  },
  {
    args: [['xy', 'xy', 'xyz']],
    expected: 2,
    note: 'Duplicate words do not lengthen a chain.',
  },
  {
    args: [['wxyz', 'w', 'wxy', 'wx']],
    expected: 4,
    note: 'The list can be in any order.',
  },
];

// Hidden tests target the classic wrong answers: treating a rearrangement as a step, allowing two
// inserted letters, mishandling repeated letters, assuming input order, and two 2 * 10^4-word lists
// where comparing every pair of words is too slow.
const hiddenArgs = [
  [['q']],
  [['ab', 'cd', 'abcd']],
  [['aa', 'aaa', 'aaaa', 'a']],
  [['ab', 'ba', 'bca', 'cab', 'abc']],
  [shuffle(mulberry32(5), growChain(mulberry32(3), MAX_LEN, 'abcdefghijklmnopqrstuvwxyz'))],
  [randomWords(7, 500, 'ab', 1, 8)],
  [twoAdjacentLengths(11)],
  [randomWords(13, MAX_WORDS, 'abc', 1, MAX_LEN)],
  [randomWords(17, MAX_WORDS, 'abcdefghijklmnopqrstuvwxyz', MAX_LEN, MAX_LEN)],
  [buriedChain(19)],
];

export const problem = {
  id: 'growing-word-chain',
  title: 'Growing Word Chain',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Hash Map', 'Sort by Length'],
  timeLimitMs: 2000,
  argNames: ['words'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Word <code>a</code> <strong>grows into</strong> word <code>b</code> if inserting exactly one
    letter somewhere in <code>a</code> (at the start, the end, or between two letters) gives
    <code>b</code>, without changing the order of the other letters. For example, <code>"one"</code>
    grows into <code>"bone"</code> and <code>"once"</code>, but not into <code>"neon"</code>.</p>
    <p>A <strong>chain</strong> is a sequence of words where each word grows into the next one. A
    single word is a chain of length 1.</p>
    <p>Given a list <code>words</code>, return the length of the longest chain whose words all come
    from the list. You may pick the words in any order, each list entry at most once.</p>
  `,
  constraints: [
    '1 <= words.length <= 2 * 10^4',
    '1 <= words[i].length <= 16',
    'words[i] consists of lowercase English letters; words may repeat',
    'Target complexity: O(n * L^2) time for n words of length at most L',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `words = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'A chain only ever goes from shorter words to longer ones. In what order should you look at the words?',
    'If you knew the longest chain ending at every shorter word, how would you get the longest chain ending at this word?',
    'Comparing a word with every shorter word is about 2 * 10^8 pair checks here. A word has at most 16 possible predecessors: which ones?',
    'How can you find out in O(1) whether a candidate predecessor is in the list, and what its best chain is?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Sort the words by length. Keep a hash map <code>best</code> from word to the longest chain
    that ends at it. For each word, try deleting each of its letters; every result that is in the
    map is a possible previous word, so <code>best[word]</code> is one more than the largest of their
    values, or 1 if there is none. The answer is the largest value seen.</p>
    <h4>Why it works</h4>
    <p>The previous word in a chain is exactly one letter shorter, so after sorting by length every
    predecessor already has its final value when a word is reached. Deleting one letter enumerates
    every word that grows into this one, and nothing else.</p>
    <h4>Complexity</h4>
    <p>O(n * L^2) time: n words, L deletions each, and building or hashing a candidate costs O(L).
    O(n * L) space for the map. Comparing every pair of words instead is O(n^2 * L): about
    2 * 10^8 pairs at n = 2 * 10^4, each costing up to 16 character checks.</p>
    <h4>Pitfall</h4>
    <p>Checking "same letters plus one" with counts. <code>"ab"</code> and <code>"bca"</code> pass a
    count check, yet no single insertion turns <code>ab</code> into <code>bca</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'longestChain',
    params: [{ name: 'words', type: 'string[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one line, a JSON array of words.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let words;
    try {
      words = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter words as a JSON array of strings, e.g. ["o","on","one"].' };
    }
    if (!Array.isArray(words) || words.length < 1 || words.length > MAX_WORDS) {
      return { ok: false, error: 'words must be an array of 1 to 2 * 10^4 strings.' };
    }
    for (const w of words) {
      if (typeof w !== 'string' || !/^[a-z]{1,16}$/.test(w)) {
        return { ok: false, error: `Each word must be 1 to 16 lowercase English letters (got ${JSON.stringify(w)}).` };
      }
    }
    return { ok: true, args: [words] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
