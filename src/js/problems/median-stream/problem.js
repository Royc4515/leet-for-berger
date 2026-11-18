/**
 * Problem: Median Stream (design)
 *
 * Numbers arrive one at a time and the median is asked for at any moment. The canonical
 * two-heap design: a max-heap holds the smaller half, a min-heap the larger half, and their tops
 * are the middle. Each insert is O(log n), each query O(1); sorting on every query is
 * O(n log n) per call and times out on 5 * 10^4 queries.
 *
 * The median of an even count is a half-integer, and floating-point output cannot be judged
 * exactly, so findMedian returns twice the median: the middle value doubled, or the sum of the
 * two middle values. With 32-bit inputs that sum needs 64 bits, which is the overflow trap.
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor and void calls).
 */

import { mulberry32 } from '../../engine/rng.js';

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const MAX_CALLS = 50000;

/** Array-backed binary heap ordered by `before(a, b)` (true when a belongs above b). */
class Heap {
  constructor(before) {
    this.a = [];
    this.before = before;
  }

  get size() {
    return this.a.length;
  }

  top() {
    return this.a[0];
  }

  push(v) {
    const a = this.a;
    a.push(v);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.before(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }

  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.before(a[l], a[m])) m = l;
        if (r < a.length && this.before(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * Reference simulation with two heaps: `low` (max-heap) never has fewer elements than `high`
 * (min-heap) and at most one more, and every element of low is <= every element of high.
 * @param {string[]} ops operation names, ops[0] === 'MedianFinder'
 * @param {number[][]} args argument list per operation
 * @returns {(number|null)[]}
 */
export function reference(ops, args) {
  const low = new Heap((x, y) => x > y);
  const high = new Heap((x, y) => x < y);
  return ops.map((op, i) => {
    if (op === 'addNum') {
      low.push(args[i][0]);
      high.push(low.pop());
      if (high.size > low.size) low.push(high.pop());
      return null;
    }
    if (op === 'findMedian') return low.size > high.size ? 2 * low.top() : low.top() + high.top();
    return null; // constructor
  });
}

const anyInt = (rnd) => Math.floor(rnd() * 2 ** 32) + INT_MIN;
const smallValue = (rnd) => Math.floor(rnd() * 21) - 10;

/** `adds` insertions of valueOf(k, rnd); after each, a findMedian with probability `askRate`. */
function session(seed, adds, askRate, valueOf) {
  const rnd = mulberry32(seed);
  const ops = ['MedianFinder'];
  const args = [[]];
  for (let k = 0; k < adds; k++) {
    ops.push('addNum');
    args.push([valueOf(k, rnd)]);
    if (rnd() < askRate) {
      ops.push('findMedian');
      args.push([]);
    }
  }
  return [ops, args];
}

const visible = [
  {
    args: [['MedianFinder', 'addNum', 'addNum', 'findMedian', 'addNum', 'findMedian'], [[], [1], [2], [], [3], []]],
    expected: [null, null, null, 3, null, 4],
    note: 'The median of [1, 2] is 1.5, so the answer is 3. Then [1, 2, 3] has median 2, answer 4.',
  },
  {
    args: [['MedianFinder', 'addNum', 'findMedian'], [[], [-7], []]],
    expected: [null, null, -14],
    note: 'A single number is its own median.',
  },
  {
    args: [['MedianFinder', 'addNum', 'addNum', 'addNum', 'addNum', 'findMedian'], [[], [6], [10], [2], [6], []]],
    expected: [null, null, null, null, null, 12],
    note: 'Sorted: [2, 6, 6, 10]. The two middle values are 6 and 6.',
  },
  {
    args: [['MedianFinder', 'addNum', 'findMedian', 'addNum', 'findMedian', 'addNum', 'findMedian'], [[], [5], [], [4], [], [3], []]],
    expected: [null, null, 10, null, 9, null, 8],
    note: 'Numbers do not arrive in order; the median moves down as smaller values come in.',
  },
  {
    args: [['MedianFinder', 'addNum', 'addNum', 'findMedian'], [[], [INT_MAX], [INT_MAX - 1], []]],
    expected: [null, null, null, 2 * INT_MAX - 1],
    note: 'The sum of two middle values can exceed the 32-bit range: use a 64-bit result.',
  },
];

// Hidden tests: negative extremes (64-bit sum), many duplicates, ascending and descending streams
// (a heap that is never rebalanced drifts), alternating extremes, and 5 * 10^4 additions with a
// query after each, where sorting on every query is far too slow.
const hiddenArgs = [
  [['MedianFinder', 'addNum', 'addNum', 'findMedian', 'addNum', 'findMedian'], [[], [INT_MIN], [INT_MIN], [], [0], []]],
  [['MedianFinder', 'addNum', 'addNum', 'addNum', 'findMedian', 'addNum', 'findMedian'], [[], [0], [0], [0], [], [-1], []]],
  session(3, 30, 1, (k) => (k % 2 ? INT_MAX - k : INT_MIN + k)),
  session(5, 200, 0.5, (_, rnd) => smallValue(rnd)),
  session(7, 2000, 0.3, (_, rnd) => anyInt(rnd)),
  session(11, 1000, 1, (k) => 1000 - k),
  session(13, MAX_CALLS, 1, (k) => k * 3 - 70000),
  session(17, MAX_CALLS, 1, (k) => INT_MAX - k * 40000),
  session(19, MAX_CALLS, 1, (_, rnd) => anyInt(rnd)),
  session(23, MAX_CALLS, 0.6, (_, rnd) => smallValue(rnd)),
];

const isInt32 = (v) => Number.isInteger(v) && v >= INT_MIN && v <= INT_MAX;

export const problem = {
  id: 'median-stream',
  title: 'Median Stream',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Heap', 'Two Heaps'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Integers arrive one at a time. Design a class that can report the median of everything
    seen so far at any moment. Implement <code>MedianFinder</code>:</p>
    <ul>
      <li><code>MedianFinder()</code> starts with no numbers.</li>
      <li><code>addNum(num)</code> records <code>num</code>.</li>
      <li><code>findMedian()</code> returns <strong>twice the median</strong> of the numbers
      recorded so far, as a 64-bit integer.</li>
    </ul>
    <p>The median is the middle value of the numbers in sorted order. With an even count there are
    two middle values and the median is their average, which may end in .5. Returning twice the
    median keeps the answer an exact integer: it is <code>2 * middle</code> for an odd count and
    <code>lower middle + upper middle</code> for an even count. For example, after adding 1 and 2
    the median is 1.5 and <code>findMedian()</code> returns 3.</p>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor and for calls that return nothing).</p>
  `,
  constraints: [
    '-2^31 <= num <= 2^31 - 1',
    'findMedian is only called after at least one addNum',
    'At most 5 * 10^4 calls to addNum and at most 5 * 10^4 calls to findMedian',
    'The result needs 64 bits: the sum of two middle values can exceed the 32-bit range',
    'Target complexity: O(log n) per addNum, O(1) per findMedian',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'To find the median you only need the middle of the sorted order. Do you really need everything else sorted?',
    'Split the numbers into a smaller half and a larger half. Which element of each half do you need?',
    'Which structure gives you the largest element of a set quickly? And the smallest?',
    'After adding a number, how do you restore "every element of the smaller half is at most every element of the larger half" and keep the halves balanced?',
    'Two values near 2^31 - 1 are both valid inputs. What type must their sum have?',
  ],

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'MedianFinder',
    constructor: { params: [] },
    methods: [
      { name: 'addNum', params: [{ name: 'num', type: 'int' }], returns: 'void' },
      { name: 'findMedian', params: [], returns: 'long' },
    ],
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two JSON lines, the operations and then the argument lists.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the operations, then the argument lists (both JSON arrays).' };
    let ops;
    let args;
    try {
      ops = JSON.parse(lines[0]);
      args = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    if (!Array.isArray(ops) || !Array.isArray(args) || ops.length !== args.length) return { ok: false, error: 'Operations and arguments must be arrays of the same length.' };
    if (ops[0] !== 'MedianFinder' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "MedianFinder" with no arguments.' };
    let adds = 0;
    let finds = 0;
    for (let i = 1; i < ops.length; i++) {
      const a = args[i];
      if (ops[i] === 'addNum') {
        if (!Array.isArray(a) || a.length !== 1 || !isInt32(a[0])) return { ok: false, error: `addNum takes one 32-bit integer (call ${i}).` };
        adds++;
      } else if (ops[i] === 'findMedian') {
        if (!Array.isArray(a) || a.length !== 0) return { ok: false, error: `findMedian takes no arguments (call ${i}).` };
        if (adds === 0) return { ok: false, error: `Call ${i}: findMedian needs at least one number.` };
        finds++;
      } else {
        return { ok: false, error: `Unknown operation "${ops[i]}".` };
      }
    }
    if (adds > MAX_CALLS || finds > MAX_CALLS) return { ok: false, error: 'At most 5 * 10^4 calls to each method.' };
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). n counts calls: each
  // addNum is followed by a findMedian, values over the whole int range. Sorting on every
  // findMedian, or inserting into a sorted array, is quadratic or worse.
  growth: {
    target: 'n log n',
    n: 'number of calls',
    sizes: [2000, 4000, 8000, 16000, 32000, 64000, 128000],
    input: (n, seed) => session(seed, Math.floor(n / 2), 1, (_k, rnd) => anyInt(rnd)),
  },
};

export default problem;
