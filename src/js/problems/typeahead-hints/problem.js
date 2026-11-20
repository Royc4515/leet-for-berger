/**
 * Problem: Typeahead Hints
 *
 * Equivalent to LeetCode 1268; statement and tests are written for this project. A shop types a
 * search word one letter at a time; after each letter, suggest the (at most) three product names
 * that start with what has been typed so far and come first in dictionary order. Sort the names
 * once: all names with a given prefix sit side by side, so a binary search finds the first one
 * and the next two neighbors are the suggestions. A trie that keeps three names per node works
 * as well.
 *
 * Limits are raised past the original (5 * 10^4 names), so sorting and filtering the full list again
 * for every letter is slow when every name shares a long prefix.
 *
 * Classic wrong answers: keeping the names in input order, matching the word anywhere in a name
 * instead of at its start, ordering by length instead of dictionary order, and returning every
 * match instead of three.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_PRODUCTS = 50000;
const MAX_LEN = 30;

/**
 * Reference: sort once, then for each prefix binary-search its first match and read up to three.
 * @param {string[]} products
 * @param {string} searchWord
 * @returns {string[][]}
 */
export function reference(products, searchWord) {
  const sorted = [...products].sort();
  const out = [];
  let lo = 0;
  for (let i = 1; i <= searchWord.length; i++) {
    const prefix = searchWord.slice(0, i);
    // Matches for a longer prefix are a subset of those for a shorter one, so the search window
    // only ever moves right.
    let a = lo;
    let b = sorted.length;
    while (a < b) {
      const mid = (a + b) >> 1;
      if (sorted[mid] < prefix) a = mid + 1;
      else b = mid;
    }
    lo = a;
    const row = [];
    for (let j = a; j < sorted.length && row.length < 3 && sorted[j].startsWith(prefix); j++) row.push(sorted[j]);
    out.push(row);
  }
  return out;
}

/** `count` distinct random names over `alphabet`, lengths minLen..MAX_LEN. */
function randomNames(seed, count, alphabet, minLen = 1) {
  const rnd = mulberry32(seed);
  const seen = new Set();
  while (seen.size < count) {
    const len = minLen + Math.floor(rnd() * (MAX_LEN - minLen + 1));
    let w = '';
    for (let i = 0; i < len; i++) w += alphabet[Math.floor(rnd() * alphabet.length)];
    seen.add(w);
  }
  return [...seen];
}

/** Every name is the same 22-letter prefix followed by six letters from `alphabet`. */
function sharedPrefixNames(seed, count, alphabet) {
  const rnd = mulberry32(seed);
  const seen = new Set();
  while (seen.size < count) {
    let w = 'z'.repeat(22);
    for (let i = 0; i < 6; i++) w += alphabet[Math.floor(rnd() * alphabet.length)];
    seen.add(w);
  }
  return [...seen];
}

const visible = [
  {
    args: [['mobile', 'mouse', 'moneypot', 'monitor', 'mousepad'], 'mouse'],
    expected: [['mobile', 'moneypot', 'monitor'], ['mobile', 'moneypot', 'monitor'], ['mouse', 'mousepad'], ['mouse', 'mousepad'], ['mouse', 'mousepad']],
    note: 'After "m" five names match but only the first three in dictionary order are shown; from "mou" on, two remain.',
  },
  {
    args: [['havana'], 'havana'],
    expected: [['havana'], ['havana'], ['havana'], ['havana'], ['havana'], ['havana']],
    note: 'A single product is suggested after every letter.',
  },
  {
    args: [['bags', 'baggage', 'banner', 'box', 'cloths'], 'bags'],
    expected: [['baggage', 'bags', 'banner'], ['baggage', 'bags', 'banner'], ['baggage', 'bags'], ['bags']],
    note: '"bag" matches only "baggage" and "bags"; the full word "bags" matches itself.',
  },
  {
    args: [['abc', 'abd'], 'x'],
    expected: [[]],
    note: 'No product starts with "x", so the list for that letter is empty.',
  },
  {
    args: [['abcde', 'a', 'abcd', 'ab', 'abc'], 'abcde'],
    expected: [['a', 'ab', 'abc'], ['ab', 'abc', 'abcd'], ['abc', 'abcd', 'abcde'], ['abcd', 'abcde'], ['abcde']],
    note: 'A name equal to the typed prefix sorts before every longer name that starts with it.',
  },
];

