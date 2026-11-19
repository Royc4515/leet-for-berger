/**
 * Problem: Above Manager Pay (SQL)
 *
 * Equivalent to LeetCode 181; statement and tests are written for this project. Teaches the
 * self-join: one table read twice under two aliases, an employee row matched with its manager's
 * row through managerId.
 * SQL problem format: docs/PROBLEM_FORMAT.md, "SQL problems".
 */

import { mulberry32 } from '../../engine/rng.js';
import { parseTablesInput } from '../../engine/sql.js';

const COLUMNS = ['employee'];
const MAX_SALARY = 1000000;

/**
 * Reference: one row per employee whose manager exists and earns strictly less.
 * @param {[number, string, number, number|null][]} employees rows [id, name, salary, managerId]
 * @returns {{ columns: string[], rows: string[][] }}
 */
export function reference(employees) {
  const salaryById = new Map(employees.map(([id, , salary]) => [id, salary]));
  const rows = [];
  for (const [, name, salary, managerId] of employees) {
    if (managerId !== null && salaryById.has(managerId) && salary > salaryById.get(managerId)) rows.push([name]);
  }
  return { columns: COLUMNS, rows };
}

const signature = {
  kind: 'sql',
  tables: [
    {
      name: 'Employee',
      columns: [
        { name: 'id', type: 'int', primaryKey: true },
        { name: 'name', type: 'string' },
        { name: 'salary', type: 'int' },
        { name: 'managerId', type: 'int', nullable: true },
      ],
    },
  ],
  result: { columns: COLUMNS, ordered: false },
};

const NAMES = ['Noa', 'Omer', 'Yael', 'Itai', 'Maya', 'Ariel', 'Tamar', 'Lior', 'Shira', 'Eitan', 'Roni', 'Gal'];

/**
 * Deterministic staff table. Ids are a shuffled range, so a manager's id can be larger or smaller
 * than the employee's. Salaries come from a small set of levels, so ties with the manager are
 * common. About 10% have no manager and about 5% point at an id that does not exist. Names repeat.
 */
function randomStaff(seed, n, levels = 12) {
  const rnd = mulberry32(seed);
  const ids = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return [ids.map((id) => {
    const roll = rnd();
    let managerId = ids[Math.floor(rnd() * n)];
    if (roll < 0.1 || managerId === id) managerId = null;
    else if (roll < 0.15) managerId = n + 1 + Math.floor(rnd() * n);
    const salary = (1 + Math.floor(rnd() * levels)) * Math.floor(MAX_SALARY / levels);
    return [id, NAMES[Math.floor(rnd() * NAMES.length)], salary, managerId];
  })];
}

/** A chain of command where every second step is a raise and every other step a tie. */
function chainOfCommand(n) {
  return [Array.from({ length: n }, (_, i) => [i + 1, NAMES[i % NAMES.length], 1000 + Math.floor(i / 2) * 10, i === 0 ? null : i])];
}

const visibleArgs = [
  [[[1, 'Noa', 70000, 3], [2, 'Omer', 80000, 4], [3, 'Yael', 60000, null], [4, 'Itai', 90000, null]]],
  [[[1, 'Maya', 5000, null], [2, 'Ariel', 5000, 1], [3, 'Tamar', 4000, 1]]],
  [[[10, 'Lior', 100, 20], [20, 'Shira', 50, 10]]],
  [[[1, 'Eitan', 300, 2], [2, 'Roni', 200, 3], [3, 'Gal', 100, null]]],
  [[[1, 'Noa', 900, 7], [2, 'Noa', 900, 3], [3, 'Omer', 100, null]]],
];
const notes = [
  'Noa earns 70000 and her manager Yael 60000. Omer earns less than his manager Itai.',
  'Ariel earns the same as Maya: equal pay is not more.',
  'Two people can manage each other; only Lior earns more than the other.',
];

