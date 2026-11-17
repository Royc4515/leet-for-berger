import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/obstacle-clearing/problem.js';

// Brute force: relax every cell from its four neighbours until nothing changes.
function brute(grid) {
  const m = grid.length;
  const n = grid[0].length;
  const cost = grid.map((row) => row.map(() => Infinity));
  cost[0][0] = 0;
  for (let changed = true; changed;) {
    changed = false;
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        for (const [pr, pc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
          if (pr < 0 || pr >= m || pc < 0 || pc >= n) continue;
          if (cost[pr][pc] + grid[r][c] < cost[r][c]) {
            cost[r][c] = cost[pr][pc] + grid[r][c];
            changed = true;
          }
        }
      }
    }
  }
  return cost[m - 1][n - 1];
}

test('reference matches brute force on 2000 random grids', () => {
  const rnd = mulberry32(1206);
  for (let i = 0; i < 2000; i++) {
    const m = 1 + Math.floor(rnd() * 5);
    const n = (m === 1 ? 2 : 1) + Math.floor(rnd() * 5);
    const density = rnd();
    const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => (rnd() < density ? 1 : 0)));
    grid[0][0] = 0;
    grid[m - 1][n - 1] = 0;
    assert.equal(reference(grid), brute(grid));
  }
});

test('visible expectations agree; five cases of about 10^5 cells; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length * t.args[0][0].length >= 99856).length >= 5);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[[0]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,0]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,2,0]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,0],[0]]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify([new Array(100001).fill(0)])).ok, false);
  assert.deepEqual(problem.parseCustomInput('[[0,1],[1,0]]').args, [[[0, 1], [1, 0]]]);
});
