/**
 * Problem: Dominant Value
 *
 * One value in the array fills more than half of it; return that value. A hash count solves it in
 * O(n) time and O(n) space. The vote trick (Boyer-Moore) solves it in O(1) space: a majority value
 * outnumbers all the others combined, so it survives any pairing-off of different values.
 *
 * Limits are raised to 10^5 values so a count that rescans the array for every element (about
 * 10^10 steps) times out. Hidden tests put the majority just over half, spread out, at the end, or
 * hidden behind a long run of a decoy, which is what breaks "guess from the front" shortcuts.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 1000000000;

/**
 * Reference: the vote trick. The candidate changes whenever the tally hits zero; the promised
 * majority outlasts every cancellation, so it is the candidate at the end.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  let candidate = 0;
  let tally = 0;
  for (const v of nums) {
    if (tally === 0) candidate = v;
    tally += v === candidate ? 1 : -1;
  }
  return candidate;
}

/**
 * `n` values where `major` appears exactly floor(n / 2) + 1 times, the rest drawn from `pool`
 * (never `major`). `placement` decides where the majority copies go.
 */
function build(seed, n, placement, pool = 50) {
  const rnd = mulberry32(seed);
  const major = Math.floor(rnd() * 2 * MAX_ABS) - MAX_ABS;
  const count = Math.floor(n / 2) + 1;
  const others = Array.from({ length: n - count }, () => {
    let v;
    do v = Math.floor(rnd() * pool * 2) - pool;
    while (v === major);
    return v;
  });
  const copies = new Array(count).fill(major);
  if (placement === 'tail') return [...others, ...copies];
  if (placement === 'head') return [...copies, ...others];
  // 'spread': the others sit in blocks between single majority copies, so the vote tally keeps
  // returning to zero and the candidate changes many times.
  const out = [];
  let o = 0;
  for (let i = 0; i < count; i++) {
    out.push(major);
    if (o < others.length) out.push(others[o++]);
  }
  while (o < others.length) out.push(others[o++]);
  return out;
}

/** Shuffles a copy, seeded. */
function shuffled(a, seed) {
  const rnd = mulberry32(seed);
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const visible = [
  { args: [[3, 2, 3]], expected: 3, note: '3 appears twice out of 3 values, more than half.' },
  { args: [[2, 2, 1, 1, 1, 2, 2]], expected: 2, note: '2 appears 4 times out of 7. The 1s are the runner-up, so the front of the array does not decide.' },
  { args: [[-7]], expected: -7, note: 'One value is its own majority. Negative values are allowed.' },
  { args: [[5, 1, 5, 2, 5, 3, 5]], expected: 5, note: '5 is every other value: 4 of 7.' },
  { args: [[9, 4, 4, 9, 4, 9, 9, 4, 4]], expected: 4, note: 'The first value (9) is not the majority; 4 has 5 of 9.' },
];

// Hidden: a tie-adjacent small case, an even length with the minimum majority, a majority that
// only appears at the very end, the full-range values, one all-equal array, and four arrays at
// 10^5 values (tail, head, spread, shuffled) where an O(n^2) count times out.
const hiddenInputs = [
  [1, 1],
  [8, 8, 7, 7, 8, 7, 8],
  [1, 2, 3, 4, 5, 7, 7, 7, 7, 7, 7, 7],
  [-1000000000, 1000000000, 1000000000],
  new Array(MAX_N).fill(1000000000),
  build(23, MAX_N, 'tail'),
  build(29, MAX_N, 'head'),
  build(31, MAX_N, 'spread'),
  shuffled(build(37, MAX_N, 'spread', 60000), 38),
  build(41, MAX_N - 1, 'spread', 3),
];

/** @param {unknown} v */
const isInt = (v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS;

/** True when some value appears more than floor(n / 2) times. */
function hasMajority(nums) {
  const counts = new Map();
  for (const v of nums) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.values()].some((c) => c > Math.floor(nums.length / 2));
}

export const problem = {
  id: 'dominant-value',
  title: 'Dominant Value',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Hash Map', 'Voting', 'Counting'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>The integer array <code>nums</code> holds one value that takes up more than half of its
    positions: it appears strictly more than <code>floor(n / 2)</code> times, where
    <code>n</code> is the length of the array. Return that value.</p>
    <p>You may rely on such a value existing. The array is not sorted and no other value comes close:
    the rest share the remaining positions.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^9 <= nums[i] <= 10^9',
    'Some value appears more than floor(nums.length / 2) times',
    'Target complexity: O(n) time; O(1) extra space is possible',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you counted how often each value appears, what would you do with the counts, and what would that cost in memory?',
    'What does "more than half" tell you about how the majority value compares with all the other values put together?',
    'Imagine crossing out two different values at a time. What happens to the majority value after all the crossing out?',
    'Can you keep just one candidate and one number that says how far ahead it is? When should the candidate change?',
    'Does the final candidate need checking, given what the statement promises?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Count with a hash map and return the value whose count passes <code>n / 2</code>, or do it in
    constant space with the vote trick: keep a candidate and a tally. A value equal to the candidate
    raises the tally; a different value lowers it. When the tally is zero, the next value becomes the
    candidate.</p>
    <h4>Why it works</h4>
    <p>Each decrease pairs one candidate copy with one different value and cancels both. The majority
    value has more copies than all the others together, so it cannot be cancelled away completely:
    whoever is left standing must be it. Whenever the tally returns to zero, the prefix so far has
    cancelled out evenly, and the majority is still the majority of what remains.</p>
    <h4>Complexity</h4>
    <p>O(n) time either way. The map costs O(n) space; the vote costs O(1). Counting each element by
    rescanning the array is O(n^2), about 10^10 steps at the largest size.</p>
    <h4>Pitfall</h4>
    <p>Returning the first value, or the middle one without sorting, only works when the array happens
    to be arranged that way. Sorting first and taking the middle is correct but costs O(n log n). The
    vote trick relies on the promised majority: on an array with no majority its answer is
    meaningless.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'majorityElement',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((nums) => ({ args: [nums], expected: reference(nums) })),

  /**
   * Custom input: the array as JSON, which must have a majority value.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the array as JSON, for example [2,2,1,1,1,2,2].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) {
      return { ok: false, error: 'Enter between 1 and 10^5 integers as a JSON array.' };
    }
    if (!nums.every(isInt)) return { ok: false, error: 'Every value is an integer between -10^9 and 10^9.' };
    if (!hasMajority(nums)) return { ok: false, error: 'One value must appear more than half the time.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
