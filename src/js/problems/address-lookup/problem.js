/**
 * Problem: Address Lookup (SQL)
 *
 * Equivalent to LeetCode 175 "Combine Two Tables"; statement and tests are written for this
 * project. Teaches the outer join: every person appears, with or without an address.
 * SQL problem format: docs/PROBLEM_FORMAT.md, "SQL problems".
 */

import { mulberry32 } from '../../engine/rng.js';
import { parseTablesInput } from '../../engine/sql.js';

const COLUMNS = ['firstName', 'lastName', 'city', 'state'];

/**
 * Reference: one row per (person, address of that person), or one row with NULL city and state
 * for a person without any address. Addresses of unknown people are dropped.
 * @param {[number, string, string][]} persons rows [personId, lastName, firstName]
 * @param {[number, number, string, string][]} addresses rows [addressId, personId, city, state]
 * @returns {{ columns: string[], rows: (string|null)[][] }}
 */
export function reference(persons, addresses) {
  const byPerson = new Map();
  for (const [, personId, city, state] of addresses) {
    if (!byPerson.has(personId)) byPerson.set(personId, []);
    byPerson.get(personId).push([city, state]);
  }
  const rows = [];
  for (const [personId, lastName, firstName] of persons) {
    const found = byPerson.get(personId);
    if (!found) rows.push([firstName, lastName, null, null]);
    else for (const [city, state] of found) rows.push([firstName, lastName, city, state]);
  }
  return { columns: COLUMNS, rows };
}

const signature = {
  kind: 'sql',
  tables: [
    {
      name: 'Person',
      columns: [
        { name: 'personId', type: 'int', primaryKey: true },
        { name: 'lastName', type: 'string' },
        { name: 'firstName', type: 'string' },
      ],
    },
    {
      name: 'Address',
      columns: [
        { name: 'addressId', type: 'int', primaryKey: true },
        { name: 'personId', type: 'int' },
        { name: 'city', type: 'string' },
        { name: 'state', type: 'string' },
      ],
    },
  ],
  result: { columns: COLUMNS, ordered: false },
};

const FIRST = ['Ada', 'Ben', 'Chen', 'Dana', 'Eli', 'Fay', 'Gil', 'Hila', 'Ido', 'Joy'];
const LAST = ['Levi', 'Cohen', 'Mizrahi', 'Peretz', 'Biton', 'Dahan', 'Avraham', 'Friedman'];
const PLACES = [['Haifa', 'North'], ['Eilat', 'South'], ['Tel Aviv', 'Center'], ['New York', 'NY'], ['Austin', 'TX'], ['Boston', 'MA']];

/**
 * Deterministic tables: some people have no address, some have several, and some addresses
 * point at people who do not exist. Names repeat, so a result can legitimately hold equal rows.
 */
function randomTables(seed, nPersons, nAddresses) {
  const rnd = mulberry32(seed);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const persons = Array.from({ length: nPersons }, (_, i) => [i + 1, pick(LAST), pick(FIRST)]);
  const addresses = Array.from({ length: nAddresses }, (_, i) => {
    const [city, state] = pick(PLACES);
    // Up to 10% more ids than people exist: those addresses belong to nobody.
    return [i + 1, 1 + Math.floor(rnd() * Math.ceil(nPersons * 1.1)), city, state];
  });
  return [persons, addresses];
}

const visibleArgs = [
  [
    [[1, 'Wang', 'Allen'], [2, 'Alice', 'Bob']],
    [[1, 2, 'New York City', 'New York'], [2, 3, 'Leetcode', 'California']],
  ],
  [[[1, 'Levi', 'Dana']], []],
  [[[1, 'Cohen', 'Eli'], [2, 'Biton', 'Fay']], [[10, 1, 'Haifa', 'North'], [11, 2, 'Eilat', 'South']]],
  [[[5, 'Dahan', 'Gil']], [[1, 5, 'Haifa', 'North'], [2, 5, 'Austin', 'TX']]],
  [[], [[1, 1, 'Boston', 'MA']]],
];
const notes = [
  'Allen has no address, so city and state are NULL. Address 2 belongs to nobody.',
  'With no addresses at all, every person still appears.',
  'Everyone has exactly one address.',
];

