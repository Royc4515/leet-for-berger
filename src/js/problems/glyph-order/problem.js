/**
 * Problem: Glyph Order
 *
 * A word list is sorted by an unknown ordering of the letters; recover an ordering that explains
 * it. Each adjacent pair of words gives at most one "letter x before letter y" fact (at their first
 * difference), and the answer is a topological order of those facts. A longer word before its own
 * prefix, or a cycle of facts, means no ordering works.
 *
 * Many orderings are usually valid, so the answer is pinned down: the one that is smallest in
 * ordinary alphabetical comparison. Kahn's algorithm that always takes the smallest ready letter
 * produces exactly that (same trick as Course Order). With 26 letters a linear scan for the
 * smallest ready letter is enough: O(C + 26^2) for C characters in total.
 *
 * Limits are raised to 2 * 10^4 words of up to 50 letters, so comparing every pair of words
 * instead of adjacent ones does about 2 * 10^8 comparisons and times out.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_WORDS = 20000;
const MAX_LEN = 50;
const A = 'a'.charCodeAt(0);
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Reference: one edge per adjacent pair at the first difference, then Kahn's algorithm taking
 * the smallest ready letter each step.
 * @param {string[]} words
 * @returns {string}
 */
export function reference(words) {
  const present = new Array(26).fill(false);
  for (const w of words) for (let i = 0; i < w.length; i++) present[w.charCodeAt(i) - A] = true;
  const edge = Array.from({ length: 26 }, () => new Array(26).fill(false));
  const indeg = new Array(26).fill(0);
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i];
    const b = words[i + 1];
    const m = Math.min(a.length, b.length);
    let j = 0;
    while (j < m && a[j] === b[j]) j++;
    if (j === m) {
      // A word cannot come before its own proper prefix in any ordering.
      if (a.length > b.length) return '';
      continue;
    }
    const u = a.charCodeAt(j) - A;
    const v = b.charCodeAt(j) - A;
    if (!edge[u][v]) {
      edge[u][v] = true;
      indeg[v]++;
    }
  }
  const total = present.filter(Boolean).length;
  const used = new Array(26).fill(false);
  let out = '';
  while (out.length < total) {
    let pick = -1;
    for (let c = 0; c < 26; c++) {
      if (present[c] && !used[c] && indeg[c] === 0) {
        pick = c;
        break;
      }
    }
    // Letters remain but none is free: they sit on a cycle.
    if (pick === -1) return '';
    used[pick] = true;
    out += ALPHABET[pick];
    for (let v = 0; v < 26; v++) if (edge[pick][v]) indeg[v]--;
  }
  return out;
}

/** A seeded shuffle of the alphabet: the hidden ordering for generated cases. */
function secretOrder(rnd, letters = 26) {
  const order = ALPHABET.slice(0, letters).split('');
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.join('');
}

/** Sorts words by the given ordering (prefix first), the way the input is promised to be sorted. */
function sortBy(words, order) {
  const rank = {};
  [...order].forEach((ch, i) => (rank[ch] = i));
  return words.sort((a, b) => {
    const m = Math.min(a.length, b.length);
    for (let i = 0; i < m; i++) if (a[i] !== b[i]) return rank[a[i]] - rank[b[i]];
    return a.length - b.length;
  });
}

/**
 * `n` random words over `letters` letters sorted by a secret ordering. With `sharedPrefix` the
 * words share long common starts, so the first difference sits deep inside them.
 */
function sortedWords(seed, n, letters, sharedPrefix = 0) {
  const rnd = mulberry32(seed);
  const order = secretOrder(rnd, letters);
  const pickLetter = () => order[Math.floor(rnd() * letters)];
  const stems = Array.from({ length: 8 }, () => Array.from({ length: sharedPrefix }, pickLetter).join(''));
  const words = Array.from({ length: n }, () => {
    const stem = stems[Math.floor(rnd() * stems.length)];
    const len = 1 + Math.floor(rnd() * (MAX_LEN - stem.length));
    return stem + Array.from({ length: len }, pickLetter).join('');
  });
  return sortBy(words, order);
}

/** A valid sorted list with one contradiction at the very end, so early exits do not help. */
function brokenAtEnd(seed, n, kind) {
  const words = sortedWords(seed, n - 1, 26);
  if (kind === 'prefix') {
    // The last word's proper prefix follows it: invalid in any ordering. A one-letter last word
    // is doubled first ("z" then "zz" stays sorted) so it has a proper prefix.
    let last = words[words.length - 1];
    if (last.length < 2) words[words.length - 1] = last += last;
    words.push(last.slice(0, -1));
  } else {
    // The list already ranks the first word's first letter before the last word's first letter;
    // a final one-letter word repeating the first letter claims the opposite, closing a cycle.
    words.push(words[0][0]);
  }
  return words;
}

