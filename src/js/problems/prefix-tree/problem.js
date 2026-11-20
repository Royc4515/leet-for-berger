/**
 * Problem: Prefix Tree (design)
 *
 * Implement a trie: a tree whose edges are letters, so every node stands for the prefix spelled
 * on the way down to it, and a flag marks nodes where an inserted word ends. Insert, search and
 * prefix checks all cost O(length of the argument), independent of how many words are stored.
 * The classic bugs are search returning true for a prefix that was never inserted as a word
 * ("app" after inserting only "apple"), startsWith failing on a whole stored word, and keeping
 * a plain list of words: 5 * 10^4 words times 5 * 10^4 prefix checks is billions of comparisons.
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor and void calls).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt } from '../../engine/growth-inputs.js';

const MAX_CALLS = 100000;
const MAX_LEN = 2000;
const MAX_TOTAL = 500000;

/**
 * Reference simulation: a trie of Map nodes; `end` marks nodes where an inserted word stops.
 * @param {string[]} ops operation names, ops[0] === 'Trie'
 * @param {string[][]} args argument list per operation
 * @returns {(boolean|null)[]}
 */
export function reference(ops, args) {
  const root = { next: new Map(), end: false };
  const walk = (s) => {
    let node = root;
    for (const c of s) {
      node = node.next.get(c);
      if (!node) return null;
    }
    return node;
  };
  return ops.map((op, i) => {
    const s = args[i][0];
    if (op === 'insert') {
      let node = root;
      for (const c of s) {
        if (!node.next.has(c)) node.next.set(c, { next: new Map(), end: false });
        node = node.next.get(c);
      }
      node.end = true;
      return null;
    }
    if (op === 'search') return walk(s)?.end === true;
    if (op === 'startsWith') return walk(s) !== null;
    return null; // constructor
  });
}

function randomWord(rnd, len, letters) {
  let s = '';
  for (let i = 0; i < len; i++) s += letters[Math.floor(rnd() * letters.length)];
  return s;
}

/**
 * Seeded session: `inserts` words from wordOf(rnd), then `queries` search / startsWith calls
 * (half each) on strings from queryOf(rnd, inserted).
 */
function session(seed, inserts, queries, wordOf, queryOf) {
  const rnd = mulberry32(seed);
  const ops = ['Trie'];
  const args = [[]];
  const inserted = [];
  for (let k = 0; k < inserts; k++) {
    const w = wordOf(rnd);
    inserted.push(w);
    ops.push('insert');
    args.push([w]);
  }
  for (let k = 0; k < queries; k++) {
    ops.push(rnd() < 0.5 ? 'search' : 'startsWith');
    args.push([queryOf(rnd, inserted)]);
  }
  return [ops, args];
}

/** A stored word, a prefix of one, or a stored word with a letter changed or appended. */
function nearMiss(rnd, inserted, letters) {
  const w = inserted[Math.floor(rnd() * inserted.length)];
  const r = rnd();
  if (r < 0.3) return w;
  if (r < 0.6) return w.slice(0, 1 + Math.floor(rnd() * w.length));
  if (r < 0.8) return w + letters[Math.floor(rnd() * letters.length)];
  const at = Math.floor(rnd() * w.length);
  return w.slice(0, at) + letters[Math.floor(rnd() * letters.length)] + w.slice(at + 1);
}

const visible = [
  {
    args: [
      ['Trie', 'insert', 'search', 'search', 'startsWith', 'insert', 'search'],
      [[], ['apple'], ['apple'], ['app'], ['app'], ['app'], ['app']],
    ],
    expected: [null, null, true, false, true, null, true],
    note: '"app" is only a prefix until it is inserted as a word itself.',
  },
  {
    args: [['Trie', 'search', 'startsWith'], [[], ['a'], ['a']]],
    expected: [null, false, false],
    note: 'An empty trie holds no words and no prefixes.',
  },
  {
    args: [['Trie', 'insert', 'startsWith'], [[], ['code'], ['code']]],
    expected: [null, null, true],
    note: 'A whole word is also a prefix of itself.',
  },
  {
    args: [['Trie', 'insert', 'search', 'startsWith'], [[], ['tree'], ['trees'], ['trees']]],
    expected: [null, null, false, false],
    note: 'A longer string than anything stored is neither a word nor a prefix.',
  },
  {
    args: [['Trie', 'insert', 'insert', 'search', 'search'], [[], ['ab'], ['ab'], ['ab'], ['a']]],
    expected: [null, null, null, true, false],
    note: 'Inserting the same word twice changes nothing.',
  },
];

