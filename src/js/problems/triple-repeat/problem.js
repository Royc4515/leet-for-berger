/**
 * Problem: Triple Repeat (SQL)
 *
 * Equivalent to LeetCode 180 "Consecutive Numbers"; statement and tests are written for this
 * project. Rows must be compared with their neighbours by id: a self-join or LAG/LEAD.
 * SQL problem format: docs/PROBLEM_FORMAT.md, "SQL problems".
 */

import { mulberry32 } from '../../engine/rng.js';
import { parseTablesInput } from '../../engine/sql.js';

const COLUMNS = ['ConsecutiveNums'];

/**
 * Reference: sort by id, then report each number that fills ids i, i+1, i+2 for some i, once.
 * @param {[number, number][]} logs rows [id, num]; ids are 1..n in any row order
 * @returns {{ columns: string[], rows: number[][] }}
 */
export function reference(logs) {
  const nums = [...logs].sort((a, b) => a[0] - b[0]).map(([, num]) => num);
  const found = new Set();
  for (let i = 0; i + 2 < nums.length; i++) {
    if (nums[i] === nums[i + 1] && nums[i] === nums[i + 2]) found.add(nums[i]);
  }
  return { columns: COLUMNS, rows: [...found].map((n) => [n]) };
}

const signature = {
  kind: 'sql',
  tables: [
    {
      name: 'Logs',
      columns: [
        { name: 'id', type: 'int', primaryKey: true },
        { name: 'num', type: 'int' },
      ],
    },
  ],
  result: { columns: COLUMNS, ordered: false },
};

/** Ids 1..n inserted in a seeded random order: the table's physical order means nothing. */
function shuffled(rnd, nums) {
  const rows = nums.map((num, i) => [i + 1, num]);
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows;
}

/**
 * Deterministic log: numbers are drawn from a small range and repeated in short runs, so some
 * runs reach three and some stop at two.
 */
function randomLogs(seed, n, range, maxRun) {
  const rnd = mulberry32(seed);
  const nums = [];
  while (nums.length < n) {
    const v = Math.floor(rnd() * range) - Math.floor(range / 3);
    const run = 1 + Math.floor(rnd() * maxRun);
    for (let k = 0; k < run && nums.length < n; k++) nums.push(v);
  }
  return [shuffled(rnd, nums)];
}

const inOrder = (nums) => [nums.map((num, i) => [i + 1, num])];

const visibleArgs = [
  inOrder([1, 1, 1, 2, 1, 2, 2]),
  inOrder([3, 3, 4, 3, 3]),
  inOrder([5, 5, 5, 5, 6, 6, 6]),
  [[[3, 7], [1, 7], [2, 7]]],
  inOrder([1, 2]),
];
const notes = [
  'Only 1 appears three times in a row (ids 1, 2, 3). 2 appears three times, but not in a row.',
  '3 appears four times, never three times in a row.',
  'A run of four still reports 5 once; 6 also has a run of three.',
];

// Hidden tests target: counting occurrences instead of runs, ordering by anything but id,
// reporting a number once per run (missing DISTINCT), runs of exactly two, negative
// numbers, and two large shuffled tables.
const hiddenArgs = [
  [[]],
  inOrder([9]),
  inOrder([4, 4, 5, 4, 4, 5, 4, 4]),
  inOrder([2, 2, 2, 1, 2, 2, 2, 1, 1, 1]),
  inOrder([-1, -1, -1, 0, 0, 0]),
  [[[5, 8], [4, 8], [1, 3], [3, 8], [2, 3]]],
  randomLogs(3, 40, 4, 3),
  randomLogs(7, 500, 20, 4),
  randomLogs(11, 6000, 1000, 3),
  randomLogs(17, 10000, 50, 3),
];

export const problem = {
  id: 'triple-repeat',
  title: 'Triple Repeat',
  difficulty: 'Medium',
  topics: ['sql'],
  patterns: ['Self Join', 'Window Functions'],
  timeLimitMs: 2000,

  statementHtml: `
    <p>The table <code>Logs</code> has a primary key <code>id</code> and a <code>num</code>
    column. The ids are exactly <code>1, 2, ..., n</code>, but the rows may be stored in any
    order: read the log in increasing <code>id</code> order.</p>
    <p>Write a query that reports every number that appears at least <b>three times in a
    row</b>, that is on ids <code>i</code>, <code>i + 1</code> and <code>i + 2</code> for some
    <code>i</code>. Report each such number once.</p>
    <p>Return the result in any order, with one column named <code>ConsecutiveNums</code>.</p>
  `,
  constraints: [
    'Logs(id INT PRIMARY KEY, num INT)',
    '0 <= n <= 10^4, ids are exactly 1..n',
    '-10^6 <= num <= 10^6',
    'Dialect: SQLite. One SELECT (or WITH) statement.',
  ],
  examples: visibleArgs.slice(0, 3).map((args, i) => ({
    input: `Logs = ${JSON.stringify(args[0])}`,
    output: JSON.stringify(reference(...args)),
    explanation: notes[i],
  })),

  hints: [
    'Counting how often a number appears is not enough. What else must be true of those rows?',
    'How can one output row see the num of id + 1 and id + 2 at the same time?',
    'Could you join Logs to itself twice, or look at neighbouring rows with LAG or LEAD?',
    'A run of five contains three runs of three. How many times does your query print that number?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Join <code>Logs</code> to itself twice: match each row <code>l1</code> to the row with <code>id =
    l1.id + 1</code> and the row with <code>id = l1.id + 2</code>, both with the same <code>num</code>.
    Every row that survives both joins starts a run of three, and <code>SELECT DISTINCT</code> reports
    each number once.</p>
    <h4>Why it works</h4>
    <p>The ids are exactly <code>1..n</code>, so three in a row means three consecutive ids. Joining on
    id arithmetic follows the log order no matter how the rows are physically stored. A run of length r
    matches r - 2 times, and the same number can have several separate runs, which is why
    <code>DISTINCT</code> is needed.</p>
    <h4>Complexity</h4>
    <p>O(n log n) for n rows: one scan of <code>l1</code> and two primary-key lookups per row, each
    O(log n) in the index. O(n) space at most for the result. Without an index on <code>id</code> each
    join would compare O(n^2) row pairs.</p>
    <h4>Pitfall</h4>
    <p>Counting instead of checking adjacency. <code>GROUP BY num HAVING COUNT(*) &gt;= 3</code> reports
    a number that appears four times but never three times in a row. Reading neighbours in storage order
    (for example with a window function that is not ordered by <code>id</code>) fails because the rows
    may be stored shuffled.</p>
  `,

  signature,

  visibleTests: visibleArgs.map((args) => ({ args, expected: reference(...args) })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /** Custom input: {"Logs": [[id, num], ...]} with ids exactly 1..n. */
  parseCustomInput(raw) {
    const parsed = parseTablesInput(signature, raw);
    if (!parsed.ok) return parsed;
    const rows = parsed.args[0];
    // The statement promises ids 1..n; a gap would make "consecutive" ambiguous.
    if (rows.some(([id]) => id < 1 || id > rows.length)) return { ok: false, error: 'Ids must be exactly 1..n.' };
    if (rows.some(([, num]) => Math.abs(num) > 1e6)) return { ok: false, error: 'num must be between -10^6 and 10^6.' };
    return parsed;
  },

  solveReference: (args) => reference(...args),
};

export default problem;
