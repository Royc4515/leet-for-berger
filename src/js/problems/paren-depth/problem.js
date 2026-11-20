/**
 * Problem: Paren Depth
 *
 * How deeply are the round brackets of an arithmetic expression nested? The expression is
 * balanced, so no stack of characters is needed: a single counter that goes up on "(" and down on
 * ")" is the current depth, and the answer is the highest value it ever reaches.
 *
 * Limits are raised to 10^5 characters, so a solution that repeatedly strips innermost pairs
 * (one pass per level) is quadratic on a deeply nested input and times out.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;
const FILLER = '0123456789+-*/';

/**
 * Reference: a depth counter, remembering the highest value it reached.
 * @param {string} s
 * @returns {number}
 */
export function reference(s) {
  let depth = 0;
  let best = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') {
      depth++;
      if (depth > best) best = depth;
    } else if (s[i] === ')') {
      depth--;
    }
  }
  return best;
}

/**
 * A seeded balanced string of exactly n characters. `up` is the chance of opening a bracket when
 * both opening and closing are possible: high values give deep nesting, low values shallow.
 */
function balanced(seed, n, up) {
  const rnd = mulberry32(seed);
  const parts = [];
  let depth = 0;
  for (let i = 0; i < n; i++) {
    const left = n - i;
    let ch;
    if (depth === left) ch = ')';
    else {
      const r = rnd();
      if (r < up && depth + 1 < left) ch = '(';
      else if (r < up + (1 - up) / 2 && depth > 0) ch = ')';
      else ch = FILLER[Math.floor(rnd() * FILLER.length)];
    }
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    parts.push(ch);
  }
  return parts.join('');
}

const visible = [
  { args: ['(1+(2*3)+((8)/4))+1'], expected: 3, note: 'The deepest spot is the 8, inside three open brackets.' },
  { args: ['(1)+((2))+(((3)))'], expected: 3, note: 'Depth goes back to 0 between groups; only the highest point counts.' },
  { args: ['1+2*3'], expected: 0, note: 'No brackets, no nesting.' },
  { args: ['(1)+(2)+(3)'], expected: 1, note: 'Three brackets in total, but never more than one open at a time.' },
  { args: ['((1+2)*(3+4))'], expected: 2, note: 'Two sibling groups inside one outer group.' },
];

// Hidden tests: the smallest inputs, siblings that never nest, one long chain, a random walk, and
// four inputs at 10^5 characters (a 50000-deep chain, flat siblings, deep random, shallow random).
const hiddenArgs = [
  ['()'],
  ['7'],
  ['(1)(2)(3)(4)(5)'],
  ['1+(2+(3+(4+(5))))'],
  ['((1)+(2))*((3)+(4))'],
  [balanced(31, 300, 0.4)],
  ['('.repeat(50000) + ')'.repeat(50000)],
  ['()'.repeat(50000)],
  [balanced(37, MAX_LEN, 0.5)],
  [balanced(41, MAX_LEN, 0.15)],
];

/**
 * Is every bracket of s matched, never closing before it opens?
 * @param {string} s
 */
function isBalanced(s) {
  let depth = 0;
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')' && --depth < 0) return false;
  }
  return depth === 0;
}

export const problem = {
  id: 'paren-depth',
  title: 'Paren Depth',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Counting', 'Stack Depth'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a string <code>s</code> holding an arithmetic expression: digits, the
    operators <code>+ - * /</code> and round brackets. Its brackets are balanced: each
    <code>(</code> is closed by a later <code>)</code>, and no <code>)</code> appears with nothing
    open.</p>
    <p>The <strong>nesting depth</strong> at a position is the number of brackets that are open there.
    Return the largest nesting depth that occurs anywhere in <code>s</code>, or 0 if it has no
    brackets.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of the digits 0-9, the characters + - * / ( and )',
    'The brackets of s are balanced',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Walk through the string from the left. What would you write down after each character to know how many brackets are open right now?',
    'Which characters change that number, and which can you ignore?',
    'Do you need to remember which bracket is open, or only how many are?',
    'The number goes up and down as you walk. Which single value from that walk is the answer?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Scan once with a counter for the number of open brackets. A <code>(</code> adds one, a
    <code>)</code> subtracts one, everything else is ignored. After each opening bracket, compare the
    counter with the best value seen so far.</p>
    <h4>Why it works</h4>
    <p>The counter equals the nesting depth at every position, by definition: it counts the brackets
    opened and not yet closed. The deepest point of the expression is therefore the maximum of the
    counter, and it can only reach a new maximum right after an opening bracket, so checking there is
    enough. A stack of characters would hold the same information in a heavier form.</p>
    <h4>Complexity</h4>
    <p>O(n) time for one pass and O(1) extra space, two integers.</p>
    <h4>Pitfall</h4>
    <p>Depth is not the number of opening brackets: <code>(1)+(2)+(3)</code> has three of them but
    never more than one open at once. Nor is it the longest run of <code>(</code> in a row, because
    digits and operators can sit between the brackets that stack up.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'maxParenDepth',
    params: [{ name: 's', type: 'string' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the expression as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the expression as a JSON string, for example "(1+(2*3))".' };
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_LEN) return { ok: false, error: 'Enter a string of 1 to 10^5 characters.' };
    if (!/^[0-9+\-*/()]+$/.test(s)) return { ok: false, error: 'Use only digits, + - * / and round brackets.' };
    if (!isBalanced(s)) return { ok: false, error: 'The brackets must be balanced.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). A random expression
  // body of digits and operators with brackets opened and closed at random (about one in four
  // characters), closed at the end: balanced, and every character is read.
  growth: {
    target: 'n',
    n: 's.length',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000],
    input: (n, seed) => {
      const rng = mulberry32(seed);
      const plain = '0123456789+-*/';
      const out = [];
      let depth = 0;
      for (let i = 0; i < n - 1; i++) {
        const r = rng();
        if (r < 0.125) {
          out.push('(');
          depth++;
        } else if (r < 0.25 && depth > 0) {
          out.push(')');
          depth--;
        } else out.push(plain[Math.floor(rng() * plain.length)]);
      }
      for (; depth > 0; depth--) out.push(')');
      return [out.join('')];
    },
  },
};

export default problem;