// Hidden tests target: INNER JOIN (drops people without an address), joining on the wrong
// column (addressId instead of personId), starting from Address, deduplicating legitimate
// repeated rows, and two large tables.
const hiddenArgs = [
  [[], []],
  [[[1, 'Levi', 'Ada']], [[1, 2, 'Haifa', 'North']]],
  [[[1, 'Levi', 'Ada'], [2, 'Cohen', 'Ben']], [[2, 1, 'Haifa', 'North']]],
  [[[1, 'Levi', 'Ada'], [2, 'Levi', 'Ada']], [[1, 1, 'Eilat', 'South'], [2, 2, 'Eilat', 'South']]],
  [[[3, 'Peretz', 'Joy'], [4, 'Biton', 'Ido']], [[7, 3, 'Boston', 'MA'], [8, 3, 'Boston', 'MA'], [9, 9, 'Austin', 'TX']]],
  [[[100, 'Friedman', 'Hila']], [[100, 1, 'Austin', 'TX']]],
  randomTables(5, 40, 30),
  randomTables(9, 300, 500),
  randomTables(13, 4000, 3000),
  randomTables(21, 6000, 8000),
];

export const problem = {
  id: 'address-lookup',
  title: 'Address Lookup',
  difficulty: 'Easy',
  topics: ['sql'],
  patterns: ['LEFT JOIN', 'NULL handling'],
  timeLimitMs: 2000,

  statementHtml: `
    <p>The table <code>Person</code> holds people: <code>personId</code> is its primary key,
    and each row has a <code>lastName</code> and a <code>firstName</code>.</p>
    <p>The table <code>Address</code> holds addresses: <code>addressId</code> is its primary key,
    <code>personId</code> says whose address it is, and each row has a <code>city</code> and a
    <code>state</code>. A <code>personId</code> in <code>Address</code> may not exist in
    <code>Person</code>.</p>
    <p>Write a query that reports <code>firstName</code>, <code>lastName</code>,
    <code>city</code> and <code>state</code> for <b>every</b> person in <code>Person</code>. A
    person with no address appears once, with <code>NULL</code> city and state. A person with
    several addresses appears once per address.</p>
    <p>Return the result in any order, with the columns in that order and with those names.</p>
  `,
  constraints: [
    'Person(personId INT PRIMARY KEY, lastName VARCHAR, firstName VARCHAR)',
    'Address(addressId INT PRIMARY KEY, personId INT, city VARCHAR, state VARCHAR)',
    '0 <= rows per table <= 10^4',
    'Dialect: SQLite. One SELECT (or WITH) statement.',
  ],
  examples: visibleArgs.slice(0, 3).map((args, i) => ({
    input: `Person = ${JSON.stringify(args[0])}\nAddress = ${JSON.stringify(args[1])}`,
    output: JSON.stringify(reference(...args)),
    explanation: notes[i],
  })),

  hints: [
    'Which table must every output row come from, so that nobody goes missing?',
    'What does a plain JOIN do to a person who has no matching address?',
    'Which column links an address to its owner: addressId or personId?',
    'If a person has no address, what values should city and state hold?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Start from <code>Person</code> and <code>LEFT JOIN</code> <code>Address</code> on
    <code>personId</code>, then select <code>firstName</code>, <code>lastName</code>,
    <code>city</code> and <code>state</code> in that order.</p>
    <h4>Why it works</h4>
    <p>A left join keeps every row of the left table. A person with matching addresses produces one
    row per match, and a person with none produces one row with <code>NULL</code> in the
    <code>Address</code> columns, which is exactly what the statement asks for. Addresses whose
    <code>personId</code> is not in <code>Person</code> have no left row to attach to, so they never
    appear.</p>
    <h4>Complexity</h4>
    <p>O(n + m) for n people and m addresses with a hash join or an index on
    <code>Address.personId</code>; without either, a nested-loop join can cost O(n * m). The output has
    at most n + m rows.</p>
    <h4>Pitfall</h4>
    <p>Using a plain <code>JOIN</code>: it is an inner join and silently drops every person without an
    address. Joining on <code>addressId</code> instead of <code>personId</code> is the other common slip,
    since both tables have an id column that looks plausible.</p>
  `,

  signature,

  visibleTests: visibleArgs.map((args) => ({ args, expected: reference(...args) })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /** Custom input: {"Person": [[personId, lastName, firstName], ...], "Address": [[addressId, personId, city, state], ...]}. */
  parseCustomInput: (raw) => parseTablesInput(signature, raw),

  solveReference: (args) => reference(...args),
};

export default problem;
