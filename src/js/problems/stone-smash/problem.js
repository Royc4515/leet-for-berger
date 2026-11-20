/**
 * Problem: Stone Smash
 *
 * Equivalent to LeetCode 1046; statement and tests are written for this project. Repeatedly
 * smash the two heaviest stones together: equal stones vanish, otherwise the difference goes back
 * in the pile. Each round needs "the two largest" and one insertion, which is exactly a max-heap.
 *
 * Unlike the original (at most 30 stones of weight up to 1000) the pile here has up to 10^5
 * stones of weight up to 10^9, so re-sorting the pile every round (O(n^2 log n)) and a counting
 * array over the weights both fail.
 *
 * Classic wrong answers: sorting once and pairing neighbors (the difference has to rejoin the
 * pile, where it may be the heaviest again), and smashing the two lightest stones.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_W = 1000000000;

/**
 * Reference: a binary max-heap of the weights.
 * @param {number[]} stones
 * @returns {number}
 */
export function reference(stones) {
  const heap = [];
  const push = (v) => {
    let i = heap.push(v) - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] >= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let big = i;
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < heap.length && heap[c] > heap[big]) big = c;
        if (big === i) break;
        [heap[big], heap[i]] = [heap[i], heap[big]];
        i = big;
      }
    }
    return top;
  };
  stones.forEach(push);
  while (heap.length > 1) {
    const diff = pop() - pop();
    if (diff > 0) push(diff);
  }
  return heap.length ? heap[0] : 0;
}

/** Seeded weights in 1..maxW. */
function randomStones(seed, n, maxW) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => 1 + Math.floor(rnd() * maxW));
}

const visible = [
  { args: [[2, 7, 4, 1, 8, 1]], expected: 1, note: '8 and 7 leave 1; then 4 and 2 leave 2; then 2 and 1 leave 1; then 1 and 1 vanish, and a 1 is left.' },
  { args: [[1]], expected: 1, note: 'A single stone is never smashed.' },
  { args: [[3, 3]], expected: 0, note: 'Equal stones destroy each other.' },
  { args: [[5, 5, 5]], expected: 5, note: 'One pair vanishes and the third stone remains.' },
  { args: [[10, 4, 6]], expected: 0, note: '10 and 6 leave 4, and the two 4s vanish.' },
];

// Hidden tests: the largest weight alone and against 1, a difference that becomes the heaviest
// stone again, equal stones in even and odd counts, and 10^5-stone piles: random weights up to
// 10^9, all equal, a tiny weight range, and sorted weights.
const hiddenInputs = [
  [1000000000],
  [1000000000, 1],
  [9, 3, 2, 10],
  [20, 1, 1, 1, 17],
  [5, 5, 5, 5, 5, 5],
  randomStones(61, 1000, 100),
  randomStones(67, MAX_N, MAX_W),
  Array(MAX_N - 1).fill(MAX_W),
  randomStones(71, MAX_N, 5),
  Array.from({ length: MAX_N }, (_, i) => i + 1),
];

export const problem = {
  id: 'stone-smash',
  title: 'Stone Smash',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Heap', 'Priority Queue', 'Simulation'],
  timeLimitMs: 2000,
  argNames: ['stones'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You have a pile of stones with positive integer weights <code>stones</code>. Play rounds
    until at most one stone is left. In each round, take the two heaviest stones and smash them
    together:</p>
    <ul>
      <li>If they weigh the same, both are destroyed.</li>
      <li>Otherwise the lighter one is destroyed, and the heavier one is left with the difference of
      the two weights and goes back into the pile.</li>
    </ul>
    <p>Return the weight of the last stone, or <code>0</code> if no stone is left.</p>
  `,
  constraints: [
    '1 <= stones.length <= 10^5',
    '1 <= stones[i] <= 10^9',
    'Target complexity: O(n log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `stones = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'What do you need to look up in every round, and what do you put back afterwards?',
    'If you sorted the pile once, would it still be sorted after the difference goes back in?',
    'Re-sorting the whole pile every round works for 30 stones. What does it cost for 100,000?',
    'Which structure gives you the largest element and accepts new ones in logarithmic time?',
    'What do you do with a difference of zero, and what do you return when the pile ends up empty?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep the stones in a max-heap. Each round, pop the two largest, and if they differ push the
    difference back. When one stone or none is left, that is the answer.</p>
    <h4>Why it works</h4>
    <p>The rules fix what each round does, so the problem is a pure simulation; the only question is
    how fast to run it. A max-heap hands over the heaviest stone in O(log n) and accepts the new
    difference in O(log n), so every round stays cheap no matter where the difference lands.</p>
    <h4>Complexity</h4>
    <p>O(n log n) time: building the heap and at most n rounds, each with a few heap operations
    (every round removes at least one stone). O(n) space for the heap.</p>
    <h4>Pitfall</h4>
    <p>Sorting once and pairing neighbors is wrong: the difference rejoins the pile and can be the
    heaviest stone again. Sorting again every round is right but costs O(n log n) per round, far too
    slow at 100,000 stones, and weights up to 10^9 rule out a counting array. Remember that two
    equal stones leave nothing behind, so the pile can run empty.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'lastStoneWeight',
    params: [{ name: 'stones', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((stones) => ({ args: [stones], expected: reference(stones) })),

  /**
   * Custom input: the weights as a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let stones;
    try {
      stones = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the weights as a JSON array, for example [2,7,4,1,8,1].' };
    }
    if (!Array.isArray(stones)) return { ok: false, error: 'The weights must be a JSON array.' };
    if (stones.length < 1 || stones.length > MAX_N) return { ok: false, error: 'The pile needs 1 to 10^5 stones.' };
    if (!stones.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_W)) {
      return { ok: false, error: 'Weights must be integers from 1 to 10^9.' };
    }
    return { ok: true, args: [stones] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Distinct random weights:
  // no smash ends in a tie early, so about n smashes run, and re-sorting or scanning for the two
  // heaviest before each one is n^2 (log n).
  growth: {
    target: 'n log n',
    n: 'stones.length',
    sizes: [2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 1, max: MAX_W, distinct: true })],
  },
};

export default problem;
