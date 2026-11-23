/**
 * Problem: Sparse Dot
 *
 * Based on LeetCode 1570 (Dot Product of Two Sparse Vectors); statement and tests are written for
 * this project. LeetCode wraps each vector in a class whose method takes another instance; our
 * harness passes data, not objects, so both vectors arrive already compressed: lists of
 * [index, value] pairs for the non-zero entries, sorted by index. Only indices present in both
 * lists contribute, so a two-pointer merge over the sorted lists finds them in O(a + b).
 *
 * Classic wrong answers: multiplying the pairs position by position (the k-th non-zero entries of
 * the two vectors need not share an index), expanding to dense arrays (indices reach 10^9), and the
 * nested loop over both lists (O(a * b), 10^10 steps for two lists of 10^5 pairs).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt, shuffle } from '../../engine/growth-inputs.js';

const MAX_PAIRS = 100000;
const MAX_INDEX = 1000000000 - 1;
const MAX_VALUE = 100;

/**
 * Reference: a map from index to value for the first vector, probed by the second (independent of
 * the two-pointer merge the solutions use).
 * @param {number[][]} a
 * @param {number[][]} b
 * @returns {number}
 */
export function reference(a, b) {
  const first = new Map(a.map(([i, v]) => [i, v]));
  let dot = 0;
  for (const [i, v] of b) if (first.has(i)) dot += first.get(i) * v;
  return dot;
}

/** `count` sorted distinct indices from [0, MAX_INDEX] with non-zero values, seeded. */
function sparseVector(seed, count, { maxIndex = MAX_INDEX, positive = false, pool = null } = {}) {
  const rnd = mulberry32(seed);
  const seen = new Set();
  const indices = [];
  const source = pool ? shuffle([...pool], rnd).slice(0, count) : null;
  while (indices.length < count) {
    const idx = source ? source[indices.length] : randInt(rnd, 0, maxIndex);
    if (seen.has(idx)) continue;
    seen.add(idx);
    indices.push(idx);
  }
  indices.sort((x, y) => x - y);
  return indices.map((idx) => {
    const magnitude = randInt(rnd, 1, MAX_VALUE);
    return [idx, positive || rnd() < 0.5 ? magnitude : -magnitude];
  });
}

const visible = [
  { args: [[[0, 1], [3, 2], [4, 3]], [[1, 3], [3, 4]]], expected: 8, note: 'Only index 3 is non-zero in both vectors: 2 * 4 = 8.' },
  { args: [[[1, 1]], [[0, 1], [2, 1], [3, 1]]], expected: 0, note: 'No index appears in both lists, so every product is zero.' },
  { args: [[[2, 3], [4, -5]], [[2, 2], [4, 1], [9, 7]]], expected: 1, note: '3 * 2 + (-5) * 1 = 1.' },
  { args: [[[5, 2], [7, 3]], [[7, 4], [9, 5]]], expected: 12, note: 'Both lists have two pairs, but only index 7 matches; position by position would pair 5 with 7.' },
  { args: [[], [[0, 9]]], expected: 0, note: 'A vector with no non-zero entries has dot product 0 with anything.' },
];

// Hidden tests: two empty vectors, one pair against 10^5 pairs that contain its index, two lists of
// 10^5 pairs drawn from the same 1.2 * 10^5 indices (most indices shared), two lists of 10^5 random
// indices up to 10^9 (almost nothing shared), indices at both ends of the range, the same 10^5
// indices in both lists with values of 100 (the largest possible sum), a long list against a short
// one, interleaved lists that never meet, a negative result, and a small random case.
const hiddenArgs = (() => {
  const pool = Array.from({ length: 120000 }, (_, i) => i * 7919);
  const full = sparseVector(1570, MAX_PAIRS, { positive: true }).map(([i]) => [i, MAX_VALUE]);
  return [
    [[], []],
    [[[424242, -7]], sparseVector(1571, MAX_PAIRS, { pool: [...pool, 424242].slice(-MAX_PAIRS) })],
    [sparseVector(1572, MAX_PAIRS, { pool }), sparseVector(1573, MAX_PAIRS, { pool })],
    [sparseVector(1574, MAX_PAIRS), sparseVector(1575, MAX_PAIRS)],
    [[[0, 5], [MAX_INDEX, -3]], [[0, 2], [MAX_INDEX, 4]]],
    [full, full],
    [sparseVector(1576, MAX_PAIRS, { pool }), sparseVector(1577, 30, { pool })],
    [Array.from({ length: 50000 }, (_, i) => [2 * i, 1]), Array.from({ length: 50000 }, (_, i) => [2 * i + 1, 1])],
    [[[1, 100], [2, 100]], [[1, -100], [2, -100]]],
    [sparseVector(1578, 12, { maxIndex: 20 }), sparseVector(1579, 12, { maxIndex: 20 })],
  ];
})();

