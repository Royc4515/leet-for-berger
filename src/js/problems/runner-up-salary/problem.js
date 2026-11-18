/**
 * Problem: Runner-up Salary (SQL)
 *
 * Equivalent to LeetCode 176 "Second Highest Salary"; statement and tests are written for this
 * project. The trap is the empty answer: the query must still return one row, holding NULL.
 * SQL problem format: docs/PROBLEM_FORMAT.md, "SQL problems".
 */

import { mulberry32 } from '../../engine/rng.js';
import { parseTablesInput } from '../../engine/sql.js';

const COLUMNS = ['SecondHighestSalary'];

/**
 * Reference: the second largest distinct salary, or NULL. Always exactly one row.
 * @param {[number, number][]} employees rows [id, salary]
 * @returns {{ columns: string[], rows: (number|null)[][] }}
 */
export function reference(employees) {
  const distinct = [...new Set(employees.map(([, s]) => s))].sort((a, b) => b - a);
  return { columns: COLUMNS, rows: [[distinct.length > 1 ? distinct[1] : null]] };
}

const signature = {
  kind: 'sql',
  tables: [
    {
      name: 'Employee',
      columns: [
        { name: 'id', type: 'int', primaryKey: true },
        { name: 'salary', type: 'int' },
      ],
    },
  ],
  result: { columns: COLUMNS, ordered: false },
};

/** Deterministic table with salaries in [0, maxSalary]; a small range forces many ties. */
function randomEmployees(seed, n, maxSalary) {
  const rnd = mulberry32(seed);
  return [Array.from({ length: n }, (_, i) => [i + 1, Math.floor(rnd() * (maxSalary + 1))])];
}

/** Many employees share the top salary: only a DISTINCT-aware query finds the real runner-up. */
function tiedAtTop(n) {
  return [Array.from({ length: n }, (_, i) => [i + 1, i % 50 === 0 ? 70000 : 99999])];
}

const visibleArgs = [
  [[[1, 100], [2, 200], [3, 300]]],
  [[[1, 100]]],
  [[[1, 300], [2, 300], [3, 200]]],
  [[[1, 500], [2, 500]]],
  [[[4, 0], [9, 10], [2, 10], [7, 5]]],
];
const notes = [
  'The salaries are 300, 200 and 100: the second highest is 200.',
  'There is only one salary, so there is no second highest: one row holding NULL.',
  'Two people earn 300. The second highest distinct salary is 200, not 300.',
];

// Hidden tests target: no DISTINCT (returns the top salary again), an empty result instead of a
// NULL row, MIN instead of the second value, a zero salary, and two large tables.
const hiddenArgs = [
  [[]],
  [[[1, 0], [2, 1]]],
  [[[1, 7], [2, 7], [3, 7], [4, 7]]],
  [[[1, 50], [2, 40], [3, 30], [4, 20], [5, 10]]],
  [[[10, 100000], [20, 0], [30, 100000]]],
  randomEmployees(3, 30, 5),
  randomEmployees(7, 500, 1000000),
  tiedAtTop(3000),
  randomEmployees(11, 8000, 100000),
  randomEmployees(13, 10000, 3),
];

export const problem = {
  id: 'runner-up-salary',
  title: 'Runner-up Salary',
  difficulty: 'Medium',
  topics: ['sql'],
  patterns: ['Subquery', 'DISTINCT', 'NULL result'],
  timeLimitMs: 2000,

  statementHtml: `
    <p>The table <code>Employee</code> has a primary key <code>id</code> and a
    <code>salary</code> column.</p>
    <p>Write a query that reports the <b>second highest distinct</b> salary. If there is no
    second highest salary (the table is empty, or everyone earns the same), report
    <code>NULL</code>.</p>
    <p>The result is always exactly one row with one column named
    <code>SecondHighestSalary</code>.</p>
  `,
  constraints: [
    'Employee(id INT PRIMARY KEY, salary INT)',
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
    'If two people share the top salary, is the second row of a sorted list the answer?',
    'What does your query return when no row qualifies: zero rows, or one row holding NULL?',
    'A scalar subquery that finds nothing evaluates to what? Can you wrap your query in one?',
    'Could you describe the answer as the largest salary that is smaller than the largest salary?',
  ],

  signature,

  visibleTests: visibleArgs.map((args) => ({ args, expected: reference(...args) })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /** Custom input: {"Employee": [[id, salary], ...]}. */
  parseCustomInput(raw) {
    const parsed = parseTablesInput(signature, raw);
    if (parsed.ok && parsed.args[0].some(([, s]) => s < 0 || s > 1e6)) return { ok: false, error: 'Salaries must be between 0 and 10^6.' };
    return parsed;
  },

  solveReference: (args) => reference(...args),
};

export default problem;
