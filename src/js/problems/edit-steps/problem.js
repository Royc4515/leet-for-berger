/**
 * Problem: Edit Steps
 *
 * The fewest single-character insertions, deletions and replacements that turn one word into
 * another (Levenshtein distance). 2D DP over prefixes: dp[i][j] is the distance between the first
 * i letters of word1 and the first j of word2, from three neighbours, with one row kept at a time.
 *
 * Classic wrong answers: counting mismatched positions (fails on shifts like "abc" vs "bc"),
 * using length difference plus mismatches, forgetting the empty-prefix row and column, and plain
 * recursion, which is exponential (and memoized recursion goes 1000 calls deep at the limits).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 500;

/**
 * Reference: one-row DP over prefixes.
 * @param {string} word1
 * @param {string} word2
 * @returns {number}
 */
export function reference(word1, word2) {
  const n = word2.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= word1.length; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = word1[i - 1] === word2[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[n];
}

function randomWord(rnd, n, alphabet) {
  return Array.from({ length: n }, () => alphabet[Math.floor(rnd() * alphabet.length)]).join('');
}

/** A word and a copy with `edits` random edits applied, so the distance is small but not obvious. */
function nearPair(seed, n, edits) {
  const rnd = mulberry32(seed);
  const a = randomWord(rnd, n, 'abcdefghijklmnopqrstuvwxyz').split('');
  const b = [...a];
  for (let e = 0; e < edits; e++) {
    const p = Math.floor(rnd() * b.length);
    const kind = rnd();
    const ch = String.fromCharCode(97 + Math.floor(rnd() * 26));
    if (kind < 0.33 && b.length < MAX_LEN) b.splice(p, 0, ch);
    else if (kind < 0.66 && b.length > 1) b.splice(p, 1);
    else b[p] = ch;
  }
  return [a.join(''), b.join('')];
}

const visible = [
  { args: ['horse', 'ros'], expected: 3, note: 'horse -> rorse (replace h) -> rose (delete r) -> ros (delete e).' },
  { args: ['intention', 'execution'], expected: 5, note: 'Delete t, replace i with e, replace n with x, replace n with c, insert u.' },
  { args: ['', 'abc'], expected: 3, note: 'Turning an empty word into "abc" takes three insertions.' },
  { args: ['same', 'same'], expected: 0, note: 'Equal words need no edits.' },
  { args: ['abcdef', 'bcdefa'], expected: 2, note: 'Delete the first a and insert one at the end. Comparing position by position says 6.' },
];

// Hidden tests: both words empty, one letter against nothing, a shift that defeats position-wise
// comparison, length 500 against length 1, disjoint alphabets at full length, then 500 x 500
// random words and near-identical words, where plain recursion is exponential.
const rndA = mulberry32(163);
const rndB = mulberry32(167);
const hiddenArgs = [
  ['', ''],
  ['z', ''],
  ['kitten', 'sitting'],
  ['x' + 'pqrstuvw'.repeat(10), 'pqrstuvw'.repeat(10) + 'x'],
  ['m'.repeat(MAX_LEN), 'q'],
  ['a'.repeat(MAX_LEN), 'b'.repeat(MAX_LEN)],
  [randomWord(rndA, 120, 'ab'), randomWord(rndA, 90, 'ab')],
  [randomWord(rndB, MAX_LEN, 'abcdefghijklmnopqrstuvwxyz'), randomWord(rndB, MAX_LEN, 'abcdefghijklmnopqrstuvwxyz')],
  [randomWord(rndB, MAX_LEN, 'abc'), randomWord(rndB, MAX_LEN - 7, 'abc')],
  nearPair(173, MAX_LEN, 40),
];

const isWord = (s) => typeof s === 'string' && s.length <= MAX_LEN && /^[a-z]*$/.test(s);

export const problem = {
  id: 'edit-steps',
  title: 'Edit Steps',
  difficulty: 'Medium',
  topics: ['dp', 'arrays-strings'],
  patterns: ['Dynamic Programming', '2D DP', 'Strings'],
  timeLimitMs: 2000,
  argNames: ['word1', 'word2'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given two words <code>word1</code> and <code>word2</code>, return the fewest operations
    that turn <code>word1</code> into <code>word2</code>. Each operation is one of:</p>
    <ul>
      <li>insert one character anywhere,</li>
      <li>delete one character,</li>
      <li>replace one character with another.</li>
    </ul>
  `,
  constraints: [
    '0 <= word1.length, word2.length <= 500',
    'Both words contain only lowercase English letters',
    'Target complexity: O(m * n) time, O(min(m, n)) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `word1 = ${JSON.stringify(t.args[0])}, word2 = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Does comparing the words position by position work? Try "abcdef" and "bcdefa".',
    'Look only at the last character of each word. If they match, what is left to solve? If not, what are your three choices?',
    'Each choice leaves a pair of prefixes. How many different prefix pairs are there?',
    'What does turning a prefix into the empty word cost, and the empty word into a prefix?',
    'To fill one row of the table, which rows do you actually need to keep?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Let <code>dp[i][j]</code> be the fewest edits that turn the first <code>i</code> letters of
    <code>word1</code> into the first <code>j</code> letters of <code>word2</code>. Look at the last
    letter of each prefix: if they match it costs nothing, otherwise pick the cheapest of replace,
    delete or insert.</p>
    <h4>Why it works</h4>
    <p>Some optimal edit sequence handles the two last letters in one of four ways: keep them (they
    match), replace one with the other, delete the last letter of <code>word1</code>, or insert the last
    letter of <code>word2</code>. Each leaves a smaller prefix pair, read from <code>dp[i-1][j-1]</code>,
    <code>dp[i-1][j]</code> or <code>dp[i][j-1]</code>. The base cases are <code>dp[i][0] = i</code>
    and <code>dp[0][j] = j</code>.</p>
    <h4>Complexity</h4>
    <p>O(m * n) time, one cell per prefix pair. The table only reads the previous row, so the solution
    keeps one row: O(n) space. Plain recursion over the three choices is exponential.</p>
    <h4>Pitfall</h4>
    <p>Counting mismatched positions ignores shifts: <code>"abc"</code> to <code>"bc"</code> is one
    deletion, not three changes. Also remember the empty-prefix row and column, and that either word
    may be empty.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'minDistance',
    params: [
      { name: 'word1', type: 'string' },
      { name: 'word2', type: 'string' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, each word as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines, each word as a JSON string, for example "horse" and "ros".' };
    let word1;
    let word2;
    try {
      word1 = JSON.parse(lines[0]);
      word2 = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be JSON strings in double quotes.' };
    }
    if (!isWord(word1) || !isWord(word2)) return { ok: false, error: 'Each word must have at most 500 lowercase English letters.' };
    return { ok: true, args: [word1, word2] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
