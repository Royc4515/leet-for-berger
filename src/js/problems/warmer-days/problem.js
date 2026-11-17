/**
 * Problem: Warmer Days
 *
 * For each day, how long until a strictly warmer day. Days still waiting for their answer form
 * a stack whose temperatures never increase from bottom to top (a monotonic stack): a warmer day
 * settles every cooler day on top at once, so each day is pushed and popped only once.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: monotonic stack of day indices still waiting for a warmer day.
 * @param {number[]} temperatures
 * @returns {number[]}
 */
export function reference(temperatures) {
  const answer = new Array(temperatures.length).fill(0);
  const waiting = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (waiting.length && temperatures[waiting[waiting.length - 1]] < temperatures[i]) {
      const d = waiting.pop();
      answer[d] = i - d;
    }
    waiting.push(i);
  }
  return answer;
}

const MAX_N = 100000;
const MIN_T = 30;
const MAX_T = 100;

/** Seeded temperatures in [lo, hi]. */
function randomTemps(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[71, 72, 74, 70, 68, 73, 77, 72]], expected: [1, 1, 4, 2, 1, 1, 0, 0], note: 'Day 2 (74) waits until day 6 (77).' },
  { args: [[30, 40, 50, 60]], expected: [1, 1, 1, 0], note: 'Rising every day: the answer is always 1, except the last day.' },
  { args: [[30, 60, 90]], expected: [1, 1, 0], note: 'The last day has no later day at all.' },
  { args: [[50]], expected: [0], note: 'A single day.' },
  { args: [[70, 70, 71]], expected: [2, 1, 0], note: 'An equal temperature is not warmer.' },
];

// Hidden tests: falling temperatures, ties, a dip, and 10^5 days that are all equal or all
// equal until the last day, where scanning forward from every day is quadratic.
const hiddenArgs = [
  [[100, 99, 98]],
  [[55, 55, 55]],
  [[31, 30, 32]],
  [[89, 62, 70, 58, 47, 47, 46, 76, 100, 70]],
  [[30, 100, 30, 100, 30]],
  [randomTemps(7, 1000, MIN_T, MAX_T)],
  [new Array(MAX_N).fill(50)],
  [[...new Array(MAX_N - 1).fill(50), 51]],
  [randomTemps(11, MAX_N, MIN_T, MAX_T)],
  [Array.from({ length: MAX_N }, (_, i) => MAX_T - (i % 71))],
];

export const problem = {
  id: 'warmer-days',
  title: 'Warmer Days',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Stack', 'Monotonic Stack'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['temperatures'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p><code>temperatures[i]</code> is the temperature on day <code>i</code>. For every day,
    find how many days you have to wait after it until a day that is <strong>strictly</strong>
    warmer. If no later day is warmer, the answer for that day is <code>0</code>.</p>
    <p>Return the answers as an array with one entry per day.</p>
  `,
  constraints: [
    '1 <= temperatures.length <= 10^5',
    '30 <= temperatures[i] <= 100',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `temperatures = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Scanning forward from every day works. What does it cost when all 10^5 days have the same temperature?',
    'When a warm day arrives, which earlier days does it answer, and could it answer several at once?',
    'Among the days still waiting for an answer, how are their temperatures ordered?',
    'Which structure lets you look at the most recent waiting day and remove it once it is answered?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'dailyTemperatures',
    params: [{ name: 'temperatures', type: 'int[]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: temperatures as a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let temps;
    try {
      temps = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter temperatures as a JSON array, for example [73,74,75].' };
    }
    if (!Array.isArray(temps) || temps.length < 1 || temps.length > MAX_N) return { ok: false, error: 'temperatures must have 1 to 10^5 elements.' };
    if (!temps.every((v) => Number.isInteger(v) && v >= MIN_T && v <= MAX_T)) return { ok: false, error: 'Temperatures must be integers from 30 to 100.' };
    return { ok: true, args: [temps] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