// Hidden tests: sibling branches, a one-letter word that is not a prefix of a longer query, a
// word inserted after a longer word that contains it, random sessions with near-miss queries,
// and at max size 5 * 10^4 short words with 5 * 10^4 queries (a list of words is billions of
// comparisons), words of 1999 letters sharing 1998 of them, and 10^5 calls of queries that miss
// on their first letter.
const ABCD = 'abcd';
const hiddenArgs = [
  [
    ['Trie', 'insert', 'insert', 'search', 'startsWith', 'search', 'search'],
    [[], ['abc'], ['abd'], ['ab'], ['ab'], ['abd'], ['abe']],
  ],
  [['Trie', 'insert', 'startsWith', 'search', 'startsWith'], [[], ['a'], ['ab'], ['a'], ['a']]],
  [
    ['Trie', 'insert', 'search', 'insert', 'search', 'search'],
    [[], ['interview'], ['inter'], ['inter'], ['inter'], ['interview']],
  ],
  [['Trie', 'insert', 'insert', 'startsWith', 'startsWith', 'search'], [[], ['z'], ['zz'], ['zzz'], ['zz'], ['z']]],
  session(3, 50, 300, (rnd) => randomWord(rnd, 1 + Math.floor(rnd() * 4), 'ab'), (rnd, ins) => nearMiss(rnd, ins, 'ab')),
  session(5, 3000, 5000, (rnd) => randomWord(rnd, 1 + Math.floor(rnd() * 8), ABCD), (rnd, ins) => nearMiss(rnd, ins, ABCD)),
  session(7, 50000, 50000, (rnd) => randomWord(rnd, 5, ABCD), (rnd, ins) => nearMiss(rnd, ins, ABCD)),
  session(11, 100, 100, (rnd) => 'a'.repeat(MAX_LEN - 2) + randomWord(rnd, 1, 'abc'), (rnd, ins) => nearMiss(rnd, ins, 'abc')),
  session(13, 50000, 50000, (rnd) => randomWord(rnd, 1 + Math.floor(rnd() * 6), 'abcdefghijklm'), (rnd) => randomWord(rnd, 1 + Math.floor(rnd() * 4), 'nopqrstuvwxyz')),
  session(17, 5000, 5000, (rnd) => randomWord(rnd, 1 + Math.floor(rnd() * 30), 'xy'), (rnd, ins) => nearMiss(rnd, ins, 'xy')),
];

const isLowerWord = (s) => typeof s === 'string' && s.length >= 1 && s.length <= MAX_LEN && /^[a-z]+$/.test(s);

