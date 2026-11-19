/**
 * Problem: Bracket Check
 *
 * Decide whether a string of three bracket kinds is properly nested. The most recently opened
 * bracket is always the first one that must close, which is exactly last-in, first-out: a
 * stack. Counting alone cannot work once kinds can interleave.
 */

import { mulberry32 } from '../../engine/rng.js';

const PAIRS = { ')': '(', ']': '[', '}': '{' };

/**
 * Reference: push openers, pop and compare on every closer, the stack must end empty.
 * @param {string} s
 * @returns {boolean}
 */
export function reference(s) {
  const stack = [];
  for (const ch of s) {
    if (ch in PAIRS) {
      if (stack.pop() !== PAIRS[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}

const MAX_LEN = 100000;

/** A seeded, properly nested string of exactly n characters (n even). */
function balanced(seed, n) {
  const rnd = mulberry32(seed);
  const open = '([{';
  const close = { '(': ')', '[': ']', '{': '}' };
  const stack = [];
  let out = '';
  while (out.length < n) {
    const remaining = n - out.length;
    // Opening is allowed only while there is room left to close everything afterwards.
    const canOpen = stack.length < remaining;
    if (canOpen && (stack.length === 0 || rnd() < 0.5)) {
      const c = open[Math.floor(rnd() * 3)];
      stack.push(c);
      out += c;
    } else {
      out += close[stack.pop()];
    }
  }
  return out;
}

/** n / 2 openers of cycling kinds, then their closers: the deepest possible nesting. */
function deepNest(n) {
  const opens = Array.from({ length: n / 2 }, (_, i) => '([{'[i % 3]);
  const closes = opens.map((c) => ({ '(': ')', '[': ']', '{': '}' })[c]).reverse();
  return opens.join('') + closes.join('');
}

const visible = [
  { args: ['()'], expected: true, note: 'One matching pair.' },
  { args: ['()[]{}'], expected: true, note: 'Pairs side by side.' },
  { args: ['(]'], expected: false, note: 'The kinds must match.' },
  { args: ['([)]'], expected: false, note: 'Correct counts, wrong nesting: "[" must close before ")".' },
  { args: ['{[]}'], expected: true, note: 'Pairs inside pairs.' },
];

// Hidden tests: leftover openers, a closer with nothing open, odd length, and strings of 10^5
// characters where repeatedly deleting "()" pairs is quadratic.
const nearMiss = (() => {
  const s = balanced(23, MAX_LEN);
  // The last character is always a closer; swapping its kind breaks only that final match.
  const swap = { ')': ']', ']': '}', '}': ')' };
  return s.slice(0, -1) + swap[s[s.length - 1]];
})();

const hiddenArgs = [
  ['('],
  [']'],
  ['(('],
  ['){'],
  ['[({})]([]){}'],
  [balanced(7, 1000)],
  [deepNest(MAX_LEN)],
  [balanced(11, MAX_LEN)],
  [nearMiss],
  [`${deepNest(MAX_LEN - 2)}((`],
];

export const problem = {
  id: 'bracket-check',
  title: 'Bracket Check',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Stack', 'Matching Pairs'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>The string <code>s</code> contains only the characters <code>(</code>, <code>)</code>,
    <code>[</code>, <code>]</code>, <code>{</code> and <code>}</code>. Return <code>true</code>
    if the brackets are properly matched, otherwise <code>false</code>.</p>
    <p>Properly matched means: every closing bracket closes an opening bracket of the same kind,
    the bracket closed is always the most recently opened one that is still open, and no opening
    bracket is left open at the end.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5',
    's consists only of the characters ()[]{}',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 4).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'When you meet a closing bracket, which opening bracket is it allowed to close?',
    'Why is one counter per kind not enough? Try it on "([)]".',
    'Which data structure always hands back the most recently added item first?',
    'What should happen when a closer arrives and nothing is open, and what must be true when the string ends?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Push every opening bracket onto a stack. On a closing bracket, pop the top and check that it is
    the opener of the same kind. The string is valid when every pop matches and the stack is empty at
    the end.</p>
    <h4>Why it works</h4>
    <p>The bracket that must close next is always the most recently opened one that is still open: last
    in, first out. The stack holds the open brackets in the order they were opened, so its top is the
    only bracket a closer is allowed to match. Any other closer means the nesting crosses, as in
    <code>([)]</code>.</p>
    <h4>Complexity</h4>
    <p>O(n) time: one push or pop per character. O(n) space in the worst case, a string made only of
    openers.</p>
    <h4>Pitfall</h4>
    <p>The two edge cases at the ends. A closer that arrives when the stack is empty must give
    <code>false</code>, not a crash or a skipped check, and openers still on the stack when the string
    ends, as in <code>((</code>, also mean <code>false</code>. Counters per kind cannot replace the
    stack, because they ignore order.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'isValid',
    params: [{ name: 's', type: 'string' }],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the string, either raw (for example {[()]}) or JSON-quoted.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s = raw.trim();
    if (s.startsWith('"')) {
      try {
        s = JSON.parse(s);
      } catch {
        return { ok: false, error: 'A quoted string must be valid JSON.' };
      }
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_LEN) return { ok: false, error: 's must have 1 to 10^5 characters.' };
    if (!/^[()[\]{}]+$/.test(s)) return { ok: false, error: 's may contain only the characters ()[]{}.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
