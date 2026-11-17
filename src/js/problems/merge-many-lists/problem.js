/**
 * Problem: Merge Many Lists
 *
 * Merge k sorted linked lists into one sorted list. Two optimal approaches: a min-heap holding
 * the current head of every list (O(N log k)), or merging lists in pairs, round after round
 * (also O(N log k)). The classic slow answer merges the lists one by one into a growing result,
 * which re-walks the result k times: O(N * k), about 10^9 steps with 10^4 lists of 20 nodes.
 * The classic bugs are empty lists inside the input (null heads) and an empty input.
 *
 * Linked lists cross the worker boundary as arrays ([1,4,5]); engine/adapters.js turns them
 * into ListNode objects for the user's code and back.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_K = 10000;
const MAX_TOTAL = 200000;
const MAX_ABS = 10000;

/**
 * Reference on the JSON form: merge in pairs, round after round, so the cost is O(N log k).
 * @param {number[][]} lists each list's values head to tail, sorted ascending
 * @returns {number[]}
 */
export function reference(lists) {
  if (lists.length === 0) return [];
  let round = lists;
  while (round.length > 1) {
    const next = [];
    for (let i = 0; i < round.length; i += 2) {
      const a = round[i];
      const b = round[i + 1] ?? [];
      const out = [];
      let x = 0;
      let y = 0;
      while (x < a.length || y < b.length) {
        if (y >= b.length || (x < a.length && a[x] <= b[y])) out.push(a[x++]);
        else out.push(b[y++]);
      }
      next.push(out);
    }
    round = next;
  }
  return round[0];
}

/** `k` sorted lists with lengths from `lengthOf(i, rnd)` and values in [lo, hi]. */
function randomLists(seed, k, lengthOf, lo = -MAX_ABS, hi = MAX_ABS) {
  const rnd = mulberry32(seed);
  return Array.from({ length: k }, (_, i) =>
    Array.from({ length: lengthOf(i, rnd) }, () => lo + Math.floor(rnd() * (hi - lo + 1))).sort((x, y) => x - y),
  );
}

const visible = [
  { args: [[[1, 4, 5], [1, 3, 4], [2, 6]]], expected: [1, 1, 2, 3, 4, 4, 5, 6], note: 'Take the smallest head each time; equal values may come in either order.' },
  { args: [[]], expected: [], note: 'No lists at all: the result is empty.' },
  { args: [[[]]], expected: [], note: 'One empty list: still empty.' },
  { args: [[[], [-3, 0], []]], expected: [-3, 0], note: 'Empty lists among the input are skipped.' },
  { args: [[[5], [1], [3]]], expected: [1, 3, 5], note: 'Single-node lists out of order.' },
];

// Hidden tests: one list only, many duplicates across lists, one long list among short ones,
// lists that do not overlap at all, and at max size 10^4 lists of 20 nodes (one-by-one merging
// re-walks a result of up to 2 * 10^5 nodes 10^4 times), two lists of 10^5, and 10^4 lists of
// random lengths, many of them empty, plus 1000 lists of heavy duplicates.
const hiddenArgs = [
  [[[-2, -2, 7]]],
  [[[1, 1, 1], [1, 1], [1]]],
  [[[0], [], [], [], [-1]]],
  [[[10, 20, 30], [1, 2, 3], [4, 5, 6]]],
  [randomLists(3, 5, (i) => (i === 2 ? 300 : 3), -50, 50)],
  [randomLists(5, 200, (_, rnd) => Math.floor(rnd() * 30), -100, 100)],
  [randomLists(7, MAX_K, () => 20)],
  [randomLists(11, 2, () => 100000)],
  [randomLists(13, MAX_K, (_, rnd) => (rnd() < 0.5 ? 0 : Math.floor(rnd() * 40)))],
  [randomLists(17, 1000, () => 20, -5, 5)],
];

const isSortedList = (l) => Array.isArray(l) && l.every((v, i) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS && (i === 0 || l[i - 1] <= v));

export const problem = {
  id: 'merge-many-lists',
  title: 'Merge Many Lists',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Linked List', 'Heap', 'Divide and Conquer'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['lists'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array <code>lists</code> of <code>k</code> linked lists, each sorted in
    ascending order. Merge them into one sorted linked list and return its head.</p>
    <p>Any of the lists may be empty, and <code>lists</code> itself may be empty. Reuse the
    existing nodes.</p>
    <p>In the examples a list is written as its values from head to tail, so <code>[1,4,5]</code>
    means <code>1 -> 4 -> 5</code>, and <code>[]</code> is an empty list.</p>
  `,
  constraints: [
    '0 <= k <= 10^4',
    '0 <= lists[i].length, and the total number of nodes is at most 2 * 10^5',
    '-10^4 <= Node.val <= 10^4',
    'Each lists[i] is sorted in ascending order',
    'Target complexity: O(N log k) for N nodes in total',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `lists = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'You know how to merge two sorted lists. If you merge the lists one after another into one growing result, how many times is each early node walked over?',
    'At any moment, the next node of the answer is the head of one of the k lists. Which one, and how do you find it quickly?',
    'Which structure hands you the smallest of k values and accepts a replacement in O(log k)?',
    'Alternatively, pair the lists up and merge each pair. How many rounds until one list is left?',
    'What should your code do with a list that is empty from the start?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'mergeKLists',
    params: [{ name: 'lists', type: 'ListNode[]' }],
    returns: 'ListNode',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the lists as one JSON array of arrays, for example [[1,4,5],[1,3,4]].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let lists;
    try {
      lists = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the lists as a JSON array of arrays, for example [[1,4,5],[1,3,4]].' };
    }
    if (!Array.isArray(lists) || lists.length > MAX_K) return { ok: false, error: 'Enter at most 10^4 lists as a JSON array of arrays.' };
    if (!lists.every(isSortedList)) return { ok: false, error: 'Each list must be an array of integers from -10^4 to 10^4 in ascending order.' };
    if (lists.reduce((t, l) => t + l.length, 0) > MAX_TOTAL) return { ok: false, error: 'At most 2 * 10^5 nodes in total.' };
    return { ok: true, args: [lists] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
