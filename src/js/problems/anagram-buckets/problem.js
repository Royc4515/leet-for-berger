/**
 * Problem: Anagram Buckets
 *
 * Group words that are rearrangements of each other. The canonical group-by-key problem: pick a
 * key that is identical for everything that belongs together (the sorted letters, or a letter
 * count), then a hash map does the grouping in one pass.
 *
 * Output order is fixed so judging is exact: groups appear in the order of their first word,
 * and words inside a group keep their input order.
 */

import { mulberry32 } from '../../engine/rng.js';

const keyOf = (w) => [...w].sort().join('');

/**
 * Reference: insertion-ordered map from sorted letters to words.
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

const MAX_N = 10000;
const MAX_LEN = 100;

/** Words drawn from `classes` base words, each shuffled, so anagram groups are large. */
function shuffledWords(seed, n, classes, len, alphabet) {
  const rnd = mulberry32(seed);
  const pick = (k) => Math.floor(rnd() * k);
  const bases = Array.from({ length: classes }, () => Array.from({ length: len }, () => alphabet[pick(alphabet.length)]));
  return Array.from({ length: n }, () => {
    const w = [...bases[pick(classes)]];
    for (let i = w.length - 1; i > 0; i--) {
      const j = pick(i + 1);
      [w[i], w[j]] = [w[j], w[i]];
    }
    return w.join('');
  });
}

const visible = [
  {
    args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']],
    expected: [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']],
    note: 'Groups appear in the order of their first word; words keep their input order.',
  },
  { args: [['']], expected: [['']], note: 'The empty word is its own group.' },
  { args: [['a']], expected: [['a']], note: 'One word, one group.' },
  { args: [['abc', 'bca', 'abc']], expected: [['abc', 'bca', 'abc']], note: 'Repeated words stay, in order.' },
  { args: [['ab', 'ba', 'abb', 'bab', 'b']], expected: [['ab', 'ba'], ['abb', 'bab'], ['b']], note: 'Same letters in different amounts are different groups.' },
];

// Hidden tests: empty words, letter counts that differ only in multiplicity, every word its own
// group, and 10^4 words of length 100 where comparing every pair of words is far too slow.
const hiddenArgs = [
  [['', '']],
  [['aab', 'aba', 'abb']],
  [['z', 'y', 'x', 'w']],
  [['listen', 'silent', 'enlist', 'google', 'gogole', 'inlets']],
  [['abcdefghijklmnopqrstuvwxyz', 'zyxwvutsrqponmlkjihgfedcba']],
  [shuffledWords(7, 500, 20, 8, 'abcdefgh')],
  [shuffledWords(11, MAX_N, 5, MAX_LEN, 'abcdefghijklmnopqrstuvwxyz')],
  [shuffledWords(13, MAX_N, 3000, 20, 'abcdefghijklmnopqrstuvwxyz')],
  [shuffledWords(17, MAX_N, MAX_N, 6, 'abcdefghijklmnopqrstuvwxyz')],
  [shuffledWords(19, 2000, 50, 3, 'ab')],
];

export const problem = {
  id: 'anagram-buckets',
  title: 'Anagram Buckets',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Hash Map', 'Group by Key'],
  timeLimitMs: 3000,
  argNames: ['words'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Two words are <strong>anagrams</strong> if one is a rearrangement of the letters of the
    other, using every letter exactly once. Given an array of lowercase <code>words</code>, put
    words that are anagrams of each other in the same group.</p>
    <p>Return the groups ordered by where their first word appears in the input. Inside a group,
    keep the words in their input order.</p>
  `,
  constraints: [
    '1 <= words.length <= 10^4',
    '0 <= words[i].length <= 100',
    'words[i] consists of lowercase English letters',
    'Target complexity: O(n * k log k) or O(n * k) for n words of length k',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `words = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'What do two anagrams have in common that a non-anagram cannot have?',
    'Can you turn each word into a key that is identical exactly for its anagrams?',
    'Once every word has a key, which structure groups by key in one pass?',
    'How do you keep the groups in first-appearance order in your language?',
  ],

  signature: {
    name: 'groupAnagrams',
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
      return { ok: false, error: 'Enter the words as a JSON array, for example ["eat","tea"].' };
    }
    if (!Array.isArray(words) || words.length < 1 || words.length > MAX_N) return { ok: false, error: 'words must have 1 to 10^4 entries.' };
    if (!words.every((w) => typeof w === 'string' && w.length <= MAX_LEN && /^[a-z]*$/.test(w))) {
      return { ok: false, error: 'Each word must be lowercase letters, at most 100 long.' };
    }
    return { ok: true, args: [words] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
