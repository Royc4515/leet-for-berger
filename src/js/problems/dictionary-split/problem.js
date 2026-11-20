/**
 * Problem: Dictionary Split
 *
 * Equivalent to LeetCode 139; statement and tests are written for this project. Decide whether a
 * string can be cut into consecutive pieces that are all dictionary words, each word reusable.
 * A prefix table over "can the first i characters be split" answers it in one pass.
 *
 * Classic wrong answers: always taking the longest (or the shortest) word that fits at the current
 * spot, which commits too early; letting each word be used once; and trying every cut with plain
 * recursion, which repeats the same suffix an exponential number of times on "aaa...ab".
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_TEXT = 2000;
const MAX_WORDS = 2000;
const MAX_WORD_LEN = 20;

/**
 * Reference: reach[i] says the first i characters split cleanly.
 * @param {string} text
 * @param {string[]} words
 * @returns {boolean}
 */
export function reference(text, words) {
  const dict = new Set(words);
  const lens = [...new Set(words.map((w) => w.length))];
  const reach = new Uint8Array(text.length + 1);
  reach[0] = 1;
  for (let i = 1; i <= text.length; i++) {
    for (const len of lens) {
      if (len <= i && reach[i - len] && dict.has(text.slice(i - len, i))) {
        reach[i] = 1;
        break;
      }
    }
  }
  return reach[text.length] === 1;
}

/** Up to `count` distinct random words over `alphabet`, lengths 1..maxLen, each ending in `tail`. */
function randomWords(rnd, count, alphabet, maxLen, tail = '') {
  const seen = new Set();
  let guard = 0;
  while (seen.size < count && guard++ < count * 50) {
    const len = Math.max(tail.length, 1 + Math.floor(rnd() * maxLen));
    let w = '';
    for (let i = 0; i < len - tail.length; i++) w += alphabet[Math.floor(rnd() * alphabet.length)];
    seen.add(w + tail);
  }
  return [...seen];
}

/** A text of exactly `length` characters glued from dictionary words (the dictionary has 1-letter words). */
function glued(rnd, words, length) {
  let text = '';
  while (text.length < length) {
    const w = words[Math.floor(rnd() * words.length)];
    if (text.length + w.length <= length) text += w;
    else text += words.find((x) => x.length === 1);
  }
  return text;
}

const unique = (list) => [...new Set(list)];
const aRun = (n) => 'a'.repeat(n);
// a, aa, ..., a^k: every piece is a run of a.
const aWords = (k) => Array.from({ length: k }, (_, i) => aRun(i + 1));

const visible = [
  { args: ['leetcode', ['leet', 'code']], expected: true, note: '"leet" followed by "code".' },
  { args: ['applepenapple', ['apple', 'pen']], expected: true, note: 'A word may be used more than once: "apple", "pen", "apple".' },
  { args: ['catsandog', ['cats', 'dog', 'sand', 'and', 'cat']], expected: false, note: 'Every cut leaves "og" or "an" behind, and neither is a word.' },
  { args: ['abcd', ['a', 'abc', 'b', 'cd']], expected: true, note: 'Taking the longest word "abc" first dead-ends; "a", "b", "cd" works.' },
  { args: ['aaaa', ['a']], expected: true, note: 'One short word covers the whole text when it is reused.' },
];

// Random dictionaries include the three single letters, so any remainder can be filled.
const gluedWords = unique(['a', 'b', 'c', ...randomWords(mulberry32(5), 1500, 'abc', MAX_WORD_LEN)]);
const gluedWords2 = unique(['a', 'b', ...randomWords(mulberry32(6), 1800, 'ab', MAX_WORD_LEN)]);
// Every word ends in "a", so a text ending in "b" can never be split, however much of it matches.
const endInA = unique(['a', ...randomWords(mulberry32(7), 1500, 'ab', MAX_WORD_LEN, 'a')]);
const nearText = glued(mulberry32(8), endInA, MAX_TEXT - 1) + 'b';

