/**
 * Problem: Dotted Quads
 *
 * Insert three dots into a digit string so that it reads as an IPv4 address: four parts, each a
 * whole number from 0 to 255 written without leading zeros ("0" alone is fine), every digit used
 * in order. Return all ways.
 *
 * Backtracking over part lengths 1 to 3, with pruning on the digits that remain (each remaining
 * part needs 1 to 3 of them). Trying shorter parts first gives lexicographic order, because "."
 * sorts before every digit, so a shorter part always beats a longer one that starts the same way.
 */

const MAX_LEN = 20;

/**
 * Reference: depth-first search over the four parts, shortest part first.
 * @param {string} s digits
 * @returns {string[]} sorted
 */
export function reference(s) {
  const out = [];
  const parts = [];
  const dfs = (pos) => {
    const left = 4 - parts.length;
    const rest = s.length - pos;
    // Each remaining part takes 1 to 3 digits, so anything outside that range is a dead end.
    if (rest < left || rest > left * 3) return;
    if (left === 0) {
      out.push(parts.join('.'));
      return;
    }
    for (let len = 1; len <= 3; len++) {
      const part = s.slice(pos, pos + len);
      if (part.length < len) break;
      // A leading zero is allowed only for the single digit "0".
      if (len > 1 && part[0] === '0') break;
      if (Number(part) > 255) break;
      parts.push(part);
      dfs(pos + len);
      parts.pop();
    }
  };
  dfs(0);
  return out;
}

const visible = [
  { args: ['25525511135'], expected: ['255.255.11.135', '255.255.111.35'], note: '255 is the largest part, and 11.135 or 111.35 are the only splits of the rest.' },
  { args: ['0000'], expected: ['0.0.0.0'], note: 'A part may be the single digit 0.' },
  { args: ['101023'], expected: ['1.0.10.23', '1.0.102.3', '10.1.0.23', '10.10.2.3', '101.0.2.3'], note: 'Five splits. Parts such as 02 or 023 would need a leading zero, so a 0 always stands alone.' },
  { args: ['1111'], expected: ['1.1.1.1'], note: 'Four digits leave exactly one way: one digit per part.' },
  { args: ['999999999999'], expected: [], note: '999 is above 255, so no part can use three nines.' },
];

// Hidden tests: leading zeros, too short, the 12-digit all-ones (one split), the 255 boundary, 9-digit strings with many splits,
// 256 and above, and 20 digits (the maximum, no split fits).
const hiddenArgs = [
  ['010010'],
  ['1'],
  ['111111111111'],
  ['255255255255'],
  ['172162541'],
  ['101010101'],
  ['256256256256'],
  ['111111111'],
  ['00000000000000000000'],
  ['12345678901234567890'],
];

export const problem = {
  id: 'dotted-quads',
  title: 'Dotted Quads',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Backtracking', 'String Splitting'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>An address in the old dotted style has four parts separated by dots, such as
    <code>192.168.1.1</code>. Each part is a whole number from 0 to 255 and is written without
    leading zeros: <code>0</code> is fine, <code>01</code> and <code>00</code> are not.</p>
    <p>You are given a string <code>s</code> of digits with the dots removed. Insert exactly three
    dots, keeping every digit and their order, so that the result is a valid address. Return every
    such address, in <strong>dictionary order</strong>. If there is none, return an empty list.</p>
  `,
  constraints: [
    '1 <= s.length <= 20',
    's consists of digits only',
    'Output in dictionary order',
    'Target complexity: O(1), at most 3^4 splits to try',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How many digits can one part have, and so how many choices do you have for where the first dot goes?',
    'After you fix the first part, what remains to be done, and is it the same kind of question?',
    'Which parts are invalid even though they have 1 to 3 digits? Name every rule.',
    'When the digits left cannot fit the parts left (too few, or more than 3 per part), can you stop early?',
    'If you try shorter parts before longer ones, in what order do the finished addresses appear?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Pick the parts one at a time. For the next part, try taking 1, then 2, then 3 digits; keep a
    candidate only if it has no leading zero (unless it is just "0") and is at most 255; then solve
    the same question for the remaining digits with one part fewer. When four parts are chosen and
    no digits are left, join them with dots.</p>
    <h4>Why it works</h4>
    <p>Every address is one sequence of part lengths, and the search visits each valid sequence
    exactly once. Checking that the remaining digits fit the remaining parts (between 1 and 3 each)
    cuts off dead ends early. A shorter part is tried first, and since a dot sorts before any digit,
    the answers come out in dictionary order.</p>
    <h4>Complexity</h4>
    <p>O(1) time and space for a bounded input: at most 3 choices for each of 4 parts, so at most 81
    splits, each of at most 20 characters.</p>
    <h4>Pitfall</h4>
    <p>Parsing a part as a number hides the leading-zero rule: <code>Number("01")</code> is 1, which
    looks fine. Check the text, not only the value, and note that the lone <code>"0"</code> stays
    valid.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'dottedQuads',
    params: [{ name: 's', type: 'string' }],
    returns: 'string[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the digits as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the digits as a JSON string, for example "25525511135".' };
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_LEN) return { ok: false, error: 'Enter 1 to 20 digits as a JSON string.' };
    if (!/^[0-9]+$/.test(s)) return { ok: false, error: 'Use digits only.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
