/**
 * Problem: Crack Palindrome
 *
 * Change exactly one character of a palindrome so the result is no longer a palindrome, and make
 * the result the lexicographically smallest one possible; return an empty string when no single
 * change can break it. The greedy answer: the earliest change that lowers a letter wins, and a
 * palindrome is mirrored, so only the first half decides. If that half is all 'a', nothing can
 * go lower, and the cheapest break is raising the last character to 'b'.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;

/**
 * Reference: first non-'a' in the first half becomes 'a'; otherwise the last character becomes 'b'.
 * O(n) time.
 * @param {string} p a palindrome of lowercase letters
 * @returns {string} the smallest non-palindrome one change away, or "" when none exists
 */
export function reference(p) {
  const n = p.length;
  if (n < 2) return '';
  // Only indexes below n / 2: the middle of an odd palindrome mirrors itself, so lowering it
  // leaves the string a palindrome. don't touch / floor(n / 2) is exact for both parities.
  for (let i = 0; i < Math.floor(n / 2); i++) {
    if (p[i] !== 'a') return `${p.slice(0, i)}a${p.slice(i + 1)}`;
  }
  // Every letter that can change is already 'a', so raise the last one by the least possible step.
  return `${p.slice(0, n - 1)}b`;
}

/** A seeded palindrome of `len` letters from `alphabet`, whose first `prefixA` letters are 'a'. */
function palindrome(seed, len, alphabet, prefixA = 0) {
  const rnd = mulberry32(seed);
  const half = Math.floor(len / 2);
  const left = [];
  for (let i = 0; i < half; i++) left.push(i < prefixA ? 'a' : alphabet[Math.floor(rnd() * alphabet.length)]);
  const mid = len % 2 === 1 ? alphabet[Math.floor(rnd() * alphabet.length)] : '';
  return left.join('') + mid + left.slice().reverse().join('');
}

const visible = [
  { args: ['abccba'], expected: 'aaccba', note: 'Lowering the first b gives the smallest string, and it is no longer a palindrome.' },
  { args: ['a'], expected: '', note: 'A single character cannot be made to differ from its own mirror.' },
  { args: ['aa'], expected: 'ab', note: 'Nothing can go below a, so raise the last letter.' },
  { args: ['aba'], expected: 'abb', note: 'Lowering the middle b to a gives "aaa", still a palindrome; raise the last a instead.' },
  { args: ['zzz'], expected: 'azz', note: 'The first letter can drop to a, and the result is not a palindrome.' },
];

// Hidden tests: a single letter that is not 'a', the odd-length middle trap, a first non-'a'
// beyond the first position, and six palindromes of up to 10^5 letters: all 'a' with even and odd
// length, a lone middle letter, a long run of 'a' before the first other letter, an arbitrary
// random palindrome, and all 'z'.
const hiddenInputs = [
  'z',
  'aabaa',
  'racecar',
  'aaaabaaaa',
  'a'.repeat(MAX_LEN),
  'a'.repeat(MAX_LEN - 1),
  `${'a'.repeat(49999)}b${'a'.repeat(49999)}`,
  palindrome(61, MAX_LEN, 'abcdefghijklmnopqrstuvwxyz', 30000),
  palindrome(63, MAX_LEN, 'abcdefghijklmnopqrstuvwxyz'),
  'z'.repeat(MAX_LEN),
];

/** @param {string} v */
const isPalindrome = (v) => {
  for (let i = 0, j = v.length - 1; i < j; i++, j--) if (v[i] !== v[j]) return false;
  return true;
};

export const problem = {
  id: 'crack-palindrome',
  title: 'Crack Palindrome',
  difficulty: 'Medium',
  topics: ['arrays-strings', 'greedy'],
  patterns: ['Greedy', 'Strings'],
  timeLimitMs: 2000,
  argNames: ['palindrome'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You get a string <code>palindrome</code> that reads the same forwards and backwards. Replace
    <strong>exactly one</strong> character with any lowercase English letter so that the new string
    is <em>not</em> a palindrome, and, among all ways to do that, is the smallest in dictionary
    order.</p>
    <p>Return that string. If no single replacement can make it a non-palindrome, return the empty
    string <code>""</code>.</p>
    <p>A string <code>a</code> is smaller than <code>b</code> when, at the first position where they
    differ, <code>a</code> has the smaller letter.</p>
  `,
  constraints: [
    '1 <= palindrome.length <= 10^5',
    'palindrome is a palindrome of lowercase English letters',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `palindrome = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For which lengths is it impossible, and why? Try a one-letter and a two-letter palindrome.',
    'To make the result as small as possible, which position should you try to lower, the first or the last? Which letter should it become?',
    'If you lower a letter at position i, what happens to the mirror position? When does the string stay a palindrome anyway?',
    'Try "aba". Lowering the middle letter looks smart; what do you get, and why is it a trap for odd lengths?',
    'If every letter in the first half is already "a", nothing can be lowered. What is the smallest harm you can do instead?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>A one-letter string has no answer: return <code>""</code>. Otherwise scan only the first half (indexes
    below <code>n / 2</code>). The first letter that is not <code>a</code> becomes <code>a</code>, and the
    string is done. If the whole first half is already <code>a</code>, change the last character to
    <code>b</code>.</p>
    <h4>Why it works</h4>
    <p>A palindrome is determined by its first half, so changing a letter in that half always breaks it,
    as long as its mirror is a different position. The smallest string lowers the earliest letter it
    can, and the earliest non-<code>a</code> is that letter. When the first half is all <code>a</code>, no
    position can go lower, so the smallest result raises something as late as possible by the
    smallest step: the last character, from <code>a</code> to <code>b</code>.</p>
    <h4>Complexity</h4>
    <p>O(n) time, O(n) for the new string. Trying every position with every letter and testing each
    candidate for being a palindrome is O(26 n<sup>2</sup>), far too slow at 10<sup>5</sup>.</p>
    <h4>Pitfall</h4>
    <p>In an odd-length palindrome the middle letter has no mirror: lowering it to <code>a</code> still
    leaves a palindrome (<code>"aba"</code> becomes <code>"aaa"</code>). So the scan must stop before the
    middle. Changing the last character to <code>b</code> unconditionally is also wrong when an earlier
    letter can be lowered.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'crackPalindrome',
    params: [{ name: 'palindrome', type: 'string' }],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((p) => ({ args: [p], expected: reference(p) })),

  /**
   * Custom input: the palindrome as one JSON string, for example "abccba".
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let p;
    try {
      p = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the palindrome as a JSON string, for example "abccba".' };
    }
    if (typeof p !== 'string' || p.length < 1 || p.length > MAX_LEN) return { ok: false, error: 'The palindrome must have 1 to 10^5 characters.' };
    if (!/^[a-z]+$/.test(p)) return { ok: false, error: 'Use only lowercase English letters.' };
    if (!isPalindrome(p)) return { ok: false, error: 'The input must be a palindrome.' };
    return { ok: true, args: [p] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
