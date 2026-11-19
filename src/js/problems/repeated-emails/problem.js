/**
 * Problem: Repeated Emails (SQL)
 *
 * Equivalent to LeetCode 182 "Duplicate Emails"; statement and tests are written for this
 * project. Teaches GROUP BY with a HAVING filter on the group size.
 * SQL problem format: docs/PROBLEM_FORMAT.md, "SQL problems".
 */

import { mulberry32 } from '../../engine/rng.js';
import { parseTablesInput } from '../../engine/sql.js';

const COLUMNS = ['Email'];

/**
 * Reference: every email that appears on more than one row, listed once.
 * @param {[number, string][]} persons rows [id, email]
 * @returns {{ columns: string[], rows: string[][] }}
 */
export function reference(persons) {
  const count = new Map();
  for (const [, email] of persons) count.set(email, (count.get(email) ?? 0) + 1);
  return { columns: COLUMNS, rows: [...count].filter(([, n]) => n > 1).map(([email]) => [email]) };
}

const signature = {
  kind: 'sql',
  tables: [
    {
      name: 'Person',
      columns: [
        { name: 'id', type: 'int', primaryKey: true },
        { name: 'email', type: 'string' },
      ],
    },
  ],
  result: { columns: COLUMNS, ordered: false },
};

/**
 * Deterministic table drawn from a pool of `pool` addresses, so roughly n / pool rows share each
 * one. A small pool makes nearly everything repeat, a large one makes repeats rare.
 */
function randomPersons(seed, n, pool) {
  const rnd = mulberry32(seed);
  return [Array.from({ length: n }, (_, i) => [i + 1, `user${Math.floor(rnd() * pool)}@mail.com`])];
}

const visibleArgs = [
  [[[1, 'a@b.com'], [2, 'c@d.com'], [3, 'a@b.com']]],
  [[[1, 'x@y.com'], [2, 'z@y.com']]],
  [[[1, 'dup@x.io'], [2, 'dup@x.io'], [3, 'dup@x.io']]],
  [[[1, 'a@x.io'], [2, 'b@x.io'], [3, 'a@x.io'], [4, 'b@x.io'], [5, 'c@x.io']]],
  [[]],
];
const notes = [
  'a@b.com is on rows 1 and 3.',
  'Every email is unique, so the result is empty.',
  'An email on three rows is still reported once.',
];

// Hidden tests target: missing DISTINCT / GROUP BY (an email repeated k times printed k-1 or k
// times), HAVING COUNT(*) >= 1, near-identical emails that must not merge, an empty table, and two
// large tables.
const hiddenArgs = [
  [[[1, 'solo@x.io']]],
  [[[7, 'same@x.io'], [3, 'same@x.io']]],
  [[[1, 'a@b.com'], [2, 'a@b.co'], [3, 'a@b.com.il'], [4, 'b@b.com']]],
  [[[1, 'q@q.q'], [2, 'q@q.q'], [3, 'q@q.q'], [4, 'q@q.q'], [5, 'r@q.q'], [6, 'r@q.q']]],
  [[[10, 'm@x.io'], [20, 'n@x.io'], [30, 'o@x.io'], [40, 'm@x.io']]],
  [[]],
  randomPersons(5, 300, 30),
  randomPersons(7, 2000, 5000),
  randomPersons(11, 8000, 6000),
  randomPersons(19, 10000, 500),
];

export const problem = {
  id: 'repeated-emails',
  title: 'Repeated Emails',
  difficulty: 'Easy',
  topics: ['sql'],
  patterns: ['GROUP BY', 'HAVING'],
  timeLimitMs: 2000,

  statementHtml: `
    <p>The table <code>Person</code> has a primary key <code>id</code> and an
    <code>email</code> column. Emails contain no uppercase letters and are never
    <code>NULL</code>.</p>
    <p>Write a query that reports every email that appears on <b>more than one</b> row. Report
    each such email once.</p>
    <p>Return the result in any order, with one column named <code>Email</code>.</p>
  `,
  constraints: [
    'Person(id INT PRIMARY KEY, email VARCHAR)',
    '0 <= number of rows <= 10^4',
    'email is lowercase and not NULL',
    'Dialect: SQLite. One SELECT (or WITH) statement.',
  ],
  examples: visibleArgs.slice(0, 3).map((args, i) => ({
    input: `Person = ${JSON.stringify(args[0])}`,
    output: JSON.stringify(reference(...args)),
    explanation: notes[i],
  })),

  hints: [
    'If you put rows with the same email together, what number tells you it is repeated?',
    'Can WHERE filter on a count? If not, which clause can?',
    'An email on three rows: how many times does your query print it?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Group the rows of <code>Person</code> by <code>email</code> and keep the groups whose size is
    greater than one with <code>HAVING COUNT(*) &gt; 1</code>. Return the email, renamed to
    <code>Email</code>.</p>
    <h4>Why it works</h4>
    <p><code>GROUP BY</code> turns all rows with the same email into one group and one output row, so a
    repeated email is reported once no matter how many rows share it. <code>COUNT(*)</code> is that
    group's row count, and <code>HAVING</code> filters groups after aggregation, which is where the
    count exists. Emails are lowercase and never <code>NULL</code>, so plain equality groups them
    correctly.</p>
    <h4>Complexity</h4>
    <p>O(n) with hash aggregation, or O(n log n) when the engine sorts to group, for n rows. Space is
    O(d) for d distinct emails.</p>
    <h4>Pitfall</h4>
    <p>Putting the count in <code>WHERE</code>, which runs before grouping and cannot see aggregates.
    A self-join on equal emails with different ids also finds the repeats, but an email on three rows
    then comes back several times unless you add <code>DISTINCT</code>.</p>
  `,

  signature,

  visibleTests: visibleArgs.map((args) => ({ args, expected: reference(...args) })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /** Custom input: {"Person": [[id, email], ...]}, emails in lowercase. */
  parseCustomInput(raw) {
    const parsed = parseTablesInput(signature, raw);
    // SQLite compares text case-sensitively, MySQL (LeetCode) does not: lowercase keeps them equal.
    if (parsed.ok && parsed.args[0].some(([, email]) => email !== email.toLowerCase())) return { ok: false, error: 'Emails must be lowercase.' };
    return parsed;
  },

  solveReference: (args) => reference(...args),
};

export default problem;
