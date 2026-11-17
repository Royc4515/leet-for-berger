/**
 * Problem: String Codec (design)
 *
 * Pack a list of strings into one string and unpack it again. Joining with a separator breaks as
 * soon as a string contains the separator (or is empty); escaping works but is fiddly. Prefixing
 * each string with its length is the robust answer: the decoder reads a number, then copies
 * exactly that many characters, whatever they are.
 *
 * Why the format is fixed: in the original problem any encoding is allowed and only
 * decode(encode(x)) is checked. A judge that compares outputs needs one right answer per call,
 * so the statement prescribes the length-prefix format, "<length>#<string>" for each string.
 * That keeps the lesson (length framing beats delimiters) and makes encode and decode
 * independently testable: decode is also given encodings it did not produce itself.
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor).
 */

import { mulberry32 } from '../../engine/rng.js';

/** Encodes a list in the prescribed format. */
function encode(strs) {
  return strs.map((s) => `${s.length}#${s}`).join('');
}

/** Decodes the prescribed format by reading each length, then that many characters. */
function decode(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const hash = s.indexOf('#', i);
    const len = Number(s.slice(i, hash));
    out.push(s.slice(hash + 1, hash + 1 + len));
    i = hash + 1 + len;
  }
  return out;
}

/**
 * Reference simulation of the Codec class.
 * @param {string[]} ops operation names, ops[0] === 'Codec'
 * @param {unknown[][]} args argument list per operation
 * @returns {(string|string[]|null)[]}
 */
export function reference(ops, args) {
  return ops.map((op, i) => {
    if (op === 'encode') return encode(args[i][0]);
    if (op === 'decode') return decode(args[i][0]);
    return null; // constructor
  });
}

const MAX_CALLS = 20;
const MAX_STRS = 10000;
const MAX_CHARS = 100000;
const MAX_STR_LEN = 1000;
// Printable ASCII (space to '~'): harmless in every language's string type and in JSON.
const PRINTABLE = Array.from({ length: 95 }, (_, k) => String.fromCharCode(32 + k)).join('');
const isPrintable = (s) => [...s].every((ch) => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 126);

/** count seeded strings of length 0..maxLen over `alphabet`. */
function randomStrings(seed, count, maxLen, alphabet = PRINTABLE) {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const len = Math.floor(rnd() * (maxLen + 1));
    let s = '';
    for (let k = 0; k < len; k++) s += alphabet[Math.floor(rnd() * alphabet.length)];
    return s;
  });
}

/** A session that encodes each list and then decodes each encoding (round trips). */
function roundTrips(lists) {
  const ops = ['Codec'];
  const args = [[]];
  for (const list of lists) {
    ops.push('encode', 'decode');
    args.push([list], [encode(list)]);
  }
  return [ops, args];
}

const visible = [
  {
    args: [['Codec', 'encode', 'decode'], [[], [['lint', 'code']], ['4#lint4#code']]],
    expected: [null, '4#lint4#code', ['lint', 'code']],
    note: 'Each string is written as its length, a "#", then the string itself.',
  },
  {
    args: [['Codec', 'encode', 'decode'], [[], [['a#b', '12#', '']], ['3#a#b3#12#0#']]],
    expected: [null, '3#a#b3#12#0#', ['a#b', '12#', '']],
    note: 'Strings may contain "#" and digits, and may be empty. The decoder never searches for "#" inside a string: it copies exactly the stated number of characters.',
  },
  {
    args: [['Codec', 'encode', 'encode'], [[], [[]], [['']]]],
    expected: [null, '', '0#'],
    note: 'An empty list encodes to the empty string; a list holding one empty string does not.',
  },
  {
    args: [['Codec', 'decode', 'decode'], [[], [''], ['11#hello there']]],
    expected: [null, [], ['hello there']],
    note: 'decode receives any valid encoding, not only ones your encode produced. Lengths can have several digits.',
  },
  {
    args: [['Codec', 'encode', 'decode'], [[], [['  ', '9', '#9#']], ['2#  1#93##9#']]],
    expected: [null, '2#  1#93##9#', ['  ', '9', '#9#']],
    note: 'Spaces and strings that look like encodings are ordinary characters.',
  },
];

