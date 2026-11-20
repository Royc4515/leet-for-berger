/**
 * Problem: Cooldown Tasks
 *
 * Schedule unit-time tasks so equal tasks are at least n slots apart, minimising total time.
 * Simulating with a max-heap works, but the answer has a closed form: the most frequent task
 * (count f) forces f - 1 full frames of n + 1 slots plus one slot per task tied for the maximum;
 * if the other tasks overflow those frames, no idle slot is needed and the answer is the length.
 * With 10^5 tasks and n = 100, a slot-by-slot simulation walks about 10^7 slots.
 */

import { mulberry32 } from '../../engine/rng.js';
import { charString } from '../../engine/growth-inputs.js';

/**
 * Reference: the frame formula.
 * @param {string} tasks uppercase letters
 * @param {number} n minimum gap between equal tasks
 * @returns {number}
 */
export function reference(tasks, n) {
  const count = new Array(26).fill(0);
  for (const c of tasks) count[c.charCodeAt(0) - 65]++;
  const top = Math.max(...count);
  const tied = count.filter((v) => v === top).length;
  return Math.max(tasks.length, (top - 1) * (n + 1) + tied);
}

const MAX_LEN = 100000;
const MAX_GAP = 100;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Seeded string of `len` letters drawn from the first `alphabet` letters. */
function randomTasks(seed, len, alphabet) {
  const rnd = mulberry32(seed);
  let s = '';
  for (let i = 0; i < len; i++) s += LETTERS[Math.floor(rnd() * alphabet)];
  return s;
}

/** One dominant letter plus seeded filler, so the idle frames decide the answer. */
function dominant(seed, len, share) {
  const rnd = mulberry32(seed);
  let s = '';
  for (let i = 0; i < len; i++) s += rnd() < share ? 'Q' : LETTERS[Math.floor(rnd() * 26)];
  return s;
}

const visible = [
  { args: ['AAABBB', 2], expected: 8, note: 'A B idle A B idle A B: each A needs 2 slots before the next A.' },
  { args: ['ACABDB', 1], expected: 6, note: 'A B A B C D (or similar) needs no idle slot.' },
  { args: ['AAABBB', 3], expected: 10, note: 'A B idle idle A B idle idle A B.' },
  { args: ['A', 100], expected: 1, note: 'One task, nothing to wait for.' },
  { args: ['AAAAAABCDEFG', 2], expected: 16, note: 'A B C A D E A F G A idle idle A idle idle A.' },
];

// Hidden tests: n = 0, three letters tied for the maximum, enough variety that no idle slot is
// needed (answer = length; the formula alone undercounts), the largest gap, and four inputs of
// 10^5 tasks where walking the schedule slot by slot is far too slow.
const hiddenArgs = [
  ['AABBCC', 0],
  ['AAABBBCCCDE', 2],
  ['AAABBBCCCDDEEFFGGH', 2],
  ['ZZ', MAX_GAP],
  [randomTasks(3, 60, 4), 3],
  [randomTasks(5, 5000, 26), 25],
  ['B'.repeat(MAX_LEN), MAX_GAP],
  [dominant(7, MAX_LEN, 0.3), MAX_GAP],
  [randomTasks(11, MAX_LEN, 26), MAX_GAP],
  [randomTasks(13, MAX_LEN, 3), 7],
];

export const problem = {
  id: 'cooldown-tasks',
  title: 'Cooldown Tasks',
  difficulty: 'Medium',
  topics: ['greedy'],
  patterns: ['Greedy', 'Counting', 'Heap'],
  timeLimitMs: 3000,
  argNames: ['tasks', 'n'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A CPU must run a list of tasks, given as a string <code>tasks</code> where each uppercase
    letter is one task and equal letters are the same kind of task. Every task takes exactly one
    time slot, and in each slot the CPU either runs one task or stays idle. Tasks may run in any
    order.</p>
    <p>Two tasks of the same kind must be separated by at least <code>n</code> slots: if a kind
    runs in slot <code>t</code>, it may run again in slot <code>t + n + 1</code> at the
    earliest.</p>
    <p>Return the minimum number of slots needed to run every task, idle slots included.</p>
  `,
  constraints: [
    '1 <= tasks.length <= 10^5 (raised from the usual 10^4)',
    'tasks consists of uppercase English letters',
    '0 <= n <= 100',
    'Target complexity: O(tasks.length) time (simulating slot by slot can take 10^7 steps)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `tasks = ${JSON.stringify(t.args[0])}, n = ${t.args[1]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Does the order of the letters in the input matter, or only how many of each kind there are?',
    'Which kind of task limits you the most, and how many slots must pass between its runs?',
    'Picture the most frequent task laid out with its gaps. How many full frames does that make, and what is left over at the end?',
    'What if several kinds tie for the highest count?',
    'When there are so many different tasks that the gaps overflow, can the answer ever be less than the number of tasks?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Only the counts matter. If the most frequent kind runs <code>x</code> times, it needs <code>x
    - 1</code> frames of <code>n + 1</code> slots, then a last frame with one slot for every kind
    that ties for <code>x</code>. The answer is the larger of that and the number of tasks.</p>
    <h4>Why it works</h4>
    <p>Consecutive runs of the busiest kind are <code>n + 1</code> slots apart, so <code>(x - 1) *
    (n + 1)</code> slots come before its last run, and every other kind with count <code>x</code>
    also needs a run in that last frame. All other tasks fit into the gaps in round-robin order. If
    they overflow the gaps, the frames can be widened with no idle slot at all, and the length is
    just the number of tasks.</p>
    <h4>Complexity</h4>
    <p>O(tasks.length) time to count and O(1) space for 26 counters. Simulating slot by slot can
    take about 10^7 steps.</p>
    <h4>Pitfall</h4>
    <p>Dropping the <code>max</code> with the number of tasks. With many kinds the formula
    undercounts: <code>"AABBCCDD"</code> with <code>n = 1</code> gives <code>1 * 2 + 4 = 6</code>,
    yet 8 tasks need 8 slots.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'leastInterval',
    params: [
      { name: 'tasks', type: 'string' },
      { name: 'n', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: tasks as a JSON string on the first line, n on the second.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: tasks as a JSON string, then n.' };
    let tasks;
    let n;
    try {
      tasks = JSON.parse(lines[0]);
      n = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter tasks as a JSON string, for example "AAB", and n as an integer.' };
    }
    if (typeof tasks !== 'string' || tasks.length < 1 || tasks.length > MAX_LEN) return { ok: false, error: 'tasks must have 1 to 10^5 letters.' };
    if (!/^[A-Z]+$/.test(tasks)) return { ok: false, error: 'tasks may only contain uppercase letters A-Z.' };
    if (!Number.isInteger(n) || n < 0 || n > MAX_GAP) return { ok: false, error: 'n must be an integer from 0 to 100.' };
    return { ok: true, args: [tasks, n] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random tasks with the
  // largest cooldown (100): slot-by-slot simulation does about n * 100 / 26 idle steps, counting does n.
  growth: {
    target: 'n',
    n: 'tasks.length',
    sizes: [64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => [charString(n, mulberry32(seed), { alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' }), 100],
  },
};

export default problem;