export const problem = {
  id: 'prefix-tree',
  title: 'Prefix Tree',
  difficulty: 'Medium',
  topics: ['trees'],
  patterns: ['Design', 'Trie'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A trie (prefix tree) stores strings so that both whole words and prefixes can be looked up
    quickly. Implement <code>Trie</code>:</p>
    <ul>
      <li><code>Trie()</code> creates an empty trie.</li>
      <li><code>insert(word)</code> stores <code>word</code>.</li>
      <li><code>search(word)</code> returns <code>true</code> if <code>word</code> was inserted
      before, and <code>false</code> otherwise.</li>
      <li><code>startsWith(prefix)</code> returns <code>true</code> if some inserted word starts
      with <code>prefix</code> (a word starts with itself), and <code>false</code> otherwise.</li>
    </ul>
    <p>Each call should take time proportional to the length of its argument, however many words
    are stored.</p>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor and for calls that return nothing).</p>
  `,
  constraints: [
    '1 <= word.length, prefix.length <= 2000',
    'word and prefix consist of lowercase English letters',
    'At most 10^5 calls to insert, search and startsWith in total',
    'The total length of all arguments is at most 5 * 10^5',
    'Target complexity: O(length of the argument) per call',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Words that share a beginning could share the storage for it. What would a tree of letters look like?',
    'Each node stands for the prefix spelled on the path from the root. What does each node need to know about its children?',
    'After inserting "apple", the node for "app" exists. How does search tell that "app" itself was never inserted?',
    'What is the only difference between search and startsWith once you have walked down the tree?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Store words as paths in a tree of letters. Each node stands for one prefix and links each
    letter to the node of that prefix plus the letter. A mark on a node says an inserted word ends
    there.</p>
    <h4>Why it works</h4>
    <p><code>insert</code> walks down, creating missing children, and marks the last node. Walking a
    query's letters reaches the node of exactly that prefix if and only if some inserted word starts
    with it. So <code>startsWith</code> needs only the node to exist, and <code>search</code> also
    needs the end mark.</p>
    <h4>Complexity</h4>
    <p>O(length of the argument) per call, however many words are stored; O(total inserted length)
    nodes of space. The JavaScript solution gives each node 26 child slots; the Python one uses a
    dict per node with <code>'$'</code> as the end mark.</p>
    <h4>Pitfall</h4>
    <p>Treating "the path exists" as "the word was inserted". After <code>insert("apple")</code>,
    <code>search("app")</code> is <code>false</code>; only <code>startsWith("app")</code> is
    <code>true</code>.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'Trie',
    constructor: { params: [] },
    methods: [
      { name: 'insert', params: [{ name: 'word', type: 'string' }], returns: 'void' },
      { name: 'search', params: [{ name: 'word', type: 'string' }], returns: 'bool' },
      { name: 'startsWith', params: [{ name: 'prefix', type: 'string' }], returns: 'bool' },
    ],
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two JSON lines, the operations and then the argument lists.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the operations, then the argument lists (both JSON arrays).' };
    let ops;
    let args;
    try {
      ops = JSON.parse(lines[0]);
      args = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    if (!Array.isArray(ops) || !Array.isArray(args) || ops.length !== args.length) return { ok: false, error: 'Operations and arguments must be arrays of the same length.' };
    if (ops[0] !== 'Trie' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "Trie" with no arguments.' };
    if (ops.length - 1 > MAX_CALLS) return { ok: false, error: 'At most 10^5 calls to insert, search and startsWith.' };
    let total = 0;
    for (let i = 1; i < ops.length; i++) {
      if (!['insert', 'search', 'startsWith'].includes(ops[i])) return { ok: false, error: `Unknown operation "${ops[i]}".` };
      const a = args[i];
      if (!Array.isArray(a) || a.length !== 1 || !isLowerWord(a[0])) {
        return { ok: false, error: `${ops[i]} takes one string of 1 to 2000 lowercase letters (call ${i}).` };
      }
      total += a[0].length;
    }
    if (total > MAX_TOTAL) return { ok: false, error: 'The total length of all arguments is at most 5 * 10^5.' };
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
  growth: {
    target: 'n',
    n: 'number of calls (words of 6 letters from a-e, so the trie stops growing and each call costs the same)',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000, 1024000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const word = (len) => Array.from({ length: len }, () => 'abcde'[randInt(rnd, 0, 4)]).join('');
      const ops = ['Trie'];
      const args = [[]];
      while (ops.length < n) {
        const r = rnd();
        if (r < 0.4) {
          ops.push('insert');
          args.push([word(6)]);
        } else if (r < 0.7) {
          ops.push('search');
          args.push([word(6)]);
        } else {
          ops.push('startsWith');
          args.push([word(randInt(rnd, 1, 6))]);
        }
      }
      return [ops, args];
    },
  },
};

export default problem;
