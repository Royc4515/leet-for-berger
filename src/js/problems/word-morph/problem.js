/**
 * Problem: Word Morph
 *
 * Shortest chain from beginWord to endWord changing one letter at a time, every intermediate
 * word taken from a dictionary. Words are graph nodes, one-letter differences are edges, and
 * BFS finds the shortest chain. The cost is in finding neighbours: comparing every pair of words
 * is O(N^2 * L), while trying all 25 replacements at each position and looking them up in a hash
 * set is O(N * L * 26) (with O(L) hashing per lookup).
 *
 * The dictionary limit is raised from LeetCode's 5000 to 2 * 10^4 words, so the pairwise
 * comparison (about 2 * 10^8 pairs) is clearly too slow.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 10;
const MAX_WORDS = 20000;

/**
 * Reference: BFS from beginWord, generating neighbours letter by letter.
 * @param {string} beginWord
 * @param {string} endWord
 * @param {string[]} wordList
 * @returns {number} words in the shortest chain, or 0
 */
export function reference(beginWord, endWord, wordList) {
  const unvisited = new Set(wordList);
  if (!unvisited.has(endWord)) return 0;
  unvisited.delete(beginWord);
  let frontier = [beginWord];
  let length = 1;
  while (frontier.length) {
    length++;
    const next = [];
    for (const word of frontier) {
      for (let i = 0; i < word.length; i++) {
        for (let c = 97; c < 123; c++) {
          const candidate = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);
          if (!unvisited.has(candidate)) continue;
          if (candidate === endWord) return length;
          unvisited.delete(candidate);
          next.push(candidate);
        }
      }
    }
    frontier = next;
  }
  return 0;
}

/** count distinct random words of length len over the first `letters` letters, excluding `avoid`. */
function randomWords(rnd, count, len, letters, avoid = new Set()) {
  const out = new Set();
  while (out.size < count) {
    let w = '';
    for (let i = 0; i < len; i++) w += String.fromCharCode(97 + Math.floor(rnd() * letters));
    if (!avoid.has(w)) out.add(w);
  }
  return [...out];
}

/** Fisher-Yates shuffle with a seeded generator. */
function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** A dense random dictionary of `count` words; begin is an extra word, end is one of the list. */
function randomCase(seed, count, len, letters) {
  const rnd = mulberry32(seed);
  const words = randomWords(rnd, count + 1, len, letters);
  return [words[0], words[count], shuffle(words.slice(1), rnd)];
}

/**
 * A forced long chain: positions advance in turn (aaa, baa, bba, bbb, cbb, ...), so two words of
 * the chain that are not neighbours differ in at least two positions and there is no shortcut.
 * Random noise words with letters beyond the chain's are mixed in.
 */
function longChain(seed, len, steps, noise) {
  const rnd = mulberry32(seed);
  const chain = [];
  const w = Array(len).fill(97);
  chain.push(String.fromCharCode(...w));
  for (let s = 0; s < steps; s++) {
    w[s % len]++;
    chain.push(String.fromCharCode(...w));
  }
  const noiseWords = randomWords(rnd, noise, len, 26, new Set(chain));
  return [chain[0], chain[chain.length - 1], shuffle([...chain.slice(1), ...noiseWords], rnd)];
}

/** A dense dictionary of `count` words where endWord sits in its own corner: no neighbours. */
function unreachableCase(seed, count, len, letters) {
  // Extra words make up for the neighbours of endWord that are filtered out.
  const [begin, end, list] = randomCase(seed, count + 100, len, letters);
  const differsByOne = (a, b) => {
    let d = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++d > 1) return false;
    return d === 1;
  };
  const rest = list.filter((word) => word !== end && !differsByOne(word, end)).slice(0, count - 1);
  return [begin, end, [...rest.slice(0, count >> 1), end, ...rest.slice(count >> 1)]];
}

