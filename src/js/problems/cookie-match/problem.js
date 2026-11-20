/**
 * Problem: Cookie Match
 *
 * Children have greed factors, cookies have sizes; a child is content with a cookie at least as big
 * as its greed. Maximize content children. Sort both, then give each cookie, smallest first, to the
 * least greedy child it can satisfy: a small cookie is never more useful later. Matching every
 * child against every cookie is O(n * m), too slow at 10^5 each, so both limits are raised from
 * LeetCode's.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_V = 2147483647;

/**
 * Reference: two pointers over sorted copies.
 * @param {number[]} g greed factors
 * @param {number[]} s cookie sizes
 * @returns {number}
 */
export function reference(g, s) {
  const kids = [...g].sort((a, b) => a - b);
  const cookies = [...s].sort((a, b) => a - b);
  let k = 0;
  for (let c = 0; c < cookies.length && k < kids.length; c++) {
    if (cookies[c] >= kids[k]) k++;
  }
  return k;
}

function randomNums(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[1, 2, 3], [1, 1]], expected: 1, note: 'Both cookies have size 1, so only the child with greed 1 is content.' },
  { args: [[1, 2], [1, 2, 3]], expected: 2, note: 'Every child gets a big enough cookie.' },
  { args: [[10, 9, 8, 7], [5, 6, 7, 8]], expected: 2, note: 'Cookies 7 and 8 go to the children with greed 7 and 8; the order of the input does not matter.' },
  { args: [[1], []], expected: 0, note: 'No cookies at all.' },
  { args: [[2, 2], [1, 1, 1]], expected: 0, note: 'Plenty of cookies, but every one is too small.' },
];

// Hidden tests: a big cookie that a greedy "largest cookie first" might waste, values at 2^31 - 1,
// duplicates, unsorted input, then 10^5 children and 10^5 cookies where O(n * m) is too slow.
const hiddenArgs = [
  [[1, 2, 3], [3]],
  [[MAX_V, 1], [MAX_V - 1, MAX_V]],
  [[5, 5, 5, 5], [5, 5, 4, 6, 5]],
  [[3, 1, 2, 7, 4], [2, 6, 1, 3]],
  [randomNums(37, 1000, 1, 100), randomNums(41, 800, 1, 100)],
  [randomNums(43, MAX_N, 1, MAX_V), randomNums(47, MAX_N, 1, MAX_V)],
  [randomNums(53, MAX_N, 1, 1000), randomNums(59, MAX_N, 1, 900)],
  [Array(MAX_N).fill(7), Array(MAX_N).fill(6)],
  [randomNums(61, MAX_N, 1, 50), Array(MAX_N).fill(MAX_V)],
  [Array.from({ length: MAX_N }, (_, i) => MAX_N + 1 - i), Array.from({ length: MAX_N }, (_, i) => i + 1)],
];

export const problem = {
  id: 'cookie-match',
  title: 'Cookie Match',
  difficulty: 'Easy',
  topics: ['greedy'],
  patterns: ['Greedy', 'Sorting', 'Two Pointers'],
  timeLimitMs: 3000,
  argNames: ['g', 's'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Each child <code>i</code> has a greed factor <code>g[i]</code>, and each cookie
    <code>j</code> has a size <code>s[j]</code>. Child <code>i</code> is content if they receive a
    cookie with <code>s[j] &gt;= g[i]</code>.</p>
    <p>Every child gets at most one cookie and every cookie goes to at most one child. Return the
    largest number of children you can make content.</p>
  `,
  constraints: [
    '1 <= g.length <= 10^5 (raised from LeetCode\'s 3 * 10^4)',
    '0 <= s.length <= 10^5',
    '1 <= g[i], s[j] <= 2^31 - 1',
    'Target complexity: O(n log n + m log m) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `g = ${JSON.stringify(t.args[0])}, s = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which child is the easiest to satisfy, and which cookie is the least valuable?',
    'If the smallest cookie cannot satisfy the least greedy child, can it satisfy anyone?',
    'Would giving a large cookie to an easy child ever cost you a match you could otherwise make?',
    'After sorting both arrays, how can two pointers find all the matches in one pass?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Sort children by greed and cookies by size. Walk the children from least greedy, and for
    each one skip cookies that are too small, then give it the first cookie that fits. Stop when
    the cookies run out.</p>
    <h4>Why it works</h4>
    <p>A cookie too small for the current child is too small for every greedier child, so skipping
    it loses nothing. Giving the least greedy child the smallest cookie that fits is safe by an
    exchange argument: any better assignment can swap its cookie for this one without making
    anyone unhappy, and the larger cookies stay free for greedier children.</p>
    <h4>Complexity</h4>
    <p>O(n log n + m log m) time for the two sorts, then one linear pass with two pointers. O(n +
    m) space for the sorted copies. Trying every cookie for every child is O(n * m), 10^10 at the
    limits.</p>
    <h4>Pitfall</h4>
    <p><code>s</code> can be empty, so guard the cookie index before reading it. Also note that a
    fit is <code>s[j] &gt;= g[i]</code>, inclusive, and that the input arrays are unsorted.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'findContentChildren',
    params: [
      { name: 'g', type: 'int[]' },
      { name: 's', type: 'int[]' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, g then s, each a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: g as a JSON array, then s as a JSON array.' };
    let g;
    let s;
    try {
      g = JSON.parse(lines[0]);
      s = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    if (!Array.isArray(g) || g.length < 1 || g.length > MAX_N) return { ok: false, error: 'g must have 1 to 10^5 elements.' };
    if (!Array.isArray(s) || s.length > MAX_N) return { ok: false, error: 's must have 0 to 10^5 elements.' };
    const valid = (v) => Number.isInteger(v) && v >= 1 && v <= MAX_V;
    if (!g.every(valid) || !s.every(valid)) return { ok: false, error: 'Values must be integers from 1 to 2^31 - 1.' };
    return { ok: true, args: [g, s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). n children and n cookies with random sizes: both copies are sorted with a comparator and the matching pass walks both. Values stay below 2^31.
  growth: {
    target: 'n log n',
    n: 'g.length',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 1, max: 2147483647 }), intArray(n, mulberry32(seed + 1), { min: 1, max: 2147483647 })],
  },
};

export default problem;
