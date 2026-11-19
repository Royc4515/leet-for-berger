/**
 * Problem: Postfix Eval
 *
 * Evaluate an arithmetic expression written in postfix (reverse Polish) notation. Operands wait
 * on a stack until an operator arrives; the operator always takes the two most recent ones. The
 * traps are all in the details: operand order for "-" and "/", "-3" being a number rather than
 * an operator, and division that truncates toward zero (not floor division).
 */

import { mulberry32 } from '../../engine/rng.js';

const OPS = ['+', '-', '*', '/'];
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

/**
 * Applies one operator. Division truncates toward zero.
 * @param {string} op
 * @param {number} a left operand
 * @param {number} b right operand
 */
function apply(op, a, b) {
  // `+ 0` turns -0 (from 0 * -3 or -1 / 3) into 0; integers have no negative zero.
  switch (op) {
    case '+':
      return a + b + 0;
    case '-':
      return a - b + 0;
    case '*':
      return a * b + 0;
    default:
      return Math.trunc(a / b) + 0;
  }
}

/**
 * Reference: operand stack; an operator pops the right operand first, then the left one.
 * @param {string[]} tokens
 * @returns {number}
 */
export function reference(tokens) {
  const stack = [];
  for (const t of tokens) {
    if (OPS.includes(t)) {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(apply(t, a, b));
    } else {
      stack.push(Number(t) + 0); // "-0" is a legal literal; keep the result a plain 0
    }
  }
  return stack[0];
}

const MAX_LEN = 100000;
const MAX_OPERAND = 200;
// Generated intermediates stay well inside 32 bits, so no language needs 64-bit arithmetic.
const GEN_LIMIT = 1000000000;

/**
 * A seeded valid expression of `len` tokens (odd). `pushBias` is the chance of pushing an operand
 * when an operator would also be legal: 0 gives a left-deep chain (stack depth at most 2), 1
 * pushes every operand first (stack depth about len / 2).
 */
function randomRpn(seed, len, pushBias) {
  const rnd = mulberry32(seed);
  const operands = (len + 1) / 2;
  const stack = [];
  const tokens = [];
  let pushed = 0;
  while (tokens.length < len) {
    const canPush = pushed < operands;
    if (canPush && (stack.length < 2 || rnd() < pushBias)) {
      const v = Math.floor(rnd() * (2 * MAX_OPERAND + 1)) - MAX_OPERAND;
      stack.push(v);
      tokens.push(String(v));
      pushed++;
      continue;
    }
    const b = stack.pop();
    const a = stack.pop();
    // Shuffle the operators and take the first legal one. One of + and - always stays within
    // max(|a|, |b|), so a legal choice always exists.
    // Fisher-Yates, not sort() with a random comparator: engines sort differently, and the
    // tests must come out the same in every browser.
    const order = [...OPS];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const op = order.find((o) => !(o === '/' && b === 0) && Math.abs(apply(o, a, b)) <= GEN_LIMIT);
    stack.push(apply(op, a, b));
    tokens.push(op);
  }
  return tokens;
}

const visible = [
  { args: [['3', '4', '+', '2', '*']], expected: 14, note: '(3 + 4) * 2 = 14.' },
  { args: [['6', '20', '7', '/', '+']], expected: 8, note: '20 / 7 = 2 (the fraction is dropped), then 6 + 2 = 8.' },
  { args: [['7', '-2', '/']], expected: -3, note: '7 / -2 = -3.5, truncated toward zero to -3 (not -4).' },
  { args: [['5', '8', '-']], expected: -3, note: 'The operand pushed first is on the left: 5 - 8.' },
  { args: [['42']], expected: 42, note: 'A single number is already the value.' },
];

// Hidden tests: negative division in both directions, a result of zero from a negative
// numerator, operand order, negative literals, and three expressions of 99999 tokens: a
// left-deep chain, a stack 5 * 10^4 deep (recursive evaluators overflow) and a random mix.
const hiddenArgs = [
  [['-7', '2', '/']],
  [['1', '3', '/']],
  [['-1', '3', '/']],
  [['0', '5', '-']],
  [['-200', '-200', '*', '-200', '*']],
  [['2', '3', '4', '*', '+', '10', '-', '3', '/']],
  [randomRpn(7, 999, 0.5)],
  [randomRpn(11, MAX_LEN - 1, 0)],
  [randomRpn(13, MAX_LEN - 1, 1)],
  [randomRpn(17, MAX_LEN - 1, 0.5)],
];

