/**
 * Problem: Balanced Subsequence Count
 *
 * Equivalent to LeetCode 2539 (Count the Number of Good Subsequences); statement and tests are
 * written for this project. Count non-empty subsequences of a lowercase string where every
 * distinct character present in the subsequence occurs the exact same number of times (modulo
 * 10^9 + 7). Grouping by the shared frequency k = 1..maxFreq turns each k into an independent
 * product over the 26 letters using precomputed factorials and modular inverses:
 * O(n + 26 * maxFreq) = O(n) time.
 *
 * Classic wrong answers: subtracting 1 for the empty subsequence only once at the end instead of
 * once per frequency k, counting only k = 1 (all distinct characters), overflowing 32-bit integers
 * or JavaScript's 53-bit safe integer limit when multiplying modulo 10^9 + 7, and dividing modulo
 * 10^9 + 7 with integer division instead of a modular inverse.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 10000;
const MOD = 1000000007n;

function modPow(base, exp) {
  let res = 1n;
  let b = base % MOD;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) res = (res * b) % MOD;
    b = (b * b) % MOD;
    e >>= 1n;
  }
  return res;
}

/**
 * Reference: count letter frequencies, precompute factorials and inverse factorials up to maxFreq,
 * then sum over target frequency k = 1..maxFreq of (prod_{f >= k} (1 + C(f, k)) - 1) mod 10^9 + 7.
 * @param {string} s
 * @returns {number}
 */
export function reference(s) {
  const counts = new Int32Array(26);
  let maxFreq = 0;
  for (let i = 0; i < s.length; i++) {
    const idx = s.charCodeAt(i) - 97;
    const c = ++counts[idx];
    if (c > maxFreq) maxFreq = c;
  }
  const freqs = [];
  for (let i = 0; i < 26; i++) {
    if (counts[i] > 0) freqs.push(counts[i]);
  }

  const fact = new BigUint64Array(maxFreq + 1);
  const invFact = new BigUint64Array(maxFreq + 1);
  fact[0] = 1n;
  for (let i = 1; i <= maxFreq; i++) {
    fact[i] = (fact[i - 1] * BigInt(i)) % MOD;
  }
  invFact[maxFreq] = modPow(fact[maxFreq], MOD - 2n);
  for (let i = maxFreq; i >= 1; i--) {
    invFact[i - 1] = (invFact[i] * BigInt(i)) % MOD;
  }

  let total = 0n;
  for (let k = 1; k <= maxFreq; k++) {
    let ways = 1n;
    const invK = invFact[k];
    for (let i = 0; i < freqs.length; i++) {
      const f = freqs[i];
      if (f >= k) {
        const comb = (((fact[f] * invK) % MOD) * invFact[f - k]) % MOD;
        ways = (ways * (1n + comb)) % MOD;
      }
    }
    total = (total + ways - 1n + MOD) % MOD;
  }
  return Number(total);
}

/** Seeded lowercase string of length n drawn from the first `alpha` letters. */
function randomWord(seed, n, alpha) {
  const rnd = mulberry32(seed);
  const chars = new Array(n);
  for (let i = 0; i < n; i++) chars[i] = String.fromCharCode(97 + Math.floor(rnd() * alpha));
  return chars.join('');
}

/** Fast flat growth string of length n over 4 letters (each ~n/4 occurrences) without rope cost. */
function fastGrowthWord(seed, n) {
  const chunk = randomWord(seed, 1024, 4);
  const fullChunks = Math.floor(n / chunk.length);
  const parts = [];
  for (let i = 0; i < fullChunks; i++) parts.push(chunk);
  const rem = n - fullChunks * chunk.length;
  if (rem > 0) parts.push(chunk.slice(0, rem));
  const s = parts.join('');
  s.indexOf('!'); // Force flat representation before timing begins.
  return s;
}

const visible = [
  { args: ['aabb'], expected: 11, note: 'For k = 1 there are 8 balanced subsequences; for k = 2 there are 3 ("aa", "bb", "aabb"). Total: 11.' },
  { args: ['reed'], expected: 12, note: 'Counts are r:1, e:2, d:1. For k = 1 there are 2*3*2 - 1 = 11; for k = 2 only "ee" works (1). Total: 12.' },
  { args: ['abc'], expected: 7, note: 'Every non-empty subsequence uses each chosen letter once: 2^3 - 1 = 7.' },
  { args: ['aaaa'], expected: 15, note: 'Any non-empty subset of indices gives a single-letter subsequence: 2^4 - 1 = 15.' },
  { args: ['z'], expected: 1, note: 'Only the full single-character string is non-empty.' },
];

