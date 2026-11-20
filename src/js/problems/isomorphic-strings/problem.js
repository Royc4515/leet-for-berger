/**
 * Problem: Isomorphic Strings
 *
 * Decide whether one string can be turned into another by consistently replacing characters.
 * The canonical two-way mapping problem: a single map catches "one source, two targets", but
 * only a second map (or a seen-targets set) catches "two sources, one target".
 */

import { mulberry32 } from '../../engine/rng.js';
import { charString, shuffle } from '../../engine/growth-inputs.js';

/**
 * Reference: forward and backward character maps.
 * @param {string} s
 * @param {string} t
 * @returns {boolean}
 */
export function reference(s, t) {
  if (s.length !== t.length) return false;
  const fwd = new Map();
  const back = new Map();
  for (let i = 0; i < s.length; i++) {
    const a = s[i];
    const b = t[i];
    if ((fwd.has(a) && fwd.get(a) !== b) || (back.has(b) && back.get(b) !== a)) return false;
    fwd.set(a, b);
    back.set(b, a);
  }
  return true;
}

const MAX_LEN = 50000;
const PRINTABLE = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');

/** s over `alphabet`, t its image under a random bijection; optionally break it at position `breakAt`. */
function mappedPair(seed, len, alphabet, breakAt = -1) {
  const rnd = mulberry32(seed);
  const s = Array.from({ length: len }, () => alphabet[Math.floor(rnd() * alphabet.length)]);
  const targets = [...PRINTABLE];
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }
  const map = new Map([...alphabet].map((c, i) => [c, targets[i]]));
  const t = s.map((c) => map.get(c));
  if (breakAt >= 0) {
    // Point this position at the image of a different source character: a many-to-one collision.
    const other = [...alphabet].find((c) => c !== s[breakAt]);
    t[breakAt] = map.get(other);
  }
  return [s.join(''), t.join('')];
}

const visible = [
  { args: ['egg', 'add'], expected: true, note: 'e -> a and g -> d, applied everywhere.' },
  { args: ['foo', 'bar'], expected: false, note: 'o would need to become both a and r.' },
  { args: ['paper', 'title'], expected: true, note: 'p -> t, a -> i, e -> l, r -> e.' },
  { args: ['ab', 'aa'], expected: false, note: 'a and b cannot both become a.' },
  { args: ['a b!', 'x y?'], expected: true, note: 'Spaces and punctuation are characters too.' },
];

// Hidden tests: both directions of collision, a mapping broken only at the last position, every
// character mapping to itself, and 5 * 10^4-character strings.
const hiddenArgs = [
  ['aa', 'ab'],
  ['badc', 'baba'],
  ['abcdefghijklmnopqrstuvwxyz', 'zyxwvutsrqponmlkjihgfedcba'],
  ['13', '42'],
  ['abba', 'abab'],
  mappedPair(7, 1000, 'abcdefghij'),
  mappedPair(11, MAX_LEN, PRINTABLE.slice(0, 60)),
  mappedPair(13, MAX_LEN, PRINTABLE.slice(0, 60), MAX_LEN - 1),
  mappedPair(17, MAX_LEN, 'ab', 25000),
  mappedPair(19, MAX_LEN, PRINTABLE),
];

export const problem = {
  id: 'isomorphic-strings',
  title: 'Isomorphic Strings',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Hash Map', 'Bijection'],
  timeLimitMs: 2000,
  argNames: ['s', 't'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Two strings <code>s</code> and <code>t</code> of the same length are <strong>isomorphic</strong>
    if you can replace characters in <code>s</code> to get <code>t</code>, where every occurrence of
    a character is replaced by the same character, and no two different characters are replaced by
    the same one. A character may stay as it is.</p>
    <p>Return whether <code>s</code> and <code>t</code> are isomorphic.</p>
  `,
  constraints: [
    '1 <= s.length <= 5 * 10^4',
    't.length == s.length',
    's and t consist of printable ASCII characters (space through ~)',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}, t = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'What should you remember the first time you see a character of s?',
    'A single map from s to t catches "o becomes both a and r". Does it catch "a and b both become a"?',
    'What would a second map, from t back to s, add?',
    'Is there a way to compare the positions where each character first appears instead?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Walk both strings in step and keep two maps: <code>fwd</code> from each character of <code>s</code>
    to the character it became in <code>t</code>, and <code>back</code> from each character of
    <code>t</code> to its source. Any position that disagrees with an earlier pairing ends the check.</p>
    <h4>Why it works</h4>
    <p>Isomorphism needs a bijection. <code>fwd</code> enforces "one source, one target": the same
    <code>s</code> character can never map to two different <code>t</code> characters.
    <code>back</code> enforces the other direction: two different source characters can never share a
    target. If every position passes both checks, the pairs seen so far form a one-to-one mapping
    that turns <code>s</code> into <code>t</code>.</p>
    <h4>Complexity</h4>
    <p>O(n) time, one pass with constant-time map operations. O(k) space for k distinct characters,
    at most 95 here since the strings are printable ASCII.</p>
    <h4>Pitfall</h4>
    <p>Using only the forward map. It accepts <code>s = "ab"</code>, <code>t = "aa"</code>, because
    <code>a</code> and <code>b</code> each get one target, yet both land on <code>a</code>.</p>
  `,

  signature: {
    name: 'isIsomorphic',
    params: [
      { name: 's', type: 'string' },
      { name: 't', type: 'string' },
    ],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, each a JSON string.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines, each a JSON string, for example "egg" then "add".' };
    let s;
    let t;
    try {
      s = JSON.parse(lines[0]);
      t = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be JSON strings in double quotes.' };
    }
    if (typeof s !== 'string' || typeof t !== 'string') return { ok: false, error: 'Both lines must be strings.' };
    if (!s.length || s.length > MAX_LEN || s.length !== t.length) return { ok: false, error: 'Strings must have the same length, 1 to 5 * 10^4.' };
    if (!/^[\x20-\x7e]*$/.test(s + t)) return { ok: false, error: 'Only printable ASCII characters are allowed.' };
    return { ok: true, args: [s, t] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). t is s with every
  // character renamed through one seeded permutation of the 95 printable characters: the strings
  // are isomorphic, so both maps are filled and checked for the whole length (no early false).
  growth: {
    target: 'n',
    n: 's.length',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000],
    input: (n, seed) => {
      const rng = mulberry32(seed);
      const alphabet = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));
      const s = charString(n, rng, { alphabet: alphabet.join('') });
      const perm = shuffle([...alphabet], rng);
      const rename = new Map(alphabet.map((c, i) => [c, perm[i]]));
      const parts = new Array(n);
      for (let i = 0; i < n; i++) parts[i] = rename.get(s[i]);
      const t = parts.join('');
      return [s, t];
    },
  },
};

export default problem;