const visible = [
  { args: [['cb', 'ca', 'ab', 'ad']], expected: 'bcad', note: 'b before a (from cb, ca), c before a (from ca, ab), b before d (from ab, ad). Of the orders that fit, bcad is first alphabetically.' },
  { args: [['xz', 'xy']], expected: 'xzy', note: 'Only z before y is known; x has no constraint, so it goes first.' },
  { args: [['b', 'c', 'a', 'b']], expected: '', note: 'b before c, c before a and a before b form a cycle.' },
  { args: [['abc', 'ab']], expected: '', note: 'A word can never come before its own prefix.' },
  { args: [['zebra']], expected: 'aberz', note: 'One word gives no facts, so the letters come in plain alphabetical order.' },
];

// Hidden tests: duplicates, a valid prefix pair, only the first difference counts (using every
// differing position gives "cab"), letters seen only late, a three-letter cycle hidden behind
// other facts, and four lists at 2 * 10^4 words (two valid, one broken at the last pair each way).
const hiddenInputs = [
  ['ab', 'ab'],
  ['ab', 'abc'],
  ['ca', 'ab'],
  ['ab', 'ac', 'zq'],
  ['wa', 'wb', 'xa', 'ya', 'yc', 'za', 'zb', 'cb', 'cz', 'yd'],
  sortedWords(7, 300, 8),
  sortedWords(11, MAX_WORDS, 26),
  sortedWords(13, MAX_WORDS, 26, 45),
  brokenAtEnd(17, MAX_WORDS, 'prefix'),
  brokenAtEnd(19, MAX_WORDS, 'cycle'),
];

/** @param {unknown} w */
const isLowerWord = (w) => typeof w === 'string' && w.length >= 1 && w.length <= MAX_LEN && /^[a-z]+$/.test(w);

export const problem = {
  id: 'glyph-order',
  title: 'Glyph Order',
  difficulty: 'Hard',
  topics: ['graphs'],
  patterns: ['Topological Sort', 'Graph Building'],
  timeLimitMs: 2000,
  argNames: ['words'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A newly found script uses the 26 lowercase English letters, but ranks them in an unknown
    order. You are given <code>words</code>, a word list from this script that is claimed to be
    sorted by that order.</p>
    <p>Sorted means: to compare two words, find the first position where they differ; the word whose
    letter ranks earlier comes first. If one word is a prefix of the other, the shorter word comes
    first. Equal words may appear next to each other.</p>
    <p>Return a string that holds every letter appearing in <code>words</code> exactly once, ranked
    in an order under which the list is sorted. Several orders usually fit; return the one that
    comes first in ordinary alphabetical comparison. If no order fits, return <code>""</code>.</p>
  `,
  constraints: [
    '1 <= words.length <= 2 * 10^4',
    '1 <= words[i].length <= 50',
    'words[i] consists of lowercase English letters',
    'Target complexity: O(C + 26^2) time for C letters in total',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `words = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Take two neighboring words in the list. What, exactly, does their order tell you about the letters, and where?',
    'Do you need to compare words that are not next to each other, or do neighbors already carry every fact?',
    'Once you have "x comes before y" facts, what kind of ordering are you looking for, and when does none exist?',
    'Is there a pair of neighboring words that is impossible no matter how the letters are ranked?',
    'Several letters may be free to go next. Which one should you take so the result is first alphabetically?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Turn the list into a graph on letters, then sort the graph. For each pair of neighboring
    words, the first position where they differ gives one edge: the upper word's letter comes before
    the lower word's letter. Then run Kahn's algorithm, and at every step take the alphabetically
    smallest letter that has no remaining incoming edge.</p>
    <h4>Why it works</h4>
    <p>Sortedness is transitive, so neighbors carry every fact the list holds. Letters after the first
    difference say nothing. A topological order of the edges is exactly an order under which the
    list is sorted. Taking the smallest free letter first never blocks a smaller choice later, so the
    result is the first valid order alphabetically. If letters remain but none is free, they lie on a
    cycle.</p>
    <h4>Complexity</h4>
    <p>O(C + 26^2) time for C letters in total: one pass over neighboring pairs, then at most 26
    picks, each a scan of 26 letters. O(26^2) extra space for the edge table.</p>
    <h4>Pitfall</h4>
    <p>A longer word directly above its own prefix (<code>"abc"</code> then <code>"ab"</code>) has no
    differing position, yet no order allows it. Return <code>""</code> for it instead of skipping the
    pair. Also include letters that appear in no edge.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'glyphOrder',
    params: [{ name: 'words', type: 'string[]' }],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((words) => ({ args: [words], expected: reference(words) })),

  /**
   * Custom input: the words as one JSON array of strings.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let words;
    try {
      words = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the words as a JSON array of strings, for example ["cb","ca","ab"].' };
    }
    if (!Array.isArray(words) || words.length < 1 || words.length > MAX_WORDS) {
      return { ok: false, error: 'Enter between 1 and 2 * 10^4 words as a JSON array.' };
    }
    if (!words.every(isLowerWord)) return { ok: false, error: 'Each word is 1 to 50 lowercase letters a-z.' };
    return { ok: true, args: [words] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