const visible = [
  { args: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog']], expected: 5, note: 'hit -> hot -> dot -> dog -> cog has 5 words.' },
  { args: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log']], expected: 0, note: 'cog is not in the word list, so it cannot be reached.' },
  { args: ['a', 'c', ['a', 'b', 'c']], expected: 2, note: 'One change: a -> c.' },
  { args: ['lost', 'cost', ['most', 'fist', 'lost', 'cost', 'fish']], expected: 2, note: 'beginWord may itself appear in the list.' },
  { args: ['cold', 'warm', ['cord', 'card', 'ward', 'warm', 'word', 'worm', 'wore']], expected: 5, note: 'cold -> cord -> card -> ward -> warm.' },
];

// Hidden tests: endWord one letter away but missing from the list, a list holding only begin and
// end two letters apart, a forced 251-word chain of 10-letter words (a DFS that stops at the
// first chain found answers too long), a dense random graph, and two 2 * 10^4-word dictionaries
// (reachable and unreachable) where pairwise comparison is too slow.
const hiddenArgs = [
  ['ab', 'ac', ['ad', 'bc', 'bd']],
  ['hot', 'dog', ['hot', 'dog']],
  ['abc', 'abd', ['abd']],
  ['dove', 'mark', ['dove', 'dave', 'cave', 'care', 'dare', 'dark', 'mark', 'move', 'more', 'mare', 'mork']],
  longChain(5, MAX_LEN, 250, 2000),
  randomCase(7, 3000, 4, 8),
  randomCase(11, 400, 3, 9),
  randomCase(13, MAX_WORDS, 7, 6),
  unreachableCase(17, MAX_WORDS, 7, 6),
  randomCase(19, MAX_WORDS, 6, 7),
];

export const problem = {
  id: 'word-morph',
  title: 'Word Morph',
  difficulty: 'Hard',
  topics: ['graphs'],
  patterns: ['BFS', 'Implicit Graph', 'Hash Set'],
  milestone: 2,
  timeLimitMs: 4000,
  argNames: ['beginWord', 'endWord', 'wordList'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given two words, <code>beginWord</code> and <code>endWord</code>, and a dictionary
    <code>wordList</code>. A <em>morph chain</em> starts at <code>beginWord</code> and changes
    exactly one letter at each step; every word after the first, including the last one, must be
    in <code>wordList</code>. <code>beginWord</code> itself does not need to be in the list.</p>
    <p>Return the number of words in the shortest chain that ends at <code>endWord</code>,
    counting both ends, or <code>0</code> if no such chain exists.</p>
  `,
  constraints: [
    '1 <= beginWord.length <= 10',
    'endWord.length == beginWord.length; beginWord != endWord',
    '1 <= wordList.length <= 2 * 10^4 (raised from LeetCode\'s 5000)',
    'All words have the same length and consist of lowercase English letters',
    'The words in wordList are distinct',
    'Target complexity: O(N * L * 26) word generations with O(L) hashing each (comparing all pairs is too slow)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `beginWord = ${JSON.stringify(t.args[0])}, endWord = ${JSON.stringify(t.args[1])}, wordList = ${JSON.stringify(t.args[2])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If every word is a node, what connects two nodes? What kind of search finds the fewest steps?',
    'Why does depth-first search not give you the shortest chain directly?',
    'Comparing a word with every other word is slow for 2 * 10^4 words. How many words can differ from a given word in exactly one letter?',
    'How do you make sure a word is never queued twice, and what can you do with it once it is queued?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'ladderLength',
    params: [
      { name: 'beginWord', type: 'string' },
      { name: 'endWord', type: 'string' },
      { name: 'wordList', type: 'string[]' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: three lines of JSON, beginWord, endWord and wordList.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 3) return { ok: false, error: 'Enter three lines: beginWord and endWord as JSON strings, then wordList as a JSON array.' };
    let begin;
    let end;
    let list;
    try {
      [begin, end, list] = lines.map((l) => JSON.parse(l));
    } catch {
      return { ok: false, error: 'All three lines must be valid JSON.' };
    }
    const isWord = (w) => typeof w === 'string' && /^[a-z]{1,10}$/.test(w);
    if (!isWord(begin) || !isWord(end)) return { ok: false, error: 'beginWord and endWord must be 1 to 10 lowercase letters.' };
    if (begin.length !== end.length || begin === end) return { ok: false, error: 'beginWord and endWord must differ and have the same length.' };
    if (!Array.isArray(list) || list.length < 1 || list.length > MAX_WORDS) return { ok: false, error: 'wordList must have 1 to 2 * 10^4 words.' };
    if (!list.every((w) => isWord(w) && w.length === begin.length)) return { ok: false, error: 'Every word must be lowercase letters with the same length as beginWord.' };
    if (new Set(list).size !== list.length) return { ok: false, error: 'Words in wordList must be distinct.' };
    return { ok: true, args: [begin, end, list] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1], args[2]),
};

export default problem;
