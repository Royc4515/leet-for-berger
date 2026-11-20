/**
 * Problem: Plain Arithmetic
 *
 * Equivalent to LeetCode 227; statement and tests are written for this project. Evaluate an
 * expression of non-negative integers joined by + - * / with no brackets. Scan once and keep the
 * running total of finished terms plus the current (signed) last term: * and / rewrite the last
 * term in place, + and - bank it and start a new one.
 *
 * Division truncates toward zero. The expression never divides a negative number, but a scan that
 * stores a term as -5 after a minus sign does: -5 / 2 must give -2 (as in C, Java and Go), not the
 * floor -3 that Python's // returns. Classic wrong answers: evaluating left to right with no
 * precedence, doing every * before every / (8/2*3 is 12, not 1), flooring negative quotients,
 * reading single digits, and dropping the last number when the text ends with a space.
 *
 * Range rule used by every test: each product or quotient in a term and each running total fits in a
 * signed 32-bit integer, so int arithmetic is exact in all 8 languages.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 300000;
const INT_MAX = 2147483647;

/**
 * Reference: single pass keeping the banked total and the signed last term.
 * @param {string} s
 * @returns {number}
 */
export function reference(s) {
  let total = 0;
  let last = 0;
  let num = 0;
  let op = '+';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c >= '0' && c <= '9') num = num * 10 + (c.charCodeAt(0) - 48);
    // Spaces never end a number, so a trailing space still flushes the final one at the last index.
    if ((c !== ' ' && (c < '0' || c > '9')) || i === s.length - 1) {
      if (op === '+') {
        total += last;
        last = num;
      } else if (op === '-') {
        total += last;
        last = -num;
      } else if (op === '*') last *= num;
      else last = Math.trunc(last / num);
      op = c;
      num = 0;
    }
  }
  return total + last;
}

/**
 * True when every term step and running total of a valid expression stays inside signed 32-bit,
 * and no division by zero occurs. Exact, using BigInt.
 * @param {string} s
 * @returns {boolean}
 */
export function fitsInt32(s) {
  const lo = -(2n ** 31n);
  const hi = 2n ** 31n - 1n;
  const ok = (v) => v >= lo && v <= hi;
  const tokens = s.match(/\d+|[-+*/]/g);
  let total = 0n;
  let term = BigInt(tokens[0]);
  let sign = 1n;
  if (!ok(term)) return false;
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const n = BigInt(tokens[i + 1]);
    if (!ok(n)) return false;
    if (op === '*') term *= n;
    else if (op === '/') {
      if (n === 0n) return false;
      term /= n; // BigInt division truncates toward zero
    } else {
      total += sign * term;
      if (!ok(total)) return false;
      sign = op === '+' ? 1n : -1n;
      term = n;
    }
    if (!ok(term)) return false;
  }
  return ok(total + sign * term);
}

/** 1 or 2 spaces with probability `p`, else nothing. */
function pad(rnd, p) {
  return rnd() < p ? ' '.repeat(1 + Math.floor(rnd() * 2)) : '';
}

/**
 * Seeded valid expression of at most `maxLen` characters. Numbers are 0..maxNum, a term has up to
 * `maxFactors` extra factors, and signs are chosen so no running total leaves 32-bit.
 */
function randomExpr(seed, maxLen, maxNum, maxFactors, spaceP) {
  const rnd = mulberry32(seed);
  const limit = BigInt(INT_MAX);
  let out = pad(rnd, spaceP);
  let total = 0n;
  for (let t = 0; ; t++) {
    const first = Math.floor(rnd() * (maxNum + 1));
    let value = BigInt(first);
    const tokens = [String(first)];
    const factors = Math.floor(rnd() * (maxFactors + 1));
    for (let f = 0; f < factors; f++) {
      if (rnd() < 0.5) {
        const cap = value === 0n ? maxNum : Math.min(maxNum, Number(limit / value));
        const n = Math.floor(rnd() * (cap + 1));
        value *= BigInt(n);
        tokens.push('*', String(n));
      } else {
        const n = 1 + Math.floor(rnd() * maxNum);
        value /= BigInt(n);
        tokens.push('/', String(n));
      }
    }
    let sign = '+';
    if (t > 0) {
      if (total + value > limit) sign = '-';
      else if (total - value < -limit - 1n) sign = '+';
      else sign = rnd() < 0.5 ? '+' : '-';
      tokens.unshift(sign);
    }
    let text = '';
    for (const tok of tokens) text += tok + pad(rnd, spaceP);
    if (out.length + text.length > maxLen) return out;
    out += text;
    total += sign === '-' ? -value : value;
  }
}

/** `unit` repeated and joined by `op`, as many as fit in MAX_LEN characters. */
function chain(unit, op, extraTail = '') {
  const n = Math.floor((MAX_LEN - extraTail.length + op.length) / (unit.length + op.length));
  return Array(n).fill(unit).join(op) + extraTail;
}

/** Terms of the form M/1/1 alternating with M, so partial sums stay at 0 or M. */
function bigAlternating() {
  const parts = [];
  let len = 0;
  for (let k = 0; ; k++) {
    const part = (k % 2 === 0 ? '+' : '-') + (k % 3 === 0 ? `${INT_MAX}/1/1` : `${INT_MAX}`);
    if (len + part.length > MAX_LEN - 1) break;
    parts.push(part);
    len += part.length;
  }
  return parts.join('').slice(1);
}

