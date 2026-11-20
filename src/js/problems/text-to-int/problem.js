/**
 * Problem: Text To Int
 *
 * Equivalent to LeetCode 8 (atoi); statement and tests are written for this project. Read the
 * integer at the start of a string the way a forgiving parser does: skip leading spaces, take an
 * optional sign, read digits until something else shows up, and clamp the result to the signed
 * 32-bit range. The result always fits in a 32-bit int; only the intermediate value can overflow,
 * so the point is to stop (or check) before it does.
 *
 * Classic wrong answers: letting the running value wrap around in a 32-bit int (or reading the
 * whole digit run into a 64-bit one), clamping only the positive side, clamping the minimum to
 * -(2^31 - 1), skipping spaces after the sign, accepting a second sign, and ignoring a stop
 * character in the middle of the text.
 *
 * The limit is raised from 200 to 10^5 characters so a digit run (or a run of leading zeros before
 * a boundary value) is long enough to break solutions that accumulate without checking.
 */

const MAX_LEN = 100000;
const INT_MAX = 2147483647;
const INT_MIN = -2147483648;

/**
 * Reference: scan once, stop growing the magnitude as soon as it passes the limit.
 * @param {string} s text to read
 * @returns {number} the integer at the start of s, clamped to 32 bits; 0 when there is none
 */
export function reference(s) {
  let i = 0;
  while (i < s.length && s[i] === ' ') i++;
  let sign = 1;
  if (s[i] === '+' || s[i] === '-') {
    if (s[i] === '-') sign = -1;
    i++;
  }
  let magnitude = 0;
  for (; i < s.length && s[i] >= '0' && s[i] <= '9'; i++) {
    magnitude = magnitude * 10 + (s.charCodeAt(i) - 48);
    // Past 2^31 nothing can bring the value back, and the number stays exact in a double.
    if (magnitude > 2147483648) break;
  }
  return Math.min(INT_MAX, Math.max(INT_MIN, sign * magnitude)) + 0;
}

const repeat = (ch, n) => ch.repeat(n);

const visible = [
  { args: ['42'], expected: 42, note: 'A plain number.' },
  { args: ['   -042'], expected: -42, note: 'Leading spaces are skipped, the sign is read, and leading zeros do not matter.' },
  { args: ['3.14159'], expected: 3, note: 'Reading stops at the first character that is not a digit.' },
  { args: ['words and 987'], expected: 0, note: 'The text does not start with a number, so the result is 0.' },
  { args: ['-91283472332'], expected: -2147483648, note: 'Too small for 32 bits: the result is clamped to -2^31.' },
];

// Hidden tests: empty text, two signs, a space after the sign, both 32-bit bounds exactly, one past
// the upper bound, a 10-digit value that would wrap to 1 in 32 bits, and three 10^5-character
// texts (a long negative digit run, spaces and zeros before a small number, and zeros before the
// lower bound).
const hiddenInputs = [
  '',
  '+-12',
  '  -  5',
  '2147483647',
  '-2147483648',
  '2147483648',
  '4294967297',
  '-' + repeat('9', MAX_LEN - 1),
  repeat(' ', 50000) + '+' + repeat('0', 49990) + '123abc' + repeat(' ', 3),
  '-' + repeat('0', MAX_LEN - 11) + '2147483648',
];

export const problem = {
  id: 'text-to-int',
  title: 'Text To Int',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['String Parsing', 'Overflow', 'Simulation'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Write a function that reads the integer at the start of the string <code>s</code>, like a
    forgiving parser, and returns it as a 32-bit signed integer. Follow these steps in order:</p>
    <ol>
      <li>Skip any leading space characters <code>' '</code> (and nothing else).</li>
      <li>If the next character is <code>'-'</code> or <code>'+'</code>, it is the sign: take it once.
      Without a sign the number is positive.</li>
      <li>Read digits until the first character that is not a digit, or the end of the text. Leading
      zeros are fine. If there are no digits, the result is <code>0</code>.</li>
      <li>If the number is smaller than <code>-2^31</code>, return <code>-2^31</code>. If it is larger
      than <code>2^31 - 1</code>, return <code>2^31 - 1</code>.</li>
    </ol>
    <p>Everything after the digits is ignored. The returned value always fits in a 32-bit integer.</p>
  `,
  constraints: [
    '0 <= s.length <= 10^5',
    's consists of English letters, digits, " ", "+", "-" and "."',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'What are the four things you read, in order, before the number is known?',
    'After the sign, can a space still be skipped? And what ends the digit run?',
    'How do you build the value digit by digit, and what is its type allowed to hold while you do?',
    'Before you multiply by 10 and add a digit, can you tell whether the result will already be too big?',
    'Once the value is past the limit, does reading more digits change the answer? What does a text of 100,000 nines do to a plain int?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Scan the text once with an index. Skip spaces, read an optional sign, then build the number
    from the digits: <code>value = value * 10 + digit</code>. Stop at the first non-digit. Keep the
    value as a magnitude in a wider type (or check before each step) and clamp when it passes
    <code>2^31</code>.</p>
    <h4>Why it works</h4>
    <p>The four rules are applied in the order they are stated, so each one only looks at the part of
    the text the previous one left. Digits only ever make the magnitude larger, so once it passes the
    limit the answer is the clamped bound whatever follows, and you can stop reading.</p>
    <h4>Complexity</h4>
    <p>O(n) time, each character is read once. O(1) extra space.</p>
    <h4>Pitfall</h4>
    <p>Multiplying a 32-bit int by 10 can wrap around before you compare it, so check first or use a
    64-bit value and stop early. Reading a 100,000-digit run into even a 64-bit integer overflows
    too. Also keep the order: a space after the sign ends the number, and a second sign is not part
    of it. The lower bound is <code>-2^31</code>, one further than the upper bound.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'textToInt',
    params: [{ name: 's', type: 'string' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((s) => ({ args: [s], expected: reference(s) })),

  /**
   * Custom input: the text as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the text as a JSON string, for example "   -42 with words".' };
    }
    if (typeof s !== 'string' || s.length > MAX_LEN) return { ok: false, error: 'The text must have at most 10^5 characters.' };
    if (!/^[A-Za-z0-9 +\-.]*$/.test(s)) return { ok: false, error: 'Use only letters, digits, spaces, "+", "-" and ".".' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Spaces, then a sign,
  // then zeros before a small number: a correct scan has to walk the whole text to reach the digit
  // that matters, and the number never overflows, so no solution can stop early.
  growth: {
    target: 'n',
    n: 's.length',
    sizes: [500000, 1000000, 2000000, 4000000, 8000000, 16000000],
    input: (n) => [' '.repeat(Math.floor(n / 2)) + '-' + '0'.repeat(Math.floor(n / 2) - 3) + '42x'],
  },
};

export default problem;
