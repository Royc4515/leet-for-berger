import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/largest-ones-square/problem.js';

// Independent brute force: test every square top-left (r, c) and side length directly.
function brute(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let best = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (let s = 1; r + s <= rows && c + s <= cols; s++) {
        let ok = true;
        for (let i = r; i < r + s && ok; i++) {
          for (let j = c; j < c + s; j++) {
            if (grid[i][j] === 0) {
              ok = false;
              break;
            }
          }
        }
        if (ok && s > best) best = s;
      }
    }
  }
  return best * best;
}

// Independent check: rolling 1D DP matching shipped solutions.
function dp1d(grid) {
  const cols = grid[0].length;
  const dp = new Int32Array(cols + 1);
  let best = 0;
  for (const row of grid) {
    let prevDiag = 0;
    for (let c = 0; c < cols; c++) {
      const saved = dp[c + 1];
      if (row[c] === 1) {
        dp[c + 1] = 1 + Math.min(dp[c + 1], dp[c], prevDiag);
        if (dp[c + 1] > best) best = dp[c + 1];
      } else {
        dp[c + 1] = 0;
      }
      prevDiag = saved;
    }
  }
  return best * best;
}

// Classic wrong answers.
// Returns side length instead of area.
const sideNotArea = (grid) => Math.round(Math.sqrt(reference(grid)));
// Ignores top-left diagonal neighbor: 1 + min(up, left).
function noDiag(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp = Array.from({ length: rows + 1 }, () => new Int32Array(cols + 1));
  let best = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        dp[r + 1][c + 1] = 1 + Math.min(dp[r][c + 1], dp[r + 1][c]);
        if (dp[r + 1][c + 1] > best) best = dp[r + 1][c + 1];
      }
    }
  }
  return best * best;
}
// Counts total 1s in the matrix (or rectangle area).
const countAllOnes = (grid) => grid.flat().reduce((s, v) => s + v, 0);

test('reference and rolling 1D DP match brute force on 1000 seeded grids', () => {
  const rnd = mulberry32(221);
  for (let c = 0; c < 1000; c++) {
    const rows = 1 + Math.floor(rnd() * 8);
    const cols = 1 + Math.floor(rnd() * 8);
    const prob = 0.2 + rnd() * 0.7;
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rnd() < prob ? 1 : 0)));
    const expected = brute(grid);
    assert.equal(reference(grid), expected, JSON.stringify(grid));
    assert.equal(dp1d(grid), expected, JSON.stringify(grid));
  }
});

test('5 visible and 10 hidden cases, visible agree, at least two max-size inputs, inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 300 && t.args[0][0].length === 300).length >= 2);
});

test('classic mistakes each fail a case', () => {
  const small = problem.hiddenTests.filter((t) => t.args[0].length <= 10);
  for (const wrong of [sideNotArea, noDiag, countAllOnes]) {
    assert.ok(small.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passed all small hidden cases`);
  }
});

test('custom input parser enforces rectangular binary grids within limits', () => {
  assert.deepEqual(problem.parseCustomInput('[[1,0],[1,1]]').args, [[[1, 0], [1, 1]]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,0],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('bad').ok, false);
});