// Hidden tests: one product, a first letter that matches nothing, ties at the three-name cap,
// names that dictionary order and length order rank differently, input given in reverse order,
// names that contain the word without starting with it, and four lists of 5 * 10^4 names: two over a
// tiny alphabet (long shared prefixes), one where every name shares 22 letters, and one over the
// full alphabet where the word stops matching halfway.
const bigAb = randomNames(31, MAX_PRODUCTS, 'ab');
const bigAbc = randomNames(37, MAX_PRODUCTS, 'abc', 20);
const bigShared = sharedPrefixNames(41, MAX_PRODUCTS, 'abcdefgh');
const bigWide = randomNames(43, MAX_PRODUCTS, 'abcdefghijklmnopqrstuvwxyz');
const hiddenArgs = [
  [['a'], 'a'],
  [['b'], 'abc'],
  [['apple', 'apply', 'apt', 'app', 'ape', 'apex'], 'apple'],
  [['abcd', 'abd', 'ab', 'abcde', 'b'], 'abcd'],
  [['cb', 'ca', 'c', 'caa', 'cab'], 'cab'],
  [['acar', 'car', 'bcar', 'cart', 'carbon'], 'carbon'],
  [bigAb, bigAb[1234].slice(0, MAX_LEN)],
  [bigAbc, 'a'.repeat(MAX_LEN)],
  [bigShared, 'z'.repeat(22) + 'abcdef'],
  [bigWide, bigWide[777].slice(0, 2) + 'qqqqqqqq'],
];

export const problem = {
  id: 'typeahead-hints',
  title: 'Typeahead Hints',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Sorting', 'Binary Search', 'Trie'],
  timeLimitMs: 2000,
  argNames: ['products', 'searchWord'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A shop has a list of distinct product names <code>products</code>. A customer types the
    string <code>searchWord</code> one letter at a time. After each letter, the shop suggests up to
    three product names that start with what has been typed so far. If more than three names
    match, suggest the three that come first in dictionary order.</p>
    <p>Return a list with one entry per typed letter: the suggestions for the first letter, for the
    first two letters, and so on. Each entry lists its names in dictionary order. It is shorter
    than three when fewer names match, and empty when none does.</p>
  `,
  constraints: [
    '1 <= products.length <= 5 * 10^4',
    '1 <= products[i].length <= 30',
    '1 <= searchWord.length <= 30',
    'Names and the search word use lowercase English letters only',
    'All product names are distinct',
    'Target complexity: O(n log n) to sort once, then O(L log n) for a search word of length L',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `products = ${JSON.stringify(t.args[0])}, searchWord = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which names start with "ab"? If the names were sorted, where would they sit relative to each other?',
    'Once the list is sorted, how can you find the first name that is at least as large as the typed prefix without scanning everything?',
    'From that first position, how many names do you need to look at, and what stops the scan early?',
    'When you type one more letter, can the matching names ever include one that did not match before?',
    'A trie keeps names grouped by prefix. What would you store at each node so the three suggestions are ready without a search?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Sort the names once. In sorted order every name that starts with a given prefix forms one
    block, and the block begins at the first name that is not smaller than the prefix. For each
    typed prefix, binary search that position, then read up to three names while they still start
    with the prefix.</p>
    <h4>Why it works</h4>
    <p>A name that starts with the prefix is never smaller than it, and anything between the prefix
    and the last such name also starts with it, so the block is contiguous. The first three names
    of the block are exactly the three smallest matches. Because a longer prefix only keeps a
    subset of the shorter one's matches, the search window can start where the last one began.</p>
    <h4>Complexity</h4>
    <p>O(n log n) for the sort, then O(log n + 3) comparisons per typed letter. Total
    O(n log n + L log n). A trie with three kept names per node answers each letter in O(1)
    after an O(total length) build.</p>
    <h4>Pitfall</h4>
    <p>Filtering and sorting the entire list again for every letter works on tiny inputs but is
    far too slow when 5 * 10^4 names share a long prefix. Match at the start of the name, not anywhere
    inside it, order names by dictionary order, not by length, and keep exactly three.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'suggestNames',
    params: [
      { name: 'products', type: 'string[]' },
      { name: 'searchWord', type: 'string' },
    ],
    returns: 'string[][]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, products as a JSON array and searchWord as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: products as a JSON array, then searchWord as a JSON string.' };
    let products;
    let word;
    try {
      products = JSON.parse(lines[0]);
      word = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON, for example ["mobile","mouse"] and "mouse".' };
    }
    if (!Array.isArray(products) || products.length < 1 || products.length > MAX_PRODUCTS) return { ok: false, error: 'products must have 1 to 5 * 10^4 names.' };
    if (!products.every((p) => typeof p === 'string' && p.length >= 1 && p.length <= MAX_LEN && /^[a-z]+$/.test(p))) {
      return { ok: false, error: 'Each name must be 1 to 30 lowercase letters.' };
    }
    if (new Set(products).size !== products.length) return { ok: false, error: 'Product names must be distinct.' };
    if (typeof word !== 'string' || word.length < 1 || word.length > MAX_LEN || !/^[a-z]+$/.test(word)) {
      return { ok: false, error: 'searchWord must be 1 to 30 lowercase letters.' };
    }
    return { ok: true, args: [products, word] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
