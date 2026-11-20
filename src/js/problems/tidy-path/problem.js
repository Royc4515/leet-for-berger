/**
 * Problem: Tidy Path
 *
 * Equivalent to LeetCode 71; statement and tests are written for this project. Turn an absolute
 * Unix-style path into its canonical form: "." stays in place, ".." steps up one directory (and
 * does nothing at the root), repeated slashes collapse, and there is no trailing slash. A stack of
 * directory names does it in one pass.
 *
 * Classic wrong answers: treating "..." (or any name that starts with a dot) as "." or "..",
 * popping from an empty stack at the root, keeping empty names from "//", returning an empty
 * string for the root, and leaving a trailing slash.
 *
 * The limit is raised from 3000 to 10^5 characters so repeated string replacement (collapse
 * "//", then "/./", then "/name/../", until nothing changes) is clearly too slow.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;

/**
 * Reference: split on "/" and keep a stack of names.
 * @param {string} path absolute path starting with "/"
 * @returns {string} canonical path
 */
export function reference(path) {
  const stack = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return '/' + stack.join('/');
}

const NAME_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789_';

/** A seeded name of 1 to `maxLen` characters. */
function randomName(rnd, maxLen) {
  const len = 1 + Math.floor(rnd() * maxLen);
  let s = '';
  for (let i = 0; i < len; i++) s += NAME_CHARS[Math.floor(rnd() * NAME_CHARS.length)];
  return s;
}

/**
 * Seeded path of at most `limit` characters made of names, ".", "..", "...", hidden names and
 * extra slashes, so every rule shows up many times. Names are up to `maxName` characters.
 */
function randomPath(seed, limit, maxName = 4) {
  const rnd = mulberry32(seed);
  const parts = [];
  let len = 1;
  for (;;) {
    const r = rnd();
    let part;
    if (r < 0.45) part = randomName(rnd, maxName);
    else if (r < 0.65) part = '..';
    else if (r < 0.77) part = '.';
    else if (r < 0.83) part = '...';
    else if (r < 0.89) part = '.' + randomName(rnd, maxName);
    else if (r < 0.95) part = '';
    else part = randomName(rnd, maxName) + '.' + randomName(rnd, maxName);
    if (len + part.length + 1 > limit) break;
    parts.push(part);
    len += part.length + 1;
  }
  return '/' + parts.join('/');
}

/** `count` copies of `unit` after a leading slash, cut to the length limit. */
const repeated = (unit, count) => ('/' + unit.repeat(count)).slice(0, MAX_LEN);

const visible = [
  { args: ['/home/'], expected: '/home', note: 'A trailing slash is dropped.' },
  { args: ['/home//foo/'], expected: '/home/foo', note: 'Repeated slashes count as one.' },
  { args: ['/a/./b/../../c/'], expected: '/c', note: '"." stays, then ".." removes b, and the next ".." removes a.' },
  { args: ['/../'], expected: '/', note: 'There is nothing above the root, so ".." changes nothing.' },
  { args: ['/.../a/../b/c/../d/./'], expected: '/.../b/d', note: '"..." is an ordinary directory name.' },
];

// Hidden tests: the root and one name, a lone "/" run, climbing past the root, names that start
// with dots, a random 1000-character path, a long climb of ".." at the root, a deep descent then a
// full retreat, and three 10^5-character paths (random, dense "/./" noise, descent then retreat).
const hiddenInputs = [
  '/',
  '/a',
  '////',
  '/a/b/c/../../../../..',
  '/.hidden/..hid/.../x.y/../...a/',
  randomPath(7, 1000),
  repeated('../', 33333),
  '/' + 'ab/'.repeat(16666) + '../'.repeat(16666) + 'z',
  randomPath(11, MAX_LEN),
  repeated('./', 50000),
];

export const problem = {
  id: 'tidy-path',
  title: 'Tidy Path',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Stack', 'String Parsing', 'Simulation'],
  timeLimitMs: 2000,
  argNames: ['path'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an absolute path for a Unix-style file system, always starting with a slash
    <code>/</code>. Return its canonical form.</p>
    <p>In a path, a single dot <code>.</code> means the current directory, two dots <code>..</code>
    mean the directory one level up (at the root they change nothing), and several slashes in a row
    count as one. Any other run of characters between slashes, including <code>...</code>, is an
    ordinary directory or file name.</p>
    <p>The canonical path must start with one slash, separate directory names with exactly one
    slash, not end with a slash (unless it is the root <code>/</code>), and contain no
    <code>.</code> or <code>..</code> parts.</p>
  `,
  constraints: [
    '1 <= path.length <= 10^5',
    'path consists of English letters, digits, ".", "/" and "_"',
    'path starts with "/"',
    'Target complexity: O(n) time, O(n) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `path = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you cut the path at every slash, what kinds of pieces can you get?',
    'Which pieces change nothing, and which one undoes the previous directory? What data structure forgets the most recent thing first?',
    'What should happen to a ".." when you are already at the root and have nothing to undo?',
    'Is "..." the same as ".."? What about a name like ".hidden"?',
    'When the stack is empty at the end, what should you return, and how do you join the names otherwise?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Split the path on slashes and keep a stack of directory names. Skip empty pieces and
    <code>.</code>. On <code>..</code>, pop the stack if it has anything. Anything else is a name:
    push it. At the end, join the stack with slashes behind a leading slash.</p>
    <h4>Why it works</h4>
    <p>The stack always holds the canonical path of everything read so far, from the root down. A
    name goes one level deeper, <code>..</code> goes one level up, and the rest changes nothing, which
    is exactly what the path means. Popping an empty stack stays at the root.</p>
    <h4>Complexity</h4>
    <p>O(n) time, each character is read once. O(n) extra space for the stack and the result.
    Repeatedly replacing <code>//</code>, <code>/./</code> and <code>/name/../</code> until nothing
    changes rescans and copies the string each time, which is quadratic.</p>
    <h4>Pitfall</h4>
    <p>Only the exact pieces <code>.</code> and <code>..</code> are special: <code>...</code> and
    <code>.hidden</code> are real names. An empty stack must give back <code>/</code>, not an empty
    string, and <code>..</code> at the root must not fail.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'tidyPath',
    params: [{ name: 'path', type: 'string' }],
    returns: 'string',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((path) => ({ args: [path], expected: reference(path) })),

  /**
   * Custom input: the path as a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let path;
    try {
      path = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the path as a JSON string, for example "/a/./b/../c/".' };
    }
    if (typeof path !== 'string' || path.length < 1 || path.length > MAX_LEN) return { ok: false, error: 'The path must have 1 to 10^5 characters.' };
    if (!/^[A-Za-z0-9._/]+$/.test(path)) return { ok: false, error: 'Use only letters, digits, ".", "/" and "_".' };
    if (path[0] !== '/') return { ok: false, error: 'The path must start with "/".' };
    return { ok: true, args: [path] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Mostly names, so the
  // stack grows; the
  // replace-until-stable approach rescans the whole string per rewrite. One-letter names: V8 shares
  // single-character strings, so the split does not allocate a string per piece and the curve is not
  // bent by the garbage collector (names of 16 letters bent it past 1.6 * 10^6 characters).
  growth: {
    target: 'n',
    n: 'path.length',
    sizes: [100000, 200000, 400000, 800000, 1600000, 3200000],
    input: (n, seed) => [randomPath(seed, n, 1)],
  },
};

export default problem;
