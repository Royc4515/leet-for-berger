/**
 * Problem: First Lone Character
 *
 * Equivalent to LeetCode 387 (First Unique Character in a String); statement and tests are written
 * for this project. Find the index of the first character in a lowercase string that appears
 * exactly once, or -1 if every character repeats. Counting all 26 letters in one pass and then
 * scanning left to right for the first count of 1 runs in O(n) time and O(1) space.
 *
 * Classic wrong answers: using a boolean "seen once" toggle or XOR (which treats a 3-time letter as
 * unique), returning the alphabetically smallest unique letter instead of the earliest index,
 * checking only the suffix after index i (misses an earlier duplicate), and the O(n^2) nested scan
 * that times out on 10^5-character inputs.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const ALPHA_25 = 'abcdefghijklmnopqrstuvwxy';

/**
 * Reference: count frequencies of the 26 lowercase letters, then return the earliest index with
 * count 1.
 * @param {string} s
 * @returns {number}
 */
export function reference(s) {
  const counts = new Int32Array(26);
  for (let i = 0; i < s.length; i++) counts[s.charCodeAt(i) - 97]++;
  for (let i = 0; i < s.length; i++) {
    if (counts[s.charCodeAt(i) - 97] === 1) return i;
  }
  return -1;
}

/** Seeded string where every prefix letter from 'a'..'y' repeats and an optional final 'z' is unique. */
function repeatingPrefix(seed, n, uniqueAtEnd) {
  const rnd = mulberry32(seed);
  const bodyLen = uniqueAtEnd ? n - 1 : n;
  const chars = new Array(bodyLen);
  // Guarantee every used letter appears at least twice by seeding pairs first.
  const used = Math.min(25, Math.floor(bodyLen / 2));
  let k = 0;
  for (let c = 0; c < used; c++) {
    chars[k++] = ALPHA_25[c];
    chars[k++] = ALPHA_25[c];
  }
  while (k < bodyLen) chars[k++] = ALPHA_25[Math.floor(rnd() * Math.max(1, used))];
  // Fisher-Yates shuffle so matching copies are far apart.
  for (let i = bodyLen - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }
  if (uniqueAtEnd) chars.push('z');
  return chars.join('');
}

const visible = [
  { args: ['river'], expected: 1, note: "'r' appears twice (0 and 4); 'i' at index 1 is the first character that appears once." },
  { args: ['level'], expected: 2, note: "'l' and 'e' both repeat, leaving 'v' at index 2." },
  { args: ['aabb'], expected: -1, note: 'Every character appears at least twice.' },
  { args: ['z'], expected: 0, note: 'A single character is always unique at index 0.' },
  { args: ['zabb'], expected: 0, note: 'Return the earliest index, not the alphabetically smallest letter.' },
];

// Hidden tests: all same letter, three copies of one letter (catches XOR/boolean toggle),
// unique at last index, unique just before end, all 26 letters once then repeated except one,
// plus max-size 10^5 strings (unique at n-1, all repeating, all 'a', seeded pair-heavy strings).
const hiddenArgs = [
  ['aaaaa'],
  ['aaab'],
  ['aabbccddeeffz'],
  ['abccba'],
  ['abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxy'],
  [repeatingPrefix(3871, MAX_N, true)],
  [repeatingPrefix(3872, MAX_N, false)],
  ['a'.repeat(MAX_N)],
  [`${'ab'.repeat(MAX_N / 2 - 1)}cd`],
  [repeatingPrefix(3873, MAX_N, true)],
];

export const problem = {
  id: 'first-lone-char',
  title: 'First Lone Character',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Frequency Count', 'String'],
  timeLimitMs: 2000,
  argNames: ['s'],

  statementHtml: `
    <p>Given a string <code>s</code> of lowercase English letters, find the first character that
    appears <strong>exactly once</strong> in the entire string and return its 0-based index.</p>
    <p>If every character appears more than once, return <code>-1</code>.</p>
  `,
  constraints: [
    '1 <= s.length <= 10^5',
    's consists only of lowercase English letters (a to z)',
    'Target complexity: O(n) time, O(1) space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `s = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  hints: [
    'Why is checking whether a character appears later in the string not enough by itself?',
    'How many distinct characters can appear in s, and how can you store their counts without a hash map?',
    'Once you know the exact count of every letter, how do you find the earliest one with count 1?',
    'Could a character appear three times? Make sure your tracking distinguishes 1 from 3.',
  ],

  explanationHtml: `
    <h4>Idea</h4>
    <p>Make two passes over <code>s</code>. The first pass tallies how many times each of the 26
    lowercase letters appears in a fixed array of length 26. The second pass walks <code>s</code>
    from index <code>0</code> and returns the first index whose letter has count <code>1</code>.</p>
    <h4>Why it works</h4>
    <p>You cannot know whether a character is unique until you have seen the end of the string. By
    finishing all counts first, the second pass tests each position in O(1) and preserves original
    string order.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(1) extra space (26 integer counters). Scanning the rest of the string for each
    position takes O(n^2) time on long repeating strings.</p>
    <h4>Pitfall</h4>
    <p>Using a boolean "seen once" flag or XOR breaks when a letter appears three times (an odd
    count looks like 1). Also be sure to scan the string in the second pass rather than iterating
    <code>'a'</code> to <code>'z'</code> without comparing positions.</p>
  `,

  signature: {
    name: 'firstLoneChar',
    params: [{ name: 's', type: 'string' }],
    returns: 'int',
  },

  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  growth: {
    target: 'n',
    n: 's.length',
    sizes: [512000, 1024000, 2048000, 4096000, 8192000],
    // Every character in the first n - 1 positions repeats, with the sole unique character 'z'
    // placed at index n - 1 so pass 2 cannot exit early and naive O(n^2) scans do full work.
    // Joining medium chunks builds a flat string before timing so V8 never flattens a rope inside
    // the measured call.
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const offset = Math.floor(rnd() * 25);
      const block = ALPHA_25.slice(offset) + ALPHA_25.slice(0, offset);
      const chunk = block.repeat(100); // 2500 chars
      const bodyLen = n - 1;
      const fullChunks = Math.floor(bodyLen / chunk.length);
      const parts = [];
      for (let i = 0; i < fullChunks; i++) parts.push(chunk);
      const rem = bodyLen - fullChunks * chunk.length;
      if (rem > 0) parts.push(chunk.slice(0, rem));
      parts.push('z');
      const s = parts.join('');
      s.indexOf('!'); // Force flat representation before timing begins.
      return [s];
    },
  },

  /**
   * Custom input: a JSON string or bare lowercase word.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const trimmed = raw.trim();
    let s;
    if (trimmed.startsWith('"')) {
      try {
        s = JSON.parse(trimmed);
      } catch {
        return { ok: false, error: 'Enter a lowercase string, for example "river".' };
      }
    } else {
      s = trimmed;
    }
    if (typeof s !== 'string' || s.length < 1 || s.length > MAX_N) {
      return { ok: false, error: 's must be a string of 1 to 10^5 lowercase letters.' };
    }
    if (!/^[a-z]+$/.test(s)) {
      return { ok: false, error: 's must contain only lowercase English letters (a to z).' };
    }
    return { ok: true, args: [s] };
  },

  solveReference: (args) => reference(args[0]),
};

export default problem;
