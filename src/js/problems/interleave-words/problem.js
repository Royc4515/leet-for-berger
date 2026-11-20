/**
 * Problem: Interleave Words
 *
 * Two words are woven into one by taking a letter from each in turn, starting with the first word.
 * When one word runs out, the rest of the other is appended. Two pointers that advance together,
 * then a tail. At 10^5 letters per word, building the answer with repeated string concatenation or
 * inserting into the middle of a growing string is where weak solutions slow down.
 */

import { mulberry32 } from '../../engine/rng.js';
import { charString } from '../../engine/growth-inputs.js';

const MAX_LEN = 100000;

/**
 * Reference: alternate while both words have letters, then append whatever is left.
 * @param {string} word1
 * @param {string} word2
 * @returns {string}
 */
export function reference(word1, word2) {
  const out = [];
  const common = Math.min(word1.length, word2.length);
  for (let i = 0; i < common; i++) out.push(word1[i], word2[i]);
  out.push(word1.slice(common), word2.slice(common));
  return out.join('');
}

/** Seeded string of length n over `alphabet`. */
function randomString(seed, n, alphabet = 'abcdefghijklmnopqrstuvwxyz') {
  const rnd = mulberry32(seed);
  let out = '';
  for (let i = 0; i < n; i++) out += alphabet[Math.floor(rnd() * alphabet.length)];
  return out;
}

const visible = [
  { args: ['abc', 'pqr'], expected: 'apbqcr', note: 'Equal lengths: a, p, b, q, c, r.' },
  { args: ['ab', 'pqrs'], expected: 'apbqrs', note: 'The first word ends after b, so "rs" is appended.' },
  { args: ['abcd', 'pq'], expected: 'apbqcd', note: 'The second word ends first, so "cd" is appended.' },
  { args: ['x', 'y'], expected: 'xy', note: 'One letter each.' },
  { args: ['hello', 'z'], expected: 'hzello', note: 'A one-letter second word is used once, near the front.' },
];

// Hidden tests: single letters, each word longer in turn, a tail that is the whole word, then
// max-size inputs: equal 10^5 + 10^5, 10^5 + 1, 1 + 10^5 and uneven random lengths.
const hiddenArgs = [
  ['a', 'b'],
  ['a', 'bcdef'],
  ['abcdef', 'z'],
  ['ababab', 'cdcd'],
  [randomString(3, 500, 'abc'), randomString(4, 777, 'xyz')],
  [randomString(5, MAX_LEN), randomString(6, MAX_LEN)],
  [randomString(7, MAX_LEN), 'q'],
  ['q', randomString(8, MAX_LEN)],
  [randomString(9, 99999), randomString(10, 31337)],
  ['a'.repeat(MAX_LEN), 'b'.repeat(MAX_LEN)],
];

export const problem = {
  id: 'interleave-words',
  title: 'Interleave Words',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Strings'],
  timeLimitMs: 2000,
  argNames: ['word1', 'word2'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given two words, <code>word1</code> and <code>word2</code>. Weave them into one
    string by taking letters in turn: first the next unused letter of <code>word1</code>, then the
    next unused letter of <code>word2</code>, and so on.</p>
    <p>When one word has no letters left, append everything that remains of the other word. Return
    the woven string.</p>
  `,
  constraints: [
    '1 <= word1.length, word2.length <= 10^5',
    'word1 and word2 consist of lowercase English letters',
    'Target complexity: O(n + m) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `word1 = ${JSON.stringify(t.args[0])}, word2 = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For "ab" and "pqrs", at which step does the first word run out, and what is left over?',
    'How many letters can you take from both words before one of them is empty?',
    'After that shared stretch, which word still has letters, and how do you find out?',
    'What happens to your running time if you build the answer by adding one letter to a string 10^5 times?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep one pointer in each word. While both words still have a letter at their pointer, write
    the letter from <code>word1</code>, then the one from <code>word2</code>, and move both pointers
    forward. Afterwards at most one word has letters left; write all of them.</p>
    <h4>Why it works</h4>
    <p>The woven string is exactly the shared stretch (length of the shorter word, two letters per
    step) followed by the unused suffix of the longer word. A loop that runs <code>min(n, m)</code>
    times and then copies one suffix produces both parts in order.</p>
    <h4>Complexity</h4>
    <p>O(n + m) time, since every letter is written once. O(n + m) space for the answer.</p>
    <h4>Pitfall</h4>
    <p>The tail belongs to whichever word is longer, and when the lengths are equal there is no tail.
    Appending only one word's remainder passes balanced tests and fails the other direction. Write
    letters into an array (or a builder) and join once instead of repeatedly extending a string.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'interleaveWords',
    params: [
      { name: 'word1', type: 'string' },
      { name: 'word2', type: 'string' },
    ],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: word1 on line 1, word2 on line 2, each a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter word1 on line 1 and word2 on line 2, each a JSON string.' };
    let a;
    let b;
    try {
      a = JSON.parse(lines[0]);
      b = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter each word as a JSON string, for example "abc" then "pqr".' };
    }
    for (const [name, w] of [['word1', a], ['word2', b]]) {
      if (typeof w !== 'string' || w.length < 1 || w.length > MAX_LEN) return { ok: false, error: `${name} must be a string of 1 to 10^5 characters.` };
      if (!/^[a-z]+$/.test(w)) return { ok: false, error: `${name} may only contain lowercase English letters.` };
    }
    return { ok: true, args: [a, b] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Words of unequal
  // length so both the shared stretch and a tail run.
  growth: {
    target: 'n',
    n: 'word1.length + word2.length',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const first = Math.floor((n * 2) / 3);
      return [charString(first, rnd), charString(n - first, rnd)];
    },
  },
};

export default problem;
