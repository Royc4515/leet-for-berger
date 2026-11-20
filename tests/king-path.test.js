import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/king-path/problem.js';

// Brute force: relax cell distances until nothing changes. Independent of the wave search.
function brute(grid) {
  const n = grid.length;
  if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1;
  const dist = grid.map((row) => row.map(() => Infinity));
  dist[0][0] = 1;
  for (let changed = true; changed; ) {
    changed = false;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] === 1) continue;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const d = dist[r + dr]?.[c + dc];
            if (d !== undefined && d + 1 < dist[r][c]) {
              dist[r][c] = d + 1;
              changed = true;
            }
          }
        }
      }
    }
  }
  return Number.isFinite(dist[n - 1][n - 1]) ? dist[n - 1][n - 1] : -1;
}

/** Wave search over a chosen set of moves, with optional corner check and count of moves. */
function waves(grid, moves, { checkCorners = true, countMoves = false } = {}) {
  const n = grid.length;
  if (checkCorners && (grid[0][0] === 1 || grid[n - 1][n - 1] === 1)) return -1;
  const dist = grid.map((row) => row.map(() => -1));
  dist[0][0] = 1;
  const queue = [[0, 0]];
  for (let h = 0; h < queue.length; h++) {
    const [r, c] = queue[h];
    for (const [dr, dc] of moves) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || grid[nr][nc] === 1 || dist[nr][nc] !== -1) continue;
      dist[nr][nc] = dist[r][c] + 1;
      queue.push([nr, nc]);
    }
  }
  const d = dist[n - 1][n - 1];
  return d === -1 ? -1 : countMoves ? d - 1 : d;
}

const EIGHT = [-1, 0, 1].flatMap((dr) => [-1, 0, 1].filter((dc) => dr || dc).map((dc) => [dr, dc]));
const FOUR = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Classic wrong answers.
const fourDirections = (grid) => waves(grid, FOUR);
const countsMoves = (grid) => waves(grid, EIGHT, { countMoves: true });
const ignoresCorners = (grid) => waves(grid, EIGHT, { checkCorners: false });

// Classic wrong answer: the first route a depth-first search finds (small grids only).
function firstRouteFound(grid) {
  const n = grid.length;
  if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1;
  const seen = grid.map((row) => row.map(() => false));
  const go = (r, c, len) => {
    if (r === n - 1 && c === n - 1) return len;
    seen[r][c] = true;
    for (const [dr, dc] of EIGHT) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || grid[nr][nc] === 1 || seen[nr][nc]) continue;
      const got = go(nr, nc, len + 1);
      if (got !== -1) return got;
    }
    return -1;
  };
  return go(0, 0, 1);
}

function randomGrid(rnd, n, blocked) {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => (rnd() < blocked ? 1 : 0)));
}

test('reference matches the relaxation brute force on 3000 random grids', () => {
  const rnd = mulberry32(1091);
  let routes = 0;
  for (let i = 0; i < 3000; i++) {
    const grid = randomGrid(rnd, 1 + Math.floor(rnd() * 7), [0.2, 0.4, 0.55][i % 3]);
    const expected = brute(grid);
    assert.equal(reference(grid), expected, JSON.stringify(grid));
    if (expected !== -1) routes++;
  }
  assert.ok(routes > 600 && routes < 2700, `grids with a route: ${routes} of 3000`);
});

test('visible expectations agree; 15 valid cases; both outcomes; full-size grids', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  for (const t of problem.visibleTests) assert.equal(brute(...t.args), t.expected);
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 6)) assert.equal(brute(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 299).length >= 2);
  const results = problem.hiddenTests.map((t) => t.expected);
  assert.ok(results.filter((r) => r === -1).length >= 3 && results.filter((r) => r > 0).length >= 3);
  // The winding corridor forces a route of about 45,000 cells, which no route-by-route search survives.
  assert.ok(results.some((r) => r > 40000));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  // The depth-first search is exponential, so it only runs on grids up to 6 x 6.
  const small = suite.filter((t) => t.args[0].length <= 6);
  const wrongs = [
    [fourDirections, suite],
    [countsMoves, suite],
    [ignoresCorners, suite],
    [firstRouteFound, small],
  ];
  for (const [wrong, cases] of wrongs) {
    assert.ok(cases.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    const hidden = cases.filter((t) => problem.hiddenTests.includes(t));
    assert.ok(hidden.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects bad grids', () => {
  assert.deepEqual(problem.parseCustomInput('[[0,1],[1,0]]').args, [[[0, 1], [1, 0]]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,0]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,2],[0,0]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,0],[0]]').ok, false);
  assert.equal(problem.parseCustomInput('[0]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
