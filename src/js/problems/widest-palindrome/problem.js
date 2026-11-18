/**
 * Problem: Widest Palindrome
 *
 * The longest substring that reads the same in both directions. Checking every substring is
 * O(n^3); growing a palindrome outward from each of the 2n - 1 centers is O(n^2) and is the
 * expected interview answer; Manacher's algorithm reuses mirrored radii for O(n).
 *
 * Several substrings can share the maximum length, so the leftmost one is required. n goes up
 * to 5000 and the hidden tests are palindrome-rich (long runs of one letter with sparse breaks),
 * so the O(n^3) scan cannot finish in time while expanding around centers does.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: expand around each center, odd and even, keeping the first strictly longer find so
 * ties go to the leftmost start (centers are visited left to right).
 * @param {string} s
 * @returns {string}
 */
export function reference(s) {
  let bestStart = 0;
  let bestLen = 0;
  for (let c = 0; c < 2 * s.length - 1; c++) {
    let lo = Math.floor(c / 2);
    let hi = lo + (c % 2);
    while (lo >= 0 && hi < s.length && s[lo] === s[hi]) {
      lo--;
      hi++;
    }
    const len = hi - lo - 1;
    // Strictly longer only: for equal lengths, a later center means a later start.
    if (len > bestLen) {
      bestLen = len;
      bestStart = lo + 1;
    }
  }
  return s.slice(bestStart, bestStart + bestLen);
}

const MAX_N = 5000;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const VALID = /^[a-z0-9]+$/;

/** n seeded characters drawn from the first `k` symbols of ALPHABET. */
function randomString(seed, n, k) {
  const rnd = mulberry32(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += ALPHABET[Math.floor(rnd() * k)];
  return s;
}

/** n copies of 'a' with roughly n / gap seeded 'b' breaks: long, almost-palindromic stretches. */
function sparseBreaks(seed, n, gap) {
  const rnd = mulberry32(seed);
  const chars = new Array(n).fill('a');
  for (let i = 0; i < n / gap; i++) chars[Math.floor(rnd() * n)] = 'b';
  return chars.join('');
}

const visible = [
  { args: ['babad'], expected: 'bab', note: '"bab" and "aba" both have length 3; "bab" starts further left.' },
  { args: ['cbbd'], expected: 'bb', note: 'An even-length palindrome has no middle character.' },
  { args: ['x'], expected: 'x', note: 'A single character is a palindrome.' },
  { args: ['abcde'], expected: 'a', note: 'No two characters match, so the answer is the leftmost single character.' },
  { args: ['forgeeksskeegfor'], expected: 'geeksskeeg', note: 'The palindrome is in the middle of the string.' },
];

// Hidden tests: the whole string is the answer, an even/odd tie, a palindrome at the very end,
// digits, one letter repeated 2000 times (every substring is a palindrome), then 5000-character
// strings: two runs with sparse breaks (long near-palindromes that fail late, which is what
// sinks the O(n^3) scans) and random text where the answer is short. A run of 5000 equal letters
// is left out on purpose: it costs O(n^2) expansion about 12.5 million steps, slow in Pyodide.
const hiddenArgs = [
  ['racecar'],
  ['aaaabbbb'],
  ['abcdcbaxyzzyx'],
  ['ab12321ba9'],
  ['zyxwvutsrqpaq'],
  ['a'.repeat(2000)],
  [sparseBreaks(61, MAX_N, 400)],
  [sparseBreaks(63, MAX_N, 150)],
  [randomString(67, MAX_N, 2)],
  [randomString(71, MAX_N, 36)],
];

export const problem = {
  id: 'widest-palindrome',
  title: 'Widest Palindrome',
  difficulty: 'Medium',
  topics: ['arrays-strings', 'dp'],
  patterns: ['Two Pointers', 'Expand Around Center', 'Dynamic Programming'],
  timeLimitMs: 3000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a string <code>s</code>, return its longest substring that is a
    <em>palindrome</em>, that is, a contiguous run of characters that reads the same forwards and
    backwards.</p>
    <p>If several palindromic substrings share the maximum length, return the one that starts
    furthest to the left.</p>
    <p><code>s</code> can be 5000 characters long, so checking every substring separately is too
    slow.</p>
  `,
  constraints: [
    '1 <= s.length <= 5000',
    's consists of lowercase English letters and digits',
    'Ties: the leftmost longest palindrome',
    'Target complexity: O(n^2) time (O(n) is possible); O(n^3) times out',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you know s[i+1..j-1] is a palindrome, what single check tells you whether s[i..j] is one?',
    'Every palindrome has a middle. How many possible middles does a string of length n have?',
    'Starting from a middle, how far can you grow outward, and what does that cost per middle?',
    'Why do even-length palindromes need their own kind of middle?',
    'When two palindromes have the same length, how do you make sure you keep the leftmost?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Every palindrome grows symmetrically around a center. Manacher's algorithm finds, for each
    position, the radius of the longest odd palindrome centered there and of the longest even one
    whose right middle is there, reusing the mirror position inside the rightmost palindrome found
    so far.</p>
    <h4>Why it works</h4>
    <p>If <code>i</code> lies inside a known palindrome <code>[l, r]</code>, the text around
    <code>i</code> mirrors the text around <code>l + r - i</code>, so that radius is a valid start,
    capped at <code>r - i + 1</code> so it never claims more than is known. Character comparisons
    only happen beyond <code>r</code>, and every successful one pushes <code>r</code> to the
    right.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(n) space, because <code>r</code> only moves right. Expanding around all 2n -
    1 centers is O(n^2), which also fits n = 5000; checking every substring separately is
    O(n^3).</p>
    <h4>Pitfall</h4>
    <p>Ties go to the leftmost start. Odd and even palindromes are found in separate passes, so
    keeping the first one found is not enough: on equal length compare the start positions too. And
    forgetting even centers misses answers such as <code>"abba"</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'widestPalindrome',
    params: [{ name: 's', type: 'string' }],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: s on one line, with or without quotes.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s = raw.trim();
    if (s.startsWith('"')) {
      try {
        s = JSON.parse(s);
      } catch {
        return { ok: false, error: 'Enter s as plain text or a JSON string, for example "babad".' };
      }
    }
    if (typeof s !== 'string' || !VALID.test(s)) return { ok: false, error: 's must be lowercase letters and digits only.' };
    if (s.length > MAX_N) return { ok: false, error: 's can have at most 5000 characters.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
