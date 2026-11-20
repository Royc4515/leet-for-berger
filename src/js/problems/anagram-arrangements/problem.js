/**
 * Problem: Anagram Arrangements
 *
 * Count the strings obtained by rearranging the letters inside each word of a sentence. Words
 * are independent, so the answer is the product over words of the multinomial
 * len! / (c_a! * c_b! * ... * c_z!), modulo 1_000_000_007. The modulus is prime, so division
 * becomes multiplication by a modular inverse (Fermat: x^(p-2)). Precomputing factorials and
 * inverse factorials up to n makes the whole count O(n).
 *
 * The traps: computing len! exactly (it has hundreds of thousands of digits), reducing len!
 * modulo p and then dividing with ordinary integer division, and 32-bit products of residues.
 */

import { mulberry32 } from '../../engine/rng.js';
import { charString } from '../../engine/growth-inputs.js';

const MOD = 1000000007n;

/** base^e mod MOD in BigInt. */
function powMod(base, e) {
  let b = base % MOD;
  let k = e;
  let r = 1n;
  while (k > 0n) {
    if (k & 1n) r = (r * b) % MOD;
    b = (b * b) % MOD;
    k >>= 1n;
  }
  return r;
}

/**
 * Reference: per word, len! times the inverse of each letter count's factorial, all modulo p.
 * Factorials are built incrementally in BigInt; inverses come from Fermat's little theorem.
 * @param {string} s
 * @returns {number}
 */
export function reference(s) {
  const n = s.length;
  const fact = [1n];
  for (let i = 1; i <= n; i++) fact.push((fact[i - 1] * BigInt(i)) % MOD);
  let answer = 1n;
  for (const word of s.split(' ')) {
    const counts = new Map();
    for (const ch of word) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    let denominator = 1n;
    for (const c of counts.values()) denominator = (denominator * fact[c]) % MOD;
    answer = (answer * fact[word.length] * powMod(denominator, MOD - 2n)) % MOD;
  }
  return Number(answer);
}

const MAX_N = 100000;
const VALID = /^[a-z]+( [a-z]+)*$/;

/** A seeded word of `len` letters from the first k lowercase letters. */
function randomWord(rnd, len, k) {
  let w = '';
  for (let i = 0; i < len; i++) w += String.fromCharCode(97 + Math.floor(rnd() * k));
  return w;
}

/** A seeded sentence of total length exactly n, words of 1..maxLen letters from k letters. */
function randomSentence(seed, n, maxLen, k) {
  const rnd = mulberry32(seed);
  const words = [];
  let used = 0;
  while (used < n) {
    const room = n - used - (words.length ? 1 : 0);
    // A word needs at least one letter after its separating space.
    if (room < 1) {
      words[words.length - 1] += 'a';
      used++;
      continue;
    }
    const len = Math.min(room, 1 + Math.floor(rnd() * maxLen));
    words.push(randomWord(rnd, len, k));
    used += len + (words.length > 1 ? 1 : 0);
  }
  return words.join(' ');
}

const visible = [
  { args: ['too hot'], expected: 18, note: '"too" has 3!/2! = 3 arrangements, "hot" has 3! = 6. Words are rearranged independently: 3 * 6 = 18.' },
  { args: ['aa'], expected: 1, note: 'Swapping two equal letters gives the same string.' },
  { args: ['abc'], expected: 6, note: 'Three different letters: 3! = 6.' },
  { args: ['ab ab'], expected: 4, note: 'Each word has 2 arrangements, so 2 * 2 = 4.' },
  { args: ['mississippi'], expected: 34650, note: '11! / (4! * 4! * 2!) = 34650.' },
];

