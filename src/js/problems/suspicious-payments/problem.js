/**
 * Problem: Suspicious Payments
 *
 * A payment log lists "name,minute,amount,city" records. A record is suspicious when its amount is
 * too large, or when the same person paid in a different city within an hour of it. The work is
 * grouping by name and remembering that a conflict flags both records, not just the later one.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_RECORDS = 1000;
const MAX_MINUTE = 1000;
const MAX_AMOUNT = 2000;
const AMOUNT_LIMIT = 1000;
const WINDOW = 60;

/**
 * Reference: group by name, sort each group by minute, and slide a window of +-60 minutes. The
 * record itself is always in its own window, so a different city is present exactly when the
 * window holds at least two distinct cities. O(n log n) time.
 * @param {string[]} payments each "name,minute,amount,city"
 * @returns {string[]} suspicious records, in input order
 */
export function reference(payments) {
  const rows = payments.map((p, i) => {
    const [name, minute, amount, city] = p.split(',');
    return { i, name, minute: Number(minute), amount: Number(amount), city };
  });
  const flagged = rows.map((r) => r.amount > AMOUNT_LIMIT);
  const byName = new Map();
  for (const r of rows) {
    if (!byName.has(r.name)) byName.set(r.name, []);
    byName.get(r.name).push(r);
  }
  for (const group of byName.values()) {
    group.sort((a, b) => a.minute - b.minute);
    const counts = new Map();
    let lo = 0;
    let hi = 0;
    for (const r of group) {
      // Grow the window to every record at most 60 minutes later, shrink it past 60 minutes earlier.
      while (hi < group.length && group[hi].minute <= r.minute + WINDOW) {
        counts.set(group[hi].city, (counts.get(group[hi].city) ?? 0) + 1);
        hi++;
      }
      while (group[lo].minute < r.minute - WINDOW) {
        const c = group[lo].city;
        if (counts.get(c) === 1) counts.delete(c);
        else counts.set(c, counts.get(c) - 1);
        lo++;
      }
      if (counts.size >= 2) flagged[r.i] = true;
    }
  }
  return payments.filter((_, i) => flagged[i]);
}

const NAMES = ['ana', 'ben', 'dana', 'eli', 'gal', 'noa', 'omer', 'roy', 'shir', 'tal', 'yael', 'ziv'];
const CITIES = ['haifa', 'eilat', 'acre', 'yafo', 'rome', 'paris', 'oslo', 'lima', 'tokyo', 'kyoto'];

/** Seeded random log: `nNames` people, `nCities` cities, minutes over the full range. */
function randomLog(seed, n, nNames, nCities, bigShare = 0.05) {
  const rnd = mulberry32(seed);
  const pick = (k) => Math.floor(rnd() * k);
  const names = Array.from({ length: nNames }, (_, i) => (i < NAMES.length ? NAMES[i] : `${NAMES[i % NAMES.length]}${String.fromCharCode(97 + Math.floor(i / NAMES.length) % 26)}`));
  return Array.from({ length: n }, () => {
    const amount = rnd() < bigShare ? AMOUNT_LIMIT + 1 + pick(MAX_AMOUNT - AMOUNT_LIMIT) : pick(AMOUNT_LIMIT + 1);
    return `${names[pick(nNames)]},${pick(MAX_MINUTE + 1)},${amount},${CITIES[pick(nCities)]}`;
  });
}

/** One person, always in Paris except a single Rome payment at minute 500: only its neighbours conflict. */
function oneOddCity(seed) {
  const rnd = mulberry32(seed);
  const pick = (k) => Math.floor(rnd() * k);
  const log = Array.from({ length: MAX_RECORDS - 1 }, () => `roy,${pick(MAX_MINUTE + 1)},${pick(AMOUNT_LIMIT + 1)},paris`);
  log.splice(MAX_RECORDS / 2, 0, 'roy,500,1000,rome');
  return log;
}

/** 999 identical records and one conflicting record last: every copy is flagged, in place. */
function copiesThenConflict() {
  const log = Array.from({ length: MAX_RECORDS - 1 }, () => 'max,100,5,tokyo');
  log.push('max,160,5,kyoto');
  return log;
}

const visible = [
  {
    args: [['ana,20,800,haifa', 'ana,50,100,eilat']],
    expected: ['ana,20,800,haifa', 'ana,50,100,eilat'],
    note: 'Same person, two cities, 30 minutes apart: both records are suspicious.',
  },
  {
    args: [['ana,20,800,haifa', 'ana,50,1200,haifa']],
    expected: ['ana,50,1200,haifa'],
    note: 'Only the second amount is over 1000; the city is the same.',
  },
  {
    args: [['ana,20,800,haifa', 'ben,50,100,eilat']],
    expected: [],
    note: 'Different people never conflict with each other.',
  },
  {
    args: [['dan,0,10,acre', 'dan,60,10,yafo', 'dan,121,10,acre']],
    expected: ['dan,0,10,acre', 'dan,60,10,yafo'],
    note: 'Exactly 60 minutes apart still conflicts; 61 minutes apart does not.',
  },
  {
    args: [['eli,5,1001,rome', 'eli,5,1001,rome', 'eli,5,1000,rome']],
    expected: ['eli,5,1001,rome', 'eli,5,1001,rome'],
    note: 'Identical records are reported once each. An amount of exactly 1000 is fine.',
  },
];