// Hidden tests: many empty strings, strings that are themselves encodings, a single string of
// 1000 characters (a length with four digits), lengths around 100 (two and three digits next to
// each other), a session that starts with decode, and lists at the size limit: 10^4 strings,
// some made only of '#' and digits, which defeat any separator or escaping shortcut.
const hiddenArgs = [
  roundTrips([['', '', '', ''], ['#'], ['0#']]),
  roundTrips([['3#abc', '1#', '##', '100#']]),
  roundTrips([['x'.repeat(MAX_STR_LEN)], ['a'.repeat(99), 'b'.repeat(100), 'c'.repeat(101)]]),
  roundTrips([randomStrings(127, 50, 30, '#0123456789'), randomStrings(131, 50, 30)]),
  [['Codec', 'decode', 'encode', 'decode'], [[], ['5#a b c0#2#ab'], [['multi word', '', '#']], ['1#x']]],
  roundTrips([randomStrings(137, 300, 40), randomStrings(139, 1, 5)]),
  roundTrips([Array.from({ length: MAX_STRS }, () => '')]),
  roundTrips([randomStrings(149, MAX_STRS, 19)]),
  roundTrips([randomStrings(151, MAX_STRS, 19, '#1')]),
  roundTrips([randomStrings(157, 100, 999), randomStrings(163, 100, 999, '#')]),
];

/** Checks one list argument against the limits. */
function validList(list) {
  if (!Array.isArray(list) || list.length > MAX_STRS) return false;
  let total = 0;
  for (const s of list) {
    if (typeof s !== 'string' || s.length > MAX_STR_LEN || !isPrintable(s)) return false;
    total += s.length;
  }
  return total <= MAX_CHARS;
}

/** True when s is a valid encoding: a well-formed sequence of "<length>#<string>" items. */
function validEncoding(s) {
  if (typeof s !== 'string' || !isPrintable(s)) return false;
  let i = 0;
  while (i < s.length) {
    const m = /^(0|[1-9]\d{0,3})#/.exec(s.slice(i, i + 6));
    if (!m) return false;
    i += m[0].length + Number(m[1]);
    if (i > s.length) return false;
  }
  return validList(decode(s));
}

export const problem = {
  id: 'string-codec',
  title: 'String Codec',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'String Building', 'Length Prefix'],
  milestone: 2,
  timeLimitMs: 2000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a codec that packs a list of strings into a single string and unpacks it again.
    Implement <code>Codec</code>:</p>
    <ul>
      <li><code>Codec()</code> creates the codec.</li>
      <li><code>encode(strs)</code> returns one string that represents the list
      <code>strs</code>.</li>
      <li><code>decode(s)</code> takes such a string and returns the original list.</li>
    </ul>
    <p>Strings can contain any printable character, including <code>#</code>, digits and
    spaces, and can be empty, so no single separator character is safe. To make the answer
    exact, the encoding is prescribed: for each string in order, write its length in decimal
    (no leading zeros), then <code>#</code>, then the string itself. For example
    <code>["lint", "code"]</code> encodes to <code>"4#lint4#code"</code>, and an empty list
    encodes to <code>""</code>.</p>
    <p><code>decode</code> may be called with any valid encoding, not only one your
    <code>encode</code> returned. A test is a sequence of calls: the first list names the
    operations, the second gives each call's arguments, and the output lists each call's result
    (<code>null</code> for the constructor).</p>
  `,
  constraints: [
    'At most 20 calls to encode and decode in total',
    '0 <= strs.length <= 10^4, and the strings of one list hold at most 10^5 characters in total',
    '0 <= strs[i].length <= 1000; characters are printable ASCII (space to "~")',
    'decode is only called with a valid encoding of such a list',
    'Target complexity: O(total length) per call',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you join the strings with a separator, what happens when one of them contains it? And when one is empty?',
    'The decoder needs to know where each string ends without looking inside it. What could you write before each string?',
    'After reading a length, how do you find where the length itself stops?',
    'How do you move through the encoded string without copying the unread rest of it on every step?',
  ],

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'Codec',
    constructor: { params: [] },
    methods: [
      { name: 'encode', params: [{ name: 'strs', type: 'string[]' }], returns: 'string' },
      { name: 'decode', params: [{ name: 's', type: 'string' }], returns: 'string[]' },
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
    if (ops[0] !== 'Codec' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "Codec" with no arguments.' };
    if (ops.length - 1 > MAX_CALLS) return { ok: false, error: 'At most 20 calls after the constructor.' };
    for (let i = 1; i < ops.length; i++) {
      const a = args[i];
      if (!Array.isArray(a) || a.length !== 1) return { ok: false, error: `Call ${i} takes exactly one argument.` };
      if (ops[i] === 'encode') {
        if (!validList(a[0])) return { ok: false, error: `Call ${i}: encode takes a list of at most 10^4 printable strings, each at most 1000 long, 10^5 characters in total.` };
      } else if (ops[i] === 'decode') {
        if (!validEncoding(a[0])) return { ok: false, error: `Call ${i}: decode needs a valid encoding, such as "4#lint4#code".` };
      } else {
        return { ok: false, error: `Unknown operation "${ops[i]}".` };
      }
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