export const problem = {
  id: 'sparse-dot',
  title: 'Sparse Dot',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Sparse Data', 'Hash Map'],
  timeLimitMs: 2000,
  argNames: ['a', 'b'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Two very long vectors are mostly zeros, so each one is stored as a list of its non-zero entries:
    <code>a[i] = [index, value]</code> means the vector holds <code>value</code> at position
    <code>index</code>, and every position not listed holds 0. Each list is sorted by index, and an index
    appears at most once in a list.</p>
    <p>Return the dot product of the two vectors: the sum, over every position, of the two values at that
    position multiplied together.</p>
  `,
  constraints: [
    '0 <= a.length, b.length <= 10^5',
    '0 <= index < 10^9, strictly increasing within each list',
    '-100 <= value <= 100 and value != 0',
    'Target complexity: O(a.length + b.length)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `a = ${JSON.stringify(t.args[0])}, b = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which positions can contribute anything to the dot product?',
    'Could you rebuild the two full vectors and multiply them position by position? How long would they be?',
    'Both lists are sorted by index. If the current index in a is smaller than the current index in b, can that entry of a ever meet a partner later?',
    'What if one list has 10 pairs and the other 10^5: is there something faster than walking both?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>A position adds to the dot product only if both vectors are non-zero there, that is, if its index is in
    both lists. Walk the two sorted lists with one pointer each: when the indices are equal, add the product and
    advance both; otherwise advance the pointer with the smaller index.</p>
    <h4>Why it works</h4>
    <p>Both lists are sorted, so an entry whose index is smaller than the other list's current index can never
    meet a partner further on: every later index in the other list is larger still. This is the merge step of
    merge sort, keeping only the matches.</p>
    <h4>Complexity</h4>
    <p>O(a + b) time and O(1) extra space. A hash map of one list probed by the other is also O(a + b). When one
    list is much shorter, binary-searching each of its indices in the longer list costs O(short * log long), which
    is better still.</p>
    <h4>Pitfall</h4>
    <p>Pairing the k-th entries of both lists assumes the vectors are non-zero at the same positions. Expanding to
    dense arrays needs 10<sup>9</sup> slots. The nested loop over both lists is 10<sup>10</sup> steps at the
    limits. The sum fits in 32 bits: at most 10<sup>5</sup> * 100 * 100 = 10<sup>9</sup>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'sparseDot',
    params: [
      { name: 'a', type: 'int[][]' },
      { name: 'b', type: 'int[][]' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: a and b as JSON arrays of [index, value] pairs, on two lines or separated by ;
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const parts = raw.split(/\n|;/).map((s) => s.trim()).filter(Boolean);
    const usage = 'Enter a and b on two lines (or separated by ;), e.g. [[0,1],[3,2]]; [[3,4]].';
    if (parts.length !== 2) return { ok: false, error: usage };
    let lists;
    try {
      lists = parts.map((p) => JSON.parse(p));
    } catch {
      return { ok: false, error: usage };
    }
    for (const list of lists) {
      if (!Array.isArray(list) || list.length > MAX_PAIRS) return { ok: false, error: 'Each list holds 0 to 10^5 [index, value] pairs.' };
      let prev = -1;
      for (const pair of list) {
        if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(Number.isInteger)) return { ok: false, error: 'Each entry is [index, value] with whole numbers.' };
        const [idx, v] = pair;
        if (idx < 0 || idx > MAX_INDEX || idx <= prev) return { ok: false, error: 'Indices go from 0 to 10^9 - 1 and strictly increase within a list.' };
        if (v === 0 || v < -MAX_VALUE || v > MAX_VALUE) return { ok: false, error: 'Values are non-zero, from -100 to 100.' };
        prev = idx;
      }
    }
    return { ok: true, args: lists };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(...args),
};

export default problem;