// Hidden tests target the classic wrong answers: flagging only the later record of a conflict,
// "> 60" instead of ">= 60" style boundaries, assuming the log is sorted by minute, grouping by a
// name prefix, dropping duplicates, and returning records in a different order.
const hiddenArgs = [
  [['zoe,0,2000,oslo']],
  [['zoe,1000,1000,oslo', 'zoe,999,0,oslo']],
  [['kai,0,1,lima', 'kai,50,1,oslo', 'kai,100,1,lima']],
  [['kim,500,5,oslo', 'kim,440,5,lima', 'kim,379,5,oslo']],
  [['al,10,5,rome', 'ali,10,5,paris', 'al,10,5,rome', 'rome,10,5,al']],
  [randomLog(7, 200, 10, 4)],
  [randomLog(11, MAX_RECORDS, 1, 3)],
  [oneOddCity(13)],
  [randomLog(17, MAX_RECORDS, 400, 5)],
  [copiesThenConflict()],
];

/** Parsed record or an error message, for custom input. */
function checkRecord(p) {
  if (typeof p !== 'string') return 'Each record must be a string.';
  const m = /^([a-z]{1,10}),(0|[1-9]\d{0,3}),(0|[1-9]\d{0,3}),([a-z]{1,10})$/.exec(p);
  if (!m) return `"${p}" must look like "name,minute,amount,city" (lowercase name and city, whole numbers).`;
  if (Number(m[2]) > MAX_MINUTE) return `Minute in "${p}" must be at most ${MAX_MINUTE}.`;
  if (Number(m[3]) > MAX_AMOUNT) return `Amount in "${p}" must be at most ${MAX_AMOUNT}.`;
  return null;
}

export const problem = {
  id: 'suspicious-payments',
  title: 'Suspicious Payments',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Group By Key', 'Parsing', 'Hash Map'],
  timeLimitMs: 2000,
  argNames: ['payments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A payment log is a list of records. Each record is a string <code>"name,minute,amount,city"</code>:
    who paid, at which minute, how much, and where.</p>
    <p>A record is <strong>suspicious</strong> if either:</p>
    <ul>
      <li>its amount is greater than <code>1000</code>, or</li>
      <li>another record with the <strong>same name</strong> and a <strong>different city</strong> is at
      most <code>60</code> minutes away from it (the absolute difference of the minutes is
      <code>&lt;= 60</code>).</li>
    </ul>
    <p>Return every suspicious record, in the same order as in <code>payments</code>. Identical
    records are separate records: if two copies are suspicious, return both.</p>
  `,
  constraints: [
    '1 <= payments.length <= 1000',
    'Each record is "name,minute,amount,city"',
    'name and city are 1 to 10 lowercase English letters',
    '0 <= minute <= 1000, 0 <= amount <= 2000, written without leading zeros',
    'The log is not sorted by minute',
    'Target complexity: O(n log n) time; comparing each record with its own name group is also accepted at this size',
  ],
  examples: visible.slice(0, 4).map((t) => ({
    input: `payments = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which records can possibly conflict with a given record? Do you need to compare it with everyone?',
    'When two records conflict, which of them is suspicious: the earlier one, the later one, or both?',
    'The log is not sorted by minute. Does your check depend on seeing the earlier record first?',
    'Two copies of the same string are both in the log. How will you remember which ones you flagged, and still return them in input order?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Parse every record once and group the records by name, keeping each record's position in the
    log. A record is flagged by its amount alone, or by a conflict with someone in its own group.
    Mark flags in a boolean array indexed by position, then walk the log once to collect them.</p>
    <h4>Why it works</h4>
    <p>A conflict needs the same name, so records of different people never have to be compared.
    Within a group, check each pair once and, when the cities differ and the minutes are at most 60
    apart, flag <em>both</em> positions. Flagging positions rather than strings keeps identical
    copies separate, and collecting by position gives the input order for free.</p>
    <h4>Complexity</h4>
    <p>Comparing pairs inside each group is O(n + sum of g^2) for groups of size g, at worst O(n^2)
    with one person, about 5 * 10^5 checks at n = 1000. Sorting each group by minute and sliding a
    60-minute window that counts cities brings it to O(n log n).</p>
    <h4>Pitfall</h4>
    <p>Flagging only the record you are looking at. When a later record conflicts with an earlier
    one, the earlier record is suspicious too, even though it looked clean when you first saw it.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'suspiciousPayments',
    params: [{ name: 'payments', type: 'string[]' }],
    returns: 'string[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one line, a JSON array of record strings.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let payments;
    try {
      payments = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter payments as a JSON array of strings, e.g. ["ana,20,800,haifa"].' };
    }
    if (!Array.isArray(payments) || payments.length < 1 || payments.length > MAX_RECORDS) {
      return { ok: false, error: `payments must be an array of 1 to ${MAX_RECORDS} records.` };
    }
    for (const p of payments) {
      const err = checkRecord(p);
      if (err) return { ok: false, error: err };
    }
    return { ok: true, args: [payments] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // One customer per 8 records on average (names are distinct base-26 strings), cities and minutes
  // random, so records meet within their own name group and the group sizes stay bounded. Comparing
  // every record with every other one is n^2.
  growth: {
    target: 'n log n',
    n: 'payments.length',
    sizes: [2000, 4000, 8000, 16000, 32000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const pick = (k) => Math.floor(rnd() * k);
      const people = Math.max(1, n >> 3);
      const names = Array.from({ length: people }, (_, i) => {
        let name = '';
        let v = i;
        do {
          name += String.fromCharCode(97 + (v % 26));
          v = Math.floor(v / 26);
        } while (v > 0);
        return name;
      });
      return [Array.from({ length: n }, () => `${names[pick(people)]},${pick(MAX_MINUTE + 1)},${pick(AMOUNT_LIMIT + 1)},${CITIES[pick(CITIES.length)]}`)];
    },
  },
};

export default problem;