// Hidden tests: one letter, many single-letter words, a word whose count passes the modulus, one
// word using all 26 letters (26! is past 64 bits), then sentences of 10^5 characters: one huge
// word (a factorial with hundreds of thousands of digits), one letter repeated (answer 1), and
// random sentences with short and long words.
const hiddenArgs = [
  ['z'],
  [Array.from({ length: 50 }, (_, i) => String.fromCharCode(97 + (i % 26))).join(' ')],
  ['abcdefghijklm'],
  ['abcdefghijklmnopqrstuvwxyz'],
  ['leetcode is fun and anagrams are not'],
  [randomWord(mulberry32(283), MAX_N, 26)],
  ['q'.repeat(MAX_N)],
  [randomSentence(293, MAX_N, 8, 26)],
  [randomSentence(307, MAX_N, 2000, 3)],
  [`${randomWord(mulberry32(311), MAX_N / 2 - 1, 2)} ${randomWord(mulberry32(313), MAX_N / 2, 26)}`],
];

export const problem = {
  id: 'anagram-arrangements',
  title: 'Anagram Arrangements',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Math', 'Combinatorics', 'Modular Inverse'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A sentence <code>s</code> is a list of words separated by single spaces. Another string
    is an <em>arrangement</em> of <code>s</code> if its i-th word is a rearrangement of the
    letters of the i-th word of <code>s</code>, for every i. Words keep their positions; only
    letters within a word move.</p>
    <p>Return the number of distinct arrangements of <code>s</code> (including <code>s</code>
    itself), modulo 1&nbsp;000&nbsp;000&nbsp;007.</p>
    <p>For example, <code>"too hot"</code> has 18 arrangements, such as <code>"oot toh"</code>,
    but <code>"oth too"</code> is not one: its first word is not a rearrangement of
    <code>"too"</code>.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of lowercase English letters and single spaces, with no leading or trailing space',
    'The answer is in [0, 1000000006]',
    'Target complexity: O(n) time, plus O(log p) per modular inverse',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Does rearranging one word affect how many ways another word can be rearranged?',
    'How many orderings does a word of n different letters have? What changes when some letters repeat?',
    'You need a / b modulo a prime p, but a is already reduced modulo p. What do you multiply by instead of dividing?',
    'How do you compute that inverse quickly, and how do you avoid recomputing factorials for every word?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Words are independent, so the answer is the product over words of the multinomial
    <code>len! / (count_a! * count_b! * ...)</code>. Build the numerator and the denominator together
    in one pass, modulo 1 000 000 007, and divide once at the end with a modular inverse.</p>
    <h4>Why it works</h4>
    <p>A word of length L has L! orderings, and swapping equal letters gives the same string, so each
    distinct arrangement is counted once per permutation of every repeated letter. While scanning a
    word, the i-th letter multiplies the numerator by <code>i</code>, and the k-th copy of a letter
    multiplies the denominator by <code>k</code>, which yields exactly the factorials. The modulus is
    prime, so dividing by <code>mul</code> means multiplying by <code>mul^(p-2)</code> (Fermat).</p>
    <h4>Complexity</h4>
    <p>O(n + log p) time: constant work per character plus one fast power for the inverse. O(1) extra
    space beyond splitting the words, since each word needs only a 26-letter count.</p>
    <h4>Pitfall</h4>
    <p>Dividing with ordinary integer division after reducing modulo p. Once the numerator is a
    remainder, it is no longer divisible by the denominator, so the result is wrong. Computing the
    factorials exactly is no fix either, as they have hundreds of thousands of digits. Products of
    two residues also need 64-bit integers.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'countArrangements',
    params: [{ name: 's', type: 'string' }],
    returns: 'int',
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
        return { ok: false, error: 'Enter s as plain text or a JSON string, for example "too hot".' };
      }
    }
    if (typeof s !== 'string' || !VALID.test(s)) return { ok: false, error: 's must be lowercase words separated by single spaces, with no leading or trailing space.' };
    if (s.length > MAX_N) return { ok: false, error: 's can have at most 10^5 characters.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Words of 1 to 12 random
  // letters joined by single spaces, about n characters in all: every character multiplies both products.
  growth: {
    target: 'n',
    n: 's.length',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => {
      const rng = mulberry32(seed);
      const words = [];
      let len = 0;
      while (len < n) {
        const w = charString(1 + Math.floor(rng() * 12), rng);
        words.push(w);
        len += w.length + 1;
      }
      return [words.join(' ')];
    },
  },
};

export default problem;
