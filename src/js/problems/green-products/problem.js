/**
 * Problem: Green Products (SQL)
 *
 * Equivalent to LeetCode 1757 "Recyclable and Low Fat Products"; statement and tests are written
 * for this project. The first SQL problem in the ladder: one table, a WHERE with two conditions.
 * SQL problem format: docs/PROBLEM_FORMAT.md, "SQL problems".
 */

import { mulberry32 } from '../../engine/rng.js';
import { parseTablesInput } from '../../engine/sql.js';

const COLUMNS = ['product_id'];

/**
 * Reference: products that are both low fat and recyclable.
 * @param {[number, string, string][]} products rows [product_id, low_fats, recyclable]
 * @returns {{ columns: string[], rows: number[][] }}
 */
export function reference(products) {
  return { columns: COLUMNS, rows: products.filter(([, fat, rec]) => fat === 'Y' && rec === 'Y').map(([id]) => [id]) };
}

const signature = {
  kind: 'sql',
  tables: [
    {
      name: 'Products',
      columns: [
        { name: 'product_id', type: 'int', primaryKey: true },
        { name: 'low_fats', type: 'string', values: ['Y', 'N'] },
        { name: 'recyclable', type: 'string', values: ['Y', 'N'] },
      ],
    },
  ],
  result: { columns: COLUMNS, ordered: false },
};

/** Deterministic table: ids are distinct and shuffled so insertion order carries no meaning. */
function randomProducts(seed, n, yesShare) {
  const rnd = mulberry32(seed);
  const ids = Array.from({ length: n }, (_, i) => i * 3 + 1);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const yn = () => (rnd() < yesShare ? 'Y' : 'N');
  return [ids.map((id) => [id, yn(), yn()])];
}

const visibleArgs = [
  [[[0, 'Y', 'N'], [1, 'Y', 'Y'], [2, 'N', 'Y'], [3, 'Y', 'Y'], [4, 'N', 'N']]],
  [[[10, 'Y', 'N'], [11, 'N', 'Y']]],
  [[[7, 'Y', 'Y'], [8, 'Y', 'Y']]],
  [[]],
  [[[5, 'N', 'N'], [6, 'Y', 'Y'], [9, 'N', 'Y']]],
];
const notes = [
  'Products 1 and 3 are both low fat and recyclable.',
  'Each product meets only one of the two conditions.',
  'Every product qualifies.',
];

// Hidden tests target: OR instead of AND, checking one column twice, returning extra columns,
// treating an empty table as an error, and two large tables.
const hiddenArgs = [
  [[[1, 'Y', 'Y']]],
  [[[1, 'N', 'Y']]],
  [[[1, 'Y', 'N'], [2, 'Y', 'N'], [3, 'Y', 'N']]],
  [[[1, 'N', 'Y'], [2, 'N', 'Y'], [3, 'Y', 'Y']]],
  [[[1000000, 'Y', 'Y'], [0, 'Y', 'Y'], [500, 'N', 'N']]],
  [[]],
  randomProducts(17, 60, 0.5),
  randomProducts(29, 200, 0.8),
  randomProducts(41, 5000, 0.5),
  randomProducts(53, 8000, 0.3),
];

export const problem = {
  id: 'green-products',
  title: 'Green Products',
  difficulty: 'Easy',
  topics: ['sql'],
  patterns: ['SELECT', 'WHERE'],
  milestone: 1,
  timeLimitMs: 2000,

  statementHtml: `
    <p>The table <code>Products</code> lists a store's products. <code>product_id</code> is the
    primary key. <code>low_fats</code> is <code>'Y'</code> when the product is low fat and
    <code>'N'</code> otherwise; <code>recyclable</code> is <code>'Y'</code> when its packaging is
    recyclable and <code>'N'</code> otherwise.</p>
    <p>Write a query that returns the <code>product_id</code> of every product that is
    <b>both</b> low fat and recyclable.</p>
    <p>Return the result in any order, with one column named <code>product_id</code>.</p>
  `,
  constraints: [
    'Products(product_id INT PRIMARY KEY, low_fats ENUM(\'Y\', \'N\'), recyclable ENUM(\'Y\', \'N\'))',
    '0 <= number of rows <= 10^4',
    '0 <= product_id <= 10^6',
    'Dialect: SQLite. One SELECT (or WITH) statement.',
  ],
  examples: visibleArgs.slice(0, 3).map((args, i) => ({
    input: `Products = ${JSON.stringify(args[0])}`,
    output: JSON.stringify(reference(...args)),
    explanation: notes[i],
  })),

  hints: [
    'Which rows should survive: products that pass one condition, or both?',
    'How do you combine two conditions in a WHERE clause so that both must hold?',
    'Are you returning only the column the task asks for, with that exact name?',
  ],

  signature,

  visibleTests: visibleArgs.map((args) => ({ args, expected: reference(...args) })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /** Custom input: {"Products": [[product_id, low_fats, recyclable], ...]}. */
  parseCustomInput: (raw) => parseTablesInput(signature, raw),

  solveReference: (args) => reference(...args),
};

export default problem;