// Hidden tests: all 26 distinct letters (2^26 - 1), skewed small mix, small repeated pair,
// frequency 3 with 4 letters, medium random, plus max-size 10^4 strings (all same letter testing
// large modular exponents, two 5000-count letters, uniform 26 letters, skewed 4 letters, and
// seeded 26-letter random string).
const hiddenArgs = [
  ['abcdefghijklmnopqrstuvwxyz'],
  ['aaabbc'],
  ['ababab'],
  ['aabbccddaa'],
  [randomWord(25391, 500, 10)],
  ['a'.repeat(MAX_N)],
  ['a'.repeat(5000) + 'b'.repeat(5000)],
  ['abcdefghijklmnopqrstuvwxyz'.repeat(Math.ceil(MAX_N / 26)).slice(0, MAX_N)],
  [randomWord(25392, MAX_N, 4)],
  [randomWord(25393, MAX_N, 26)],
];

export const problem = {
  id: 'balanced-subsequence-count',
  title: 'Balanced Subsequence Count',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Combinatorics', 'Frequency Count', 'Modular Arithmetic'],
  timeLimitMs: 2000,
  argNames: ['s'],

  statementHtml: `
    <p>A subsequence of a string <code>s</code> is <strong>balanced</strong> if it is non-empty and
    every distinct character that appears in the subsequence appears the <strong>same number of
    times</strong>.</p>
    <p>Given a lowercase string <code>s</code>, return the number of balanced subsequences of
    <code>s</code> modulo <code>10<sup>9</sup> + 7</code>. Two subsequences formed by different
    sets of indices are counted separately even if they spell the same string.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^4',
    's consists only of lowercase English letters (a to z)',
    'Return the answer modulo 10^9 + 7 (1,000,000,007)',
    'Target complexity: O(n) time and space (with alphabet size 26)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  hints: [
    'Does the order of characters inside s affect whether a chosen set of indices forms a balanced subsequence?',
    'If you fix the shared frequency k (every chosen letter must appear exactly k times), how many ways can a letter with total count f contribute?',
    'Each letter with count f >= k can either be skipped (1 way) or chosen k times (C(f, k) ways). How do those choices combine across all 26 letters?',
    'When you multiply (1 + C(f, k)) across all letters, one extra subsequence sneaks into the product. Which one?',
    'How can you compute C(f, k) mod 10^9 + 7 in O(1) time after O(maxFreq) preprocessing?',
  ],

  explanationHtml: `
    <h4>Idea</h4>
    <p>Only the frequency of each letter matters, not character positions. Fix the common frequency
    <code>k</code> (from <code>1</code> up to the highest letter count <code>maxFreq</code>). For a
    fixed <code>k</code>, each letter with count <code>f &gt;= k</code> independently offers
    <code>1 + C(f, k)</code> choices: omit the letter (1 way) or pick <code>k</code> of its
    <code>f</code> occurrences (<code>C(f, k)</code> ways). Multiply those factors across all
    eligible letters and subtract <code>1</code> for the empty subsequence.</p>
    <h4>Why it works</h4>
    <p>Every non-empty balanced subsequence has a unique shared frequency <code>k &gt;= 1</code>, so
    summing over <code>k = 1..maxFreq</code> partitions all balanced subsequences without overlap.
    Precomputing factorials <code>fact[0..maxFreq]</code> and inverse factorials via Fermat's little
    theorem (<code>invFact[maxFreq] = fact[maxFreq]^(MOD - 2) mod MOD</code>, then walking
    backward) answers every <code>C(f, k)</code> in O(1).</p>
    <h4>Complexity</h4>
    <p>O(n + 26 * maxFreq) = O(n) time and O(maxFreq) = O(n) space. Building a full Pascal's
    triangle takes O(maxFreq^2) time and space (10^8 entries when one letter repeats 10^4 times),
    which is far heavier than precomputing factorials.</p>
    <h4>Pitfall</h4>
    <p>Subtract <code>1</code> for the empty subsequence on <em>every</em> value of <code>k</code>,
    not once at the end. Also watch modular multiplication overflow: <code>(10^9 + 7)^2</code>
    exceeds both 32-bit integers and JavaScript's 53-bit safe integer limit (use 64-bit integers in
    compiled languages and <code>BigInt</code> in JavaScript/TypeScript).</p>
  `,

  signature: {
    name: 'countBalancedSubsequences',
    params: [{ name: 's', type: 'string' }],
    returns: 'int',
  },

  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  growth: {
    target: 'n',
    n: 's.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000],
    // Four letters each appearing ~n / 4 times keep maxFreq = Theta(n), so O(maxFreq^2) Pascal DP
    // is genuinely quadratic while the inverse-factorial method stays linear in n.
    input: (n, seed) => [fastGrowthWord(seed, n)],
  },

  /**
   * Custom input: a JSON string or bare lowercase word of length 1..10^4.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const trimmed = raw.trim();
    let s;
    if (trimmed.startsWith('"')) {
      try {
        s = JSON.parse(trimmed);
      } catch {
        return { ok: false, error: 'Enter a lowercase string, for example "aabb".' };
      }
    } else {
      s = trimmed;
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_N) {
      return { ok: false, error: 's must be a string of 1 to 10^4 lowercase letters.' };
    }
    if (!/^[a-z]+$/.test(s)) {
      return { ok: false, error: 's must contain only lowercase English letters (a to z).' };
    }
    return { ok: true, args: [s] };
  },

  solveReference: (args) => reference(args[0]),
};

export default problem;
