/**
 * Problem: Unfold Brackets
 *
 * Expand a run-length style encoding where k[text] means text written k times and text may itself
 * hold more k[...] groups. The innermost group must be expanded before the group around it, which
 * is last-in, first-out: a stack. The count of a group is read before its "[", so it is pushed
 * together with where the group's output starts.
 *
 * Solutions write into ONE output buffer and, on "]", append the group's own text k - 1 more
 * times. Rebuilding strings per level instead is slow on deep chains such as 1[1[1[...]]].
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 10000;
const MAX_OUT = 100000;
const MAX_K = 300;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Reference: single buffer plus a stack of (start of group output, repeat count).
 * @param {string} s a well-formed encoding
 * @returns {string}
 */
export function reference(s) {
  let out = '';
  const stack = [];
  let k = 0;
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') {
      k = k * 10 + (ch.charCodeAt(0) - 48);
    } else if (ch === '[') {
      stack.push([out.length, k]);
      k = 0;
    } else if (ch === ']') {
      const [start, times] = stack.pop();
      out += out.slice(start).repeat(times - 1);
    } else {
      out += ch;
    }
  }
  return out;
}

/** What is wrong with `s` as an input, or null when it is a valid encoding within the limits. */
function inputError(s) {
  if (typeof s !== 'string' || s.length < 1 || s.length > MAX_LEN) return 'Enter an encoding of 1 to 10^4 characters.';
  if (!/^[a-z0-9[\]]+$/.test(s)) return 'Use only lowercase letters, digits, [ and ].';
  const stack = [];
  let len = 0;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch >= 'a' && ch <= 'z') {
      len++;
      i++;
    } else if (ch >= '0' && ch <= '9') {
      let j = i;
      while (j < s.length && s[j] >= '0' && s[j] <= '9') j++;
      const digits = s.slice(i, j);
      if (s[j] !== '[') return 'Every count must be followed directly by [.';
      const k = Number(digits);
      if (digits[0] === '0' || k < 1 || k > MAX_K) return 'Counts are whole numbers from 1 to 300 without leading zeros.';
      stack.push([len, k]);
      len = 0;
      i = j + 1;
    } else if (ch === ']') {
      if (!stack.length) return 'A ] has no matching [.';
      if (len === 0) return 'Brackets may not be empty.';
      const [outer, k] = stack.pop();
      len = outer + len * k;
      if (len > MAX_OUT) return 'The decoded string may have at most 10^5 characters.';
      i++;
    } else {
      return 'A [ must come right after a count.';
    }
  }
  if (stack.length) return 'A [ is never closed.';
  return null;
}

/** A seeded encoding whose decoded length is at most `budget`, nested up to `depth` levels. */
function encoded(rnd, budget, depth) {
  let enc = '';
  let len = 0;
  const pieces = 1 + Math.floor(rnd() * 4);
  for (let p = 0; p < pieces; p++) {
    const room = budget - len;
    if (room <= 0) break;
    if (depth > 0 && room >= 2 && rnd() < 0.6) {
      const k = 1 + Math.floor(rnd() * Math.min(MAX_K, room));
      const inner = encoded(rnd, Math.floor(room / k), depth - 1);
      enc += `${k}[${inner.enc}]`;
      len += k * inner.len;
    } else {
      const m = 1 + Math.floor(rnd() * Math.min(5, room));
      for (let i = 0; i < m; i++) enc += LETTERS[Math.floor(rnd() * 26)];
      len += m;
    }
  }
  return enc.length ? { enc, len } : { enc: 'a', len: 1 };
}

const seeded = (seed, budget, depth) => encoded(mulberry32(seed), budget, depth).enc;

const visible = [
  { args: ['3[a]2[bc]'], expected: 'aaabcbc', note: 'Two groups side by side: aaa, then bcbc.' },
  { args: ['3[a2[c]]'], expected: 'accaccacc', note: 'The inner 2[c] gives cc, so the outer group repeats acc three times.' },
  { args: ['2[abc]3[cd]ef'], expected: 'abcabccdcdcdef', note: 'Plain letters after a group stay as they are.' },
  { args: ['abc'], expected: 'abc', note: 'No groups: the string is its own decoding.' },
  { args: ['10[a]b'], expected: 'aaaaaaaaaab', note: 'A count can have several digits.' },
];

// Hidden tests: counts of one, two and three digits, nesting and trailing text, then max-size
// inputs: 300 copies of a long block (90000 chars), 16 nested doublings (65536), a 2000-deep chain
// of 1[...] (the string must not be rebuilt per level), 1000 sibling groups, a seeded random
// encoding with a 10^5 decoded budget, and four nested tens (20000).
const hiddenArgs = [
  ['1[1[z]]'],
  ['2[a2[b2[c]]]d'],
  ['100[ab]'],
  ['ab2[c]d3[e2[f]]g'],
  [`300[${'xyz'.repeat(100)}]`],
  ['2['.repeat(16) + 'q' + ']'.repeat(16)],
  ['1[ab'.repeat(1500) + 'c' + ']'.repeat(1500)],
  ['3[a]2[bc]'.repeat(1000)],
  [seeded(4, MAX_OUT, 5)],
  ['10[10[10[10[ab]]]]'],
];

export const problem = {
  id: 'unfold-brackets',
  title: 'Unfold Brackets',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Stack', 'Nested Structure'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A message is compressed with one rule: <code>k[text]</code> stands for <code>text</code>
    written <code>k</code> times in a row. The text inside the brackets may itself contain such
    groups, and letters may appear outside any group.</p>
    <p>Given the compressed string <code>s</code>, return the original message.</p>
    <p>The input is always well formed: every <code>[</code> has a matching <code>]</code> and
    comes right after its count, brackets are never empty, and digits appear only as counts (the
    original message holds only lowercase letters).</p>
  `,
  constraints: [
    '1 <= s.length <= 10^4',
    's consists of lowercase letters, digits, [ and ]',
    'Every count is a whole number from 1 to 300, written without leading zeros',
    'The decoded string has at most 10^5 characters',
    'Target complexity: O(n + output length) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'In "3[a2[c]]", which group do you have to finish first, and which one waits for it?',
    'When you reach a "[", what do you need to remember so you can come back to it at its "]"?',
    'What do you do when you meet a digit, and what if the count has more than one digit?',
    'When a "]" arrives, which part of the text built so far is the group, and how many times must it appear in total?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Build the answer left to right in one buffer. Read a count into a number. On
    <code>[</code>, push the current length of the buffer together with that count and start fresh. On
    <code>]</code>, pop: everything written since the pushed position is the group, so append it
    <code>count - 1</code> more times. Letters just go into the buffer.</p>
    <h4>Why it works</h4>
    <p>The innermost group closes first, and a stack hands back the most recent <code>[</code> first.
    When a group closes, all groups inside it are already expanded in the buffer, so repeating that
    slice is exactly what the outer count asks for. Text after the group simply continues the
    buffer.</p>
    <h4>Complexity</h4>
    <p>O(n + m) time for input length n and decoded length m: each character is read once, and each
    appended copy adds to the output. O(n) extra space for the stack.</p>
    <h4>Pitfall</h4>
    <p>Counts can be several digits, so build the number as <code>k * 10 + digit</code> instead of
    taking one character. Also reset the count after each <code>[</code>, or the next group inherits
    leftover digits.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'unfoldBrackets',
    params: [{ name: 's', type: 'string' }],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the encoded string as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the encoding as a JSON string, for example "3[a2[c]]".' };
    }
    const error = inputError(s);
    return error ? { ok: false, error } : { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
