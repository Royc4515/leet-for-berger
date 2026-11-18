/**
 * Problem: Lock Steps
 *
 * A 4-wheel combination lock starts at "0000"; each move turns one wheel one notch (9 and 0 are
 * neighbours). Find the fewest moves to reach the target without ever showing a dead-end code.
 * The states form an implicit graph of 10^4 nodes with 8 edges each, so BFS from "0000" is
 * O(10^4 * 8) whatever the input.
 *
 * The deadends limit is raised from LeetCode's 500 to 5000, so testing every state against a
 * plain list of deadends (O(D) per lookup) instead of a set becomes clearly slow.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_DEAD = 5000;

/**
 * Reference: BFS over codes. Written for any number of wheels (the code length) so the unit test
 * can check it exhaustively on small locks; the problem itself always uses 4.
 * @param {string[]} deadends
 * @param {string} target
 * @returns {number}
 */
export function reference(deadends, target) {
  const wheels = target.length;
  const start = '0'.repeat(wheels);
  const blocked = new Set(deadends);
  if (blocked.has(start)) return -1;
  if (target === start) return 0;
  const seen = new Set([start]);
  let frontier = [start];
  for (let steps = 1; frontier.length; steps++) {
    const next = [];
    for (const code of frontier) {
      for (let i = 0; i < wheels; i++) {
        const d = code.charCodeAt(i) - 48;
        for (const nd of [(d + 1) % 10, (d + 9) % 10]) {
          const candidate = code.slice(0, i) + nd + code.slice(i + 1);
          if (seen.has(candidate) || blocked.has(candidate)) continue;
          if (candidate === target) return steps;
          seen.add(candidate);
          next.push(candidate);
        }
      }
    }
    frontier = next;
  }
  return -1;
}

const pad = (v) => String(v).padStart(4, '0');

/** count random dead-end codes (repeats allowed), never the target, optionally never "0000". */
function randomDeadends(seed, count, target, allowStart) {
  const rnd = mulberry32(seed);
  const out = [];
  while (out.length < count) {
    const code = pad(Math.floor(rnd() * 10000));
    if (code === target || (!allowStart && code === '0000')) continue;
    out.push(code);
  }
  return out;
}

/** Every neighbour of a code: what you must block to wall it in. */
function neighbours(code) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const d = Number(code[i]);
    for (const nd of [(d + 1) % 10, (d + 9) % 10]) out.push(code.slice(0, i) + nd + code.slice(i + 1));
  }
  return out;
}

const visible = [
  { args: [['0201', '0101', '0102', '1212', '2002'], '0202'], expected: 6, note: 'The direct 4-move routes are blocked; one shortest detour is 0000 -> 1000 -> 1100 -> 1200 -> 1201 -> 1202 -> 0202.' },
  { args: [['8888'], '0009'], expected: 1, note: 'Turn the last wheel backwards: 0 -> 9.' },
  { args: [['8887', '8889', '8878', '8898', '8788', '8988', '7888', '9888'], '8888'], expected: -1, note: 'Every neighbour of the target is a dead end.' },
  { args: [['0000'], '8888'], expected: -1, note: 'The lock starts on a dead end, so no move is possible.' },
  { args: [['1234'], '0000'], expected: 0, note: 'Already open.' },
];

// Hidden tests: wrap-around (one wheel, then every wheel), the start walled in, the downward
// first moves blocked so wrapping needs a detour, a target two moves away reachable only through
// the one open neighbour of the start, repeated dead ends, the farthest target (5555), and 5000
// random dead ends (twice) where scanning a list per lookup is too slow.
const hiddenArgs = [
  [['1111'], '9999'],
  [neighbours('0000'), '5555'],
  [['5555'], '9090'],
  [['9000', '0900', '0090', '0009'], '8888'],
  [['0001', '0001', '0010', '0010', '0100'], '0011'],
  [neighbours('0000').filter((c) => c !== '9000'), '1100'],
  [['4444'], '5555'],
  [randomDeadends(7, MAX_DEAD, '5555', false), '5555'],
  [randomDeadends(11, MAX_DEAD, '7319', false), '7319'],
  [randomDeadends(13, 2000, '2468', false), '2468'],
];

export const problem = {
  id: 'lock-steps',
  title: 'Lock Steps',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['BFS', 'Implicit Graph'],
  timeLimitMs: 3000,
  argNames: ['deadends', 'target'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A lock has 4 wheels, each showing a digit from <code>0</code> to <code>9</code>. It starts
    at <code>"0000"</code>. One move turns a single wheel one notch up or down, and the wheels
    wrap around: <code>9</code> turns up to <code>0</code> and <code>0</code> turns down to
    <code>9</code>.</p>
    <p>The codes in <code>deadends</code> jam the lock: if the wheels ever show one of them, the
    lock can no longer move. Return the fewest moves needed to show <code>target</code>, or
    <code>-1</code> if it cannot be reached. If <code>"0000"</code> is itself a dead end, no move
    is possible.</p>
  `,
  constraints: [
    '1 <= deadends.length <= 5000 (raised from LeetCode\'s 500); codes may repeat',
    'deadends[i] and target are strings of exactly 4 digits',
    'target is not in deadends',
    'Target complexity: O(10^4 * 8) moves examined, with O(1) dead-end lookups',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `deadends = ${JSON.stringify(t.args[0])}, target = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How many different codes can the lock show, and from one code, how many codes are one move away?',
    'If each code is a node, what search finds the fewest moves to the target?',
    'How do you check quickly whether a code is a dead end or already visited?',
    'What should happen when the starting code itself is a dead end?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'openLock',
    params: [
      { name: 'deadends', type: 'string[]' },
      { name: 'target', type: 'string' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: deadends as a JSON array on the first line, target as a JSON string on the second.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: deadends as a JSON array, then target as a JSON string.' };
    let deadends;
    let target;
    try {
      deadends = JSON.parse(lines[0]);
      target = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON.' };
    }
    const isCode = (c) => typeof c === 'string' && /^[0-9]{4}$/.test(c);
    if (!Array.isArray(deadends) || deadends.length < 1 || deadends.length > MAX_DEAD) return { ok: false, error: 'deadends must have 1 to 5000 codes.' };
    if (!deadends.every(isCode) || !isCode(target)) return { ok: false, error: 'Every code must be a string of exactly 4 digits.' };
    if (deadends.includes(target)) return { ok: false, error: 'target must not be a dead end.' };
    return { ok: true, args: [deadends, target] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