// Hidden tests target: >= instead of > (ties with the manager), joining the other way round
// (reports managers who out-earn a report), keeping employees whose managerId is NULL or unknown,
// DISTINCT on name (two different people share a name), and an empty table plus large tables.
const hiddenArgs = [
  [[]],
  [[[1, 'Gal', 100, null]]],
  [[[1, 'Roni', 100, 99], [2, 'Itai', 50, null]]],
  [[[5, 'Yael', 1000, 5]]],
  [[[1, 'Maya', 0, null], [2, 'Maya', 10, 1], [3, 'Maya', 20, 1], [4, 'Omer', 20, 3]]],
  [[[1, 'Shira', 1000000, null], [2, 'Lior', 999999, 1], [3, 'Tamar', 1000000, 2]]],
  randomStaff(5, 40),
  chainOfCommand(3000),
  randomStaff(9, 5000),
  randomStaff(13, 10000, 3),
];

export const problem = {
  id: 'above-manager-pay',
  title: 'Above Manager Pay',
  difficulty: 'Easy',
  topics: ['sql'],
  patterns: ['Self-join', 'Table aliases'],
  timeLimitMs: 2000,

  statementHtml: `
    <p>The table <code>Employee</code> lists the staff of a company: <code>id</code> is its
    primary key, and each row has a <code>name</code>, a <code>salary</code> and a
    <code>managerId</code>, the <code>id</code> of the employee's direct manager.
    <code>managerId</code> is <code>NULL</code> for someone with no manager, and it may hold an
    id that is not in the table, which also means no known manager.</p>
    <p>Write a query that reports the name of every employee who earns <b>strictly more</b> than
    their direct manager. Report each such employee once, even when two of them share a name.</p>
    <p>Return one column named <code>employee</code>, with the rows in any order.</p>
  `,
  constraints: [
    'Employee(id INT PRIMARY KEY, name VARCHAR, salary INT, managerId INT NULL)',
    '0 <= number of rows <= 10^4',
    '0 <= salary <= 10^6',
    'Dialect: SQLite. One SELECT (or WITH) statement.',
  ],
  examples: visibleArgs.slice(0, 3).map((args, i) => ({
    input: `Employee = ${JSON.stringify(args[0])}`,
    output: JSON.stringify(reference(...args)),
    explanation: notes[i],
  })),

  hints: [
    'Each output row compares two rows of the same table. How can a query look at two rows of Employee side by side?',
    'If you read Employee twice under two different names, which column of one should equal which column of the other?',
    'Which of the two copies is the employee you report, and which is the manager?',
    'What happens to an employee whose managerId is NULL, or points at nobody, in an inner join?',
    'Does earning the same as the manager count?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Join <code>Employee</code> with itself: one copy <code>e</code> for the employee, another
    copy <code>m</code> for the manager, matched on <code>e.managerId = m.id</code>. Keep the rows
    where <code>e.salary &gt; m.salary</code> and select <code>e.name AS employee</code>.</p>
    <h4>Why it works</h4>
    <p>The join pairs each employee with exactly one row, their manager's, because <code>id</code> is
    the primary key. An inner join drops everyone whose <code>managerId</code> is <code>NULL</code> or
    matches no <code>id</code>, which is what the statement asks: no known manager, nothing to
    compare. The strict comparison then leaves only those who out-earn that manager.</p>
    <h4>Complexity</h4>
    <p>O(n) for n rows with the primary key index on <code>id</code>: each employee row does one
    indexed lookup of its manager (O(n log n) with a B-tree index). Without an index a nested-loop
    join would be O(n^2).</p>
    <h4>Pitfall</h4>
    <p>Writing the join condition the other way round, <code>e.id = m.managerId</code>, compares
    managers with their reports and returns the wrong people. Using <code>&gt;=</code> wrongly
    includes ties, and <code>DISTINCT</code> wrongly merges two different people with the same
    name.</p>
  `,

  signature,

  visibleTests: visibleArgs.map((args) => ({ args, expected: reference(...args) })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /** Custom input: {"Employee": [[id, name, salary, managerId], ...]}. */
  parseCustomInput(raw) {
    const parsed = parseTablesInput(signature, raw);
    if (parsed.ok && parsed.args[0].some(([, , s]) => s < 0 || s > MAX_SALARY)) return { ok: false, error: 'Salaries must be between 0 and 10^6.' };
    return parsed;
  },

  solveReference: (args) => reference(...args),
};

export default problem;