const visible = [
  { args: [' 3+2*2 '], expected: 7, note: 'Multiplication is done before addition: 3 + (2 * 2).' },
  { args: ['14-3/2'], expected: 13, note: '3/2 drops its fraction and gives 1, so 14 - 1.' },
  { args: ['8/3*3'], expected: 6, note: '* and / rank equally and go left to right: (8 / 3) * 3 = 2 * 3.' },
  { args: ['1-5/2'], expected: -1, note: '5/2 is 2 before it is subtracted, so the total is 1 - 2.' },
  { args: [' 20 + 3 * 4 - 100 / 7 '], expected: 18, note: 'Spaces are ignored and numbers can have several digits.' },
];

// Hidden tests: a lone 0 and the largest number, minus a quotient (floor vs truncate), a product
// near the 32-bit limit, random expressions with big and small numbers, and at max size (3 * 10^5
// characters): 150,000 ones added, a random mix with spaces everywhere, a chain of 1*1*...*1, and
// the largest number alternately added and subtracted.
const hiddenInputs = [
  '0',
  String(INT_MAX),
  '0-7/2-9/2+100/3*3',
  '46340*46340-2147483647+1-1*5',
  randomExpr(5, 600, 20, 3, 0.4),
  randomExpr(7, 5000, 1000000000, 2, 0),
  chain('1', '+'),
  randomExpr(11, MAX_LEN, 99, 4, 0.5),
  chain('1', '*', '+7'),
  bigAlternating(),
];

export const problem = {
  id: 'plain-arithmetic',
  title: 'Plain Arithmetic',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Stack', 'String Parsing', 'Math'],
  timeLimitMs: 3000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>The text <code>s</code> is an arithmetic expression made of non-negative integers and the
    operators <code>+</code>, <code>-</code>, <code>*</code> and <code>/</code>, with optional
    spaces. There are no brackets. Return its value.</p>
    <p>Multiplication and division bind tighter than addition and subtraction, and operators of
    the same rank are applied left to right. Division of integers drops the fractional part, so
    <code>7/2</code> is <code>3</code>; the division never has a zero divisor. Do not use a built-in
    that evaluates expression text.</p>
  `,
  constraints: [
    '1 <= s.length <= 3 * 10^5',
    's has digits, spaces and + - * /; it starts and ends with a number (spaces may surround any token)',
    'Every number is in [0, 2^31 - 1] with no leading zeros, except 0 itself',
    'Every product, quotient and running total fits in a signed 32-bit integer',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'In 3+2*2, which part must be finished before it can be added to the 3? How would you recognise such a part while reading left to right?',
    'Can you split the expression into terms joined by + and -, and evaluate each term on its own?',
    'While scanning, what do you need to remember: the sum of the finished terms, and what else?',
    'What should * and / do to the term you are building, and what should + and - do to it?',
    'The last number has no operator after it. How do you make sure it is applied, even if the text ends with a space?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Scan once. Read a number digit by digit; when the next operator (or the end of the text)
    arrives, apply the <em>previous</em> operator to that number. Keep two values: the total of
    the finished terms, and the current term. A <code>+</code> or <code>-</code> adds the current term
    to the total and starts a new term (<code>num</code> or <code>-num</code>). A <code>*</code> or
    <code>/</code> changes the current term in place. At the end, add the last term to the total.</p>
    <h4>Why it works</h4>
    <p>Terms joined by + and - are independent: the only thing that can still change a term is a
    following * or /, and those apply to it before the next + or - arrives. A running total plus one
    open term is therefore enough, which is what a stack would hold when the stack only ever
    keeps the finished terms.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(1) extra space.</p>
    <h4>Pitfall</h4>
    <p>Division must truncate toward zero. If you store a subtracted term as a negative number and
    then divide it, as in <code>1-5/2</code>, the stored term is -5, and -5 / 2 has to give -2. C,
    Java, C#, Go and C++ do that; Python's <code>//</code> rounds down to -3 and gives the wrong
    total, so truncate explicitly there (and use <code>Math.trunc</code> in JavaScript). Also
    flush the last number when the text ends with a space, and keep multiplication and division on
    the same level, left to right: <code>8/2*3</code> is 12, not 1.</p>
  `,

  // Neutral signature: starter code for all 8 languages is generated from it.
  signature: {
    name: 'evaluate',
    params: [{ name: 's', type: 'string' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((s) => ({ args: [s], expected: reference(s) })),

  /**
   * Custom input: the expression as a JSON string, for example " 3+2*2 ".
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the expression as a JSON string, for example " 3+2*2 ".' };
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_LEN) return { ok: false, error: 'The expression must have 1 to 3 * 10^5 characters.' };
    if (!/^ *(0|[1-9]\d*)( *[-+*/] *(0|[1-9]\d*))* *$/.test(s)) {
      return { ok: false, error: 'Use numbers without leading zeros, joined by + - * /, with optional spaces. Start and end with a number.' };
    }
    if (!fitsInt32(s)) return { ok: false, error: 'Every number, product, quotient and running total must fit in a signed 32-bit integer, and no division by zero.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