// Hidden tests: one letter each way, a word reused, the "commit too early" shapes for longest-first and
// shortest-first, a word that is the whole text, the "aaa...ab" text at full length (exponential
// for plain recursion), random dictionaries that do and do not glue the text, and a near-miss
// whose words all end in "a" while the text ends in "b".
const hiddenArgs = [
  ['a', ['a']],
  ['b', ['a']],
  ['abab', ['ab']],
  ['aaab', ['a', 'aaab']],
  ['abcdef', ['ab', 'abc', 'cd', 'def', 'abcd']],
  [aRun(MAX_TEXT - 1) + 'b', aWords(MAX_WORD_LEN)],
  [glued(mulberry32(3), gluedWords, MAX_TEXT), gluedWords],
  [glued(mulberry32(4), gluedWords2, MAX_TEXT - 1) + 'b', gluedWords2],
  [aRun(MAX_TEXT), aWords(MAX_WORD_LEN).slice(1)],
  [nearText, endInA],
];

export const problem = {
  id: 'dictionary-split',
  title: 'Dictionary Split',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Prefix Table', 'Hash Set'],
  timeLimitMs: 2000,
  argNames: ['text', 'words'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a string <code>text</code> and a list of distinct strings <code>words</code>.
    Return <code>true</code> if <code>text</code> can be cut into consecutive pieces so that every
    piece is one of the <code>words</code>, and <code>false</code> otherwise.</p>
    <p>A word may be used any number of times, or not at all. The pieces must cover the whole text,
    in order, with nothing left over.</p>
  `,
  constraints: [
    '1 <= text.length <= 2000',
    '1 <= words.length <= 2000',
    '1 <= words[i].length <= 20',
    'text and words[i] use lowercase English letters only',
    'All words are distinct',
    'Target complexity: O(text.length * longest word) hash lookups, or O(text.length * words.length)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `text = ${JSON.stringify(t.args[0])}, words = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you always grab the longest word that fits at the current position, can you think of a dictionary where that traps you?',
    'Suppose you already knew whether the first i characters can be split. What would that tell you about the first i + 1, or i + 5?',
    'For a given end position, which earlier positions do you need to look at, and how many characters can a single word span?',
    'How many different ways can plain recursion reach the same suffix, and what could you store to avoid redoing that work?',
    'What is the answer for the empty prefix, and which entry of your table is the final answer?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep a table where entry <code>i</code> says whether the first <code>i</code> characters can
    be split into words. The empty prefix is fine. Entry <code>i</code> is true when some word
    ends exactly at position <code>i</code>, that word is in the dictionary, and the entry just
    before it is true.</p>
    <h4>Why it works</h4>
    <p>Any valid split of the first <code>i</code> characters has a last word, and what is left
    before it is a valid split of a shorter prefix. So the table only ever needs shorter entries,
    and the last entry is the answer for the whole text.</p>
    <h4>Complexity</h4>
    <p>For each end position, try each word length that occurs in the dictionary (at most 20) and
    look the piece up in a hash set: about 2000 * 20 lookups. O(n * L) time, O(n + total word
    size) space.</p>
    <h4>Pitfall</h4>
    <p>Committing to the longest or the shortest word at each step fails on small dictionaries
    like <code>a, abc, b, cd</code>. Trying every cut with plain recursion repeats the same suffix
    over and over: on <code>aaa...ab</code> it takes exponential time, so remember which positions
    already failed.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'canSplit',
    params: [
      { name: 'text', type: 'string' },
      { name: 'words', type: 'string[]' },
    ],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, the text as a JSON string and the words as a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: text as a JSON string, then words as a JSON array.' };
    let text;
    let words;
    try {
      text = JSON.parse(lines[0]);
      words = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON, for example "leetcode" and ["leet","code"].' };
    }
    if (typeof text !== 'string' || text.length < 1 || text.length > MAX_TEXT) return { ok: false, error: 'text must have 1 to 2000 characters.' };
    if (!/^[a-z]+$/.test(text)) return { ok: false, error: 'text must use lowercase letters only.' };
    if (!Array.isArray(words) || words.length < 1 || words.length > MAX_WORDS) return { ok: false, error: 'words must have 1 to 2000 entries.' };
    if (!words.every((w) => typeof w === 'string' && w.length >= 1 && w.length <= MAX_WORD_LEN && /^[a-z]+$/.test(w))) {
      return { ok: false, error: 'Each word must be 1 to 20 lowercase letters.' };
    }
    if (new Set(words).size !== words.length) return { ok: false, error: 'Words must be distinct.' };
    return { ok: true, args: [text, words] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
