/**
 * Problem: Mirror Bits
 *
 * Take a value as an unsigned 32-bit pattern and read its bits in the opposite direction: the
 * lowest bit becomes the highest one and the other way round. All 32 positions count, so leading
 * zeros of the input become trailing zeros of the answer. Input and output are typed as 64-bit
 * integers in [0, 2^32 - 1], so values with the top bit set are ordinary non-negative numbers in
 * every language instead of negative ints in Java, C# or JavaScript bitwise code.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 4294967295; // 2^32 - 1

/**
 * Reference: shift the answer left and feed it the lowest bit of n, 32 times.
 * @param {number} n integer in [0, 2^32 - 1]
 * @returns {number} the 32 bits of n in reverse order, as a non-negative integer
 */
export function reference(n) {
  // don't touch / `>>> 0` keeps both values unsigned, and the answer is built with `* 2 +` rather
  // than `<<`, because `<<` turns a result with the top bit set into a negative number.
  let rest = n >>> 0;
  let out = 0;
  for (let i = 0; i < 32; i++) {
    out = out * 2 + (rest & 1);
    rest >>>= 1;
  }
  return out;
}

/** A seeded value in [lo, hi]. */
function randomIn(seed, lo, hi) {
  return lo + Math.floor(mulberry32(seed)() * (hi - lo + 1));
}

const visible = [
  { args: [43261596], expected: 964176192, note: '00000010100101000001111010011100 read backwards is 00111001011110000010100101000000.' },
  { args: [4294967293], expected: 3221225471, note: 'Only bit 1 is 0; mirrored, only bit 30 is 0. The input and the answer are above 2^31.' },
  { args: [1], expected: 2147483648, note: 'The lowest bit lands on the highest position.' },
  { args: [0], expected: 0, note: 'No bits set.' },
  { args: [2147483648], expected: 1, note: 'The highest bit lands on the lowest position.' },
];

// Hidden tests: all bits set, a single top bit, the largest signed value, alternating patterns
// (each is the mirror of the other), a small value with 16 leading zeros, a value that is its own
// mirror, and seeded values across the range.
const hiddenArgs = [
  [MAX_N],
  [2147483647],
  [2863311530],
  [1431655765],
  [65535],
  [2147483649],
  [MAX_N - 1],
  [randomIn(7, 2147483648, MAX_N)],
  [randomIn(11, 0, 2147483647)],
  [randomIn(13, 0, MAX_N)],
];

export const problem = {
  id: 'mirror-bits',
  title: 'Mirror Bits',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Bit Manipulation'],
  timeLimitMs: 1000,
  argNames: ['n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an integer <code>n</code> between <code>0</code> and <code>2^32 - 1</code>. Think of
    it as a binary number with exactly 32 bits, padded with leading zeros when needed.</p>
    <p>Write those 32 bits in the opposite order and return the result as a non-negative integer.
    Bit 0 (the lowest) of <code>n</code> becomes bit 31 (the highest) of the answer, bit 1 becomes bit 30,
    and so on.</p>
    <p>Both <code>n</code> and the answer are 64-bit integers, so values of <code>2^31</code> and above arrive
    and leave as ordinary non-negative numbers in every language.</p>
  `,
  constraints: [
    '0 <= n <= 2^32 - 1 (passed as a 64-bit integer)',
    'The answer is also in [0, 2^32 - 1]',
    'Target complexity: O(1), 32 steps',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `n = ${t.args[0]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How can you read the lowest bit of n, and how do you move on to the next one?',
    'If you take bits from the low end of n one at a time, where in the answer should each new bit go to end up reversed?',
    'Should the loop stop when n becomes 0, or run a fixed number of times? What happens to n = 1?',
    'In your language, what happens to the answer when its top bit becomes 1 and you shift it left?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Repeat 32 times: shift the answer one place left to make room, copy the lowest bit of
    <code>n</code> into the freed place, and shift <code>n</code> one place right.</p>
    <h4>Why it works</h4>
    <p>The first bit taken from <code>n</code> is bit 0. It is pushed left 31 more times, one for each
    later round, so it ends at position 31. The bit taken in round <code>i</code> is pushed left
    <code>31 - i</code> times and ends at position <code>31 - i</code>, exactly the mirror position.</p>
    <h4>Complexity</h4>
    <p>O(1): the loop always runs 32 times. O(1) space.</p>
    <h4>Pitfall</h4>
    <p>Stopping when <code>n</code> reaches <code>0</code> reverses only the significant bits, so
    <code>1</code> would stay <code>1</code> instead of becoming <code>2^31</code>; leading zeros must turn
    into trailing zeros. In a 32-bit signed type the answer becomes negative as soon as its top bit is
    set, which is why both sides are 64-bit integers here (in JavaScript, <code>&gt;&gt;&gt; 0</code> makes a
    result unsigned again).</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'mirrorBits',
    params: [{ name: 'n', type: 'long' }],
    returns: 'long',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one integer, for example 43261596.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const text = raw.trim();
    if (!/^\d+$/.test(text)) return { ok: false, error: 'Enter n as a non-negative whole number, for example 43261596.' };
    const n = Number(text);
    if (n > MAX_N) return { ok: false, error: 'n must be at most 2^32 - 1 (4294967295).' };
    return { ok: true, args: [n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
