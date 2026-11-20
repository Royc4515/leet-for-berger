/**
 * Problem: Squeeze Runs
 *
 * Run-length encode a string: every maximal block of one repeated character becomes the
 * character, followed by the block length when that length is above 1. The original problem
 * writes the result into the input array and returns its length; here the solution returns the
 * encoded string, which is the same content and works the same in every language. Counts of ten
 * or more are written as ordinary decimal digits, so a run of 12 adds the characters "12".
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Reference: one scan, flushing a run whenever the character changes. O(n) time.
 * @param {string} s
 * @returns {string}
 */
export function reference(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    out.push(s[i]);
    if (j - i > 1) out.push(String(j - i));
    i = j;
  }
  return out.join('');
}

/** Concatenated runs: each run has a random character and a length in [1, maxRun], up to `total` characters. */
function randomRuns(seed, total, maxRun, alphabet = ALPHABET) {
  const rnd = mulberry32(seed);
  const parts = [];
  let len = 0;
  while (len < total) {
    const run = Math.min(total - len, 1 + Math.floor(rnd() * maxRun));
    parts.push(alphabet[Math.floor(rnd() * alphabet.length)].repeat(run));
    len += run;
  }
  return parts.join('');
}

const visible = [
  { args: ['aabcccccaaa'], expected: 'a2bc5a3', note: 'Runs a2, b (length 1, no count), c5, a3.' },
  { args: ['abc'], expected: 'abc', note: 'No character repeats, so no counts are written.' },
  { args: ['aaaaaaaaaaaa'], expected: 'a12', note: 'A count of 12 is written as the two characters 1 and 2.' },
  { args: ['z'], expected: 'z', note: 'One character is a run of length 1.' },
  { args: ['xxyyyyz'], expected: 'x2y4z', note: 'A run of one needs no count, even at the end.' },
];

// Hidden tests: a run of exactly 9, 10 and 100 (counts that gain a digit), digits as input
// characters, a trailing run (forgetting to flush it), and five strings of 10^5 characters: a
// single run, alternating characters, random short runs over two letters, runs up to 300 over all
// 62 characters, and runs of 99, 100 and 1000 side by side.
const hiddenInputs = [
  `${'a'.repeat(9)}${'b'.repeat(10)}`,
  `${'q'.repeat(100)}r`,
  '1122223',
  'a1a1a1',
  'aabbaa',
  'a'.repeat(MAX_LEN),
  'ab'.repeat(MAX_LEN / 2),
  randomRuns(41, MAX_LEN, 3, 'ab'),
  randomRuns(43, MAX_LEN, 300),
  `${'x'.repeat(99)}${'y'.repeat(100)}${'z'.repeat(1000)}${'w'.repeat(MAX_LEN - 1199)}`,
];

export const problem = {
  id: 'squeeze-runs',
  title: 'Squeeze Runs',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'String Building'],
  timeLimitMs: 2000,
  argNames: ['s'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Compress a string <code>s</code> by replacing each <em>run</em> (a maximal block of the same
    character) with the character itself followed by the length of the run. A run of length 1 is
    written as just the character, with no count.</p>
    <p>The length is written in ordinary decimal digits, so a run of 12 adds the two characters
    <code>1</code> and <code>2</code>. Return the compressed string.</p>
    <p>For example, <code>"aabcccccaaa"</code> becomes <code>"a2bc5a3"</code>. The result is never
    longer than <code>s</code>.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of English letters (upper and lower case) and digits',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Compress "aaabbc" by hand. At which moments do you know a run is over, and what do you need to remember until then?',
    'Use two pointers: one at the start of a run and one that walks to its end. What is the run length when the second pointer stops?',
    'A count of 1 is skipped. What about a count of 12 or 100: how do you turn the number into characters, and in which order?',
    'What happens at the very end of the string: does anything tell you the last run is finished?',
    'Where do you put the output so that repeated string concatenation does not copy the whole result every time?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Walk the string with a start pointer <code>i</code>. For each run, move a second pointer
    <code>j</code> forward while the character is the same. Append the character, and append
    <code>j - i</code> as decimal digits when it is greater than 1. Then continue from <code>j</code>.</p>
    <h4>Why it works</h4>
    <p>Each pointer only moves forward, so every character is looked at a constant number of times.
    Starting the next run at <code>j</code> means the final run is handled by the same loop: it ends
    because <code>j</code> reaches the end of the string, so no special flush is needed.</p>
    <h4>Complexity</h4>
    <p>O(n) time. The output never exceeds <code>n</code> characters, because a run of length L
    becomes at most <code>1 + digits(L)</code>, which is at most L for L at least 2.</p>
    <h4>Pitfall</h4>
    <p>A count above 9 is several characters, not one: writing a single digit or a character code
    breaks runs of 10 or more. Writing "1" after a single character breaks runs of length 1.
    Counting a character across the whole string instead of per run turns <code>"aabaa"</code> into
    <code>"a4b"</code> instead of <code>"a2ba2"</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'squeezeRuns',
    params: [{ name: 's', type: 'string' }],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((s) => ({ args: [s], expected: reference(s) })),

  /**
   * Custom input: the text as one JSON string, for example "aabcccccaaa".
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let s;
    try {
      s = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter s as a JSON string, for example "aabcccccaaa".' };
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_LEN) return { ok: false, error: 's must have 1 to 10^5 characters.' };
    if (!/^[A-Za-z0-9]+$/.test(s)) return { ok: false, error: 's must contain only English letters and digits.' };
    return { ok: true, args: [s] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
