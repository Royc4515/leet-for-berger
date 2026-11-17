import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/island-count/problem.js';

// Brute force: union-find over every pair of edge-adjacent land cells, then count the roots.
function brute(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const parent = Array.from({ length: rows * cols }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '1') continue;
      if (r + 1 < rows && grid[r + 1][c] === '1') parent[find(r * cols + c)] = find((r + 1) * cols + c);
      if (c + 1 < cols && grid[r][c + 1] === '1') parent[find(r * cols + c)] = find(r * cols + c + 1);
    }
  let count = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === '1' && find(r * cols + c) === r * cols + c) count++;
  return count;
}

test('reference matches brute force on 2000 random grids', () => {
  const rnd = mulberry32(81);
  for (let i = 0; i < 2000; i++) {
    const rows = 1 + Math.floor(rnd() * 8);
    const cols = 1 + Math.floor(rnd() * 8);
    const density = rnd();
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rnd() < density ? '1' : '0')).join(''));
    assert.equal(reference(grid), brute(grid));
  }
});

test('visible expectations agree; max-size cases include the deep snake; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 300 && t.args[0][0].length === 300);
  assert.ok(big.length >= 2);
  // The snake must be a single island so its flood fill really is ~45,000 cells deep.
  assert.ok(big.some((t) => t.expected === 1 && t.args[0].join('').split('1').length - 1 > 40000 && t.args[0][1].includes('0')));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('["10","1"]').ok, false);
  assert.equal(problem.parseCustomInput('["12"]').ok, false);
  assert.equal(problem.parseCustomInput('[""]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,0]]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(301).fill('1'))).ok, false);
  assert.equal(problem.parseCustomInput('not json').ok, false);
  assert.deepEqual(problem.parseCustomInput('["10","01"]').args, [['10', '01']]);
});
