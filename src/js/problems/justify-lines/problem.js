/**
 * Problem: Justify Lines
 *
 * Full text justification. The packing is greedy (as many words per line as fit with single
 * spaces); the difficulty is entirely in the rules for distributing leftover spaces: evenly,
 * with the leftmost gaps taking the remainder, except on the last line and on one-word lines,
 * which are left-aligned and padded on the right. Each rule is a classic off-by-one.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: greedy packing, then per-line spacing rules.
 * @param {string[]} words
 * @param {number} maxWidth
 * @returns {string[]}
 */
export function reference(words, maxWidth) {
  const lines = [];
  let i = 0;
  while (i < words.length) {
    // Take words while the line with single gaps still fits.
    let j = i + 1;
    let width = words[i].length;
    while (j < words.length && width + 1 + words[j].length <= maxWidth) {
      width += 1 + words[j].length;
      j++;
    }
    const line = words.slice(i, j);
    const gaps = line.length - 1;
    if (j === words.length || gaps === 0) {
      const text = line.join(' ');
      lines.push(text + ' '.repeat(maxWidth - text.length));
    } else {
      const spaces = maxWidth - (width - gaps);
      const base = Math.floor(spaces / gaps);
      const extra = spaces % gaps;
      let text = line[0];
      for (let g = 0; g < gaps; g++) text += ' '.repeat(base + (g < extra ? 1 : 0)) + line[g + 1];
      lines.push(text);
    }
    i = j;
  }
  return lines;
}

const MAX_WORDS = 1000;
const MAX_WORD_LEN = 20;
const MAX_WIDTH = 100;
// Printable ASCII without the space.
const isWordChar = (c) => c > 32 && c < 127;

/** count seeded words of length 1..maxLen over a mix of letters and punctuation. */
function randomWords(seed, count, maxLen) {
  const rnd = mulberry32(seed);
  const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?-()';
  return Array.from({ length: count }, () => {
    const len = 1 + Math.floor(rnd() * maxLen);
    let w = '';
    for (let k = 0; k < len; k++) w += pool[Math.floor(rnd() * pool.length)];
    return w;
  });
}

const visible = [
  {
    args: [['This', 'is', 'an', 'example', 'of', 'text', 'justification.'], 16],
    expected: ['This    is    an', 'example  of text', 'justification.  '],
    note: 'Line 2 has 3 spare spaces for 2 gaps: the left gap takes 2, the right gap 1. The last line is left-aligned.',
  },
  {
    args: [['What', 'must', 'be', 'acknowledgment', 'shall', 'be'], 16],
    expected: ['What   must   be', 'acknowledgment  ', 'shall be        '],
    note: 'A line with a single word is left-aligned and padded on the right, like the last line.',
  },
  {
    args: [['Science', 'is', 'what', 'we', 'understand', 'well', 'enough', 'to', 'explain', 'to', 'a', 'computer.', 'Art', 'is', 'everything', 'else', 'we', 'do'], 20],
    expected: ['Science  is  what we', 'understand      well', 'enough to explain to', 'a  computer.  Art is', 'everything  else  we', 'do                  '],
    note: 'Every line is exactly maxWidth characters long.',
  },
  { args: [['hello'], 5], expected: ['hello'], note: 'A word can fill a whole line.' },
  { args: [['a', 'b', 'c', 'd', 'e'], 3], expected: ['a b', 'c d', 'e  '], note: 'Two one-letter words with one gap fill a width of 3 exactly.' },
];

// Hidden tests: one word per line, a single line that is also the last, a last line that is
// exactly full, a remainder that must go to the leftmost gaps (not the rightmost or spread
// evenly), punctuation as word characters, and many random words at the largest sizes.
const hiddenArgs = [
  [['ab', 'cd', 'ef'], 2],
  [['the', 'quick', 'fox'], 30],
  [['to', 'be', 'or', 'not', 'to', 'be'], 5],
  [['a', 'b', 'c', 'd', 'e', 'fghijklmn'], 10],
  [['x', 'y', 'z', 'w', 'longerword', 'v'], 11],
  [['Hi!', '(ok)', '3.14', '--', 'end.'], 9],
  [randomWords(97, 60, 8), 17],
  [randomWords(101, MAX_WORDS, MAX_WORD_LEN), MAX_WIDTH],
  [randomWords(103, MAX_WORDS, 5), MAX_WIDTH],
  [randomWords(107, MAX_WORDS, MAX_WORD_LEN), MAX_WORD_LEN],
];

export const problem = {
  id: 'justify-lines',
  title: 'Justify Lines',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Simulation', 'Greedy', 'String Building'],
  milestone: 2,
  timeLimitMs: 2000,
  argNames: ['words', 'maxWidth'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a list of <code>words</code> and a width <code>maxWidth</code>, lay the words out
    as fully justified lines of exactly <code>maxWidth</code> characters each.</p>
    <ul>
      <li>Pack greedily: put as many words on a line as fit when separated by single spaces,
      then start the next line.</li>
      <li>On a normal line, add spaces between the words so the line is exactly
      <code>maxWidth</code> long. Spread them as evenly as possible; when they do not divide
      evenly, the gaps on the left get one more space than the gaps on the right.</li>
      <li>A line with a single word, and the last line, are left-aligned: words separated by
      single spaces, then spaces on the right up to <code>maxWidth</code>.</li>
    </ul>
    <p>Return the lines in order.</p>
  `,
  constraints: [
    '1 <= words.length <= 1000',
    '1 <= words[i].length <= 20, and words[i].length <= maxWidth',
    'words[i] consists of printable non-space characters (letters, digits, punctuation)',
    '1 <= maxWidth <= 100',
    'Target complexity: O(total characters of the output)',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `words = ${JSON.stringify(t.args[0])}, maxWidth = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Before worrying about spaces, how do you decide which words go on the current line?',
    'Once a line\'s words are fixed, how many spaces are left to place, and how many gaps are there?',
    'If the spaces do not divide evenly between the gaps, which gaps get the extra ones?',
    'Which lines do not follow the even-spreading rule, and what is special about them?',
    'What goes wrong in your gap arithmetic when a line has only one word?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'justifyText',
    params: [
      { name: 'words', type: 'string[]' },
      { name: 'maxWidth', type: 'int' },
    ],
    returns: 'string[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, words as a JSON array of strings, then maxWidth.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: words as a JSON array, then maxWidth.' };
    let words;
    try {
      words = JSON.parse(lines[0]);
    } catch {
      return { ok: false, error: 'words must be a JSON array of strings, for example ["This","is","an"].' };
    }
    if (!Array.isArray(words) || words.length < 1 || words.length > MAX_WORDS) return { ok: false, error: 'words must have 1 to 1000 entries.' };
    if (!/^\d+$/.test(lines[1])) return { ok: false, error: 'maxWidth must be a positive integer.' };
    const maxWidth = Number(lines[1]);
    if (maxWidth < 1 || maxWidth > MAX_WIDTH) return { ok: false, error: 'maxWidth must be between 1 and 100.' };
    for (const w of words) {
      if (typeof w !== 'string' || w.length < 1 || w.length > MAX_WORD_LEN) return { ok: false, error: 'Each word must be a string of 1 to 20 characters.' };
      if (![...w].every((ch) => isWordChar(ch.charCodeAt(0)))) return { ok: false, error: 'Words use printable characters other than the space.' };
      if (w.length > maxWidth) return { ok: false, error: 'No word can be longer than maxWidth.' };
    }
    return { ok: true, args: [words, maxWidth] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