export const problem = {
  id: 'postfix-eval',
  title: 'Postfix Eval',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Stack', 'Expression Evaluation'],
  timeLimitMs: 2000,
  argNames: ['tokens'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>An arithmetic expression is given in <strong>postfix</strong> notation (also called
    reverse Polish notation) as an array of strings <code>tokens</code>. Each token is either an
    integer or one of the operators <code>+</code>, <code>-</code>, <code>*</code>,
    <code>/</code>. An operator applies to the two values computed just before it: for
    <code>["5", "8", "-"]</code> the result is <code>5 - 8</code>.</p>
    <p>Return the value of the expression as an integer.</p>
    <p>Division between integers <strong>truncates toward zero</strong>: <code>7 / -2</code> is
    <code>-3</code> and <code>-1 / 3</code> is <code>0</code>. Careful: floor division (such as
    Python's <code>//</code>) rounds negative results the other way.</p>
    <p>The expression is always valid, never divides by zero, and every intermediate result fits
    in a 32-bit signed integer.</p>
  `,
  constraints: [
    '1 <= tokens.length <= 10^5',
    'tokens[i] is an operator (+, -, *, /) or an integer in [-200, 200]',
    'The expression is valid and never divides by zero',
    'Every intermediate value and the result fit in a 32-bit signed integer',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `tokens = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'When you read an operator, which two values does it combine?',
    'Which structure hands back the most recently computed values first?',
    'After popping two values for "-", which one goes on the left?',
    'How do you tell the operator "-" apart from the number "-3"?',
    'What does your language do for -7 / 2, and is that truncation toward zero?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Scan the tokens with a stack of values. A number is pushed. An operator pops two values, applies
    itself to them and pushes the result. When the tokens run out, the one value on the stack is the
    answer.</p>
    <h4>Why it works</h4>
    <p>In postfix form the two operands of an operator are exactly the two values computed just before
    it, and those are the two most recent entries on the stack. The value popped first was pushed last,
    so it is the right operand: for <code>-</code> and <code>/</code> compute <code>a op b</code> where
    <code>b</code> is the first pop.</p>
    <h4>Complexity</h4>
    <p>O(n) time: constant work per token. O(n) space for the stack, for example when many numbers come
    before the operators.</p>
    <h4>Pitfall</h4>
    <p>Division must truncate toward zero. Python's <code>//</code> floors, so <code>-7 // 2</code>
    gives <code>-4</code> instead of <code>-3</code>; divide the absolute values and restore the sign.
    Two other slips: swapping the operands of <code>-</code> or <code>/</code>, and spotting operators
    by their first character, which treats <code>"-3"</code> as a minus sign.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'evalPostfix',
    params: [{ name: 'tokens', type: 'string[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: tokens as a JSON array of strings. The expression is evaluated here to check
   * that it is well formed, never divides by zero and stays within 32 bits.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let tokens;
    try {
      tokens = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter tokens as a JSON array of strings, for example ["2","1","+"].' };
    }
    if (!Array.isArray(tokens) || tokens.length < 1 || tokens.length > MAX_LEN) return { ok: false, error: 'tokens must have 1 to 10^5 entries.' };
    let depth = 0;
    const stack = [];
    for (const t of tokens) {
      if (typeof t !== 'string') return { ok: false, error: 'Every token must be a string.' };
      if (OPS.includes(t)) {
        if (depth < 2) return { ok: false, error: `Operator "${t}" needs two values before it.` };
        const b = stack.pop();
        const a = stack.pop();
        if (t === '/' && b === 0) return { ok: false, error: 'The expression divides by zero.' };
        const r = apply(t, a, b);
        if (r < INT_MIN || r > INT_MAX) return { ok: false, error: 'An intermediate value leaves the 32-bit range.' };
        stack.push(r);
        depth--;
      } else {
        if (!/^-?(0|[1-9]\d{0,2})$/.test(t) || Math.abs(Number(t)) > MAX_OPERAND) return { ok: false, error: 'Numbers must be integers from -200 to 200.' };
        stack.push(Number(t));
        depth++;
      }
    }
    if (depth !== 1) return { ok: false, error: 'The expression must reduce to exactly one value.' };
    return { ok: true, args: [tokens] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
