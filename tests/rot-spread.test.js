import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/rot-spread/problem.js';

// Brute force: rescan the grid every minute. Independent of the BFS reference.
function brute(grid) {
  let g = grid.map((row) => row.slice());
  let minutes = 0;
  for (;;) {
    const next = g.map((row) => row.slice());
    let changed = false;
    for (let r = 0; r < g.length; r++) {
      for (let c = 0; c < g[0].length; c++) {
        if (g[r][c] !== 1) continue;
        const touched = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([a, b]) => g[a]?.[b] === 2);
        if (touched) {
          next[r][c] = 2;
          changed = true;
        }
      }
    }
    if (!changed) break;
    g = next;
    minutes++;
  }
  return g.some((row) => row.includes(1)) ? -1 : minutes;
}

// Classic wrong answer: BFS from the first rotten cell only.
function firstSourceOnly(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const dist = grid.map((row) => row.map(() => -1));
  const queue = [];
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) {
        dist[r][c] = 0;
        queue.push([r, c]);
        break outer;
      }
    }
  }
  let best = 0;
  for (let h = 0; h < queue.length; h++) {
    const [r, c] = queue[h];
    for (const [a, b] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      if (a < 0 || b < 0 || a >= rows || b >= cols || grid[a][b] === 0 || dist[a][b] !== -1) continue;
      dist[a][b] = dist[r][c] + 1;
      best = Math.max(best, dist[a][b]);
      queue.push([a, b]);
    }
  }
  const stuck = grid.some((row, r) => row.some((v, c) => v === 1 && dist[r][c] === -1));
  return stuck ? -1 : best;
}

// Classic wrong answer: returns the last minute reached and never reports unreachable fruit.
function ignoresUnreachable(grid) {
  const r = reference(grid);
  if (r !== -1) return r;
  // The same BFS without the final check: the minutes of the waves that did happen.
  const g = grid.map((row) => row.map((v) => (v === 1 ? 1 : v)));
  let minutes = 0;
  for (;;) {
    const flip = [];
    for (let i = 0; i < g.length; i++) {
      for (let j = 0; j < g[0].length; j++) {
        if (g[i][j] === 1 && [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].some(([a, b]) => g[a]?.[b] === 2)) flip.push([i, j]);
      }
    }
    if (!flip.length) return minutes;
    for (const [i, j] of flip) g[i][j] = 2;
    minutes++;
  }
}

// Classic wrong answer: counts the last wave, which rots nothing, as a minute.
function countsEmptyWave(grid) {
  const r = reference(grid);
  return r > 0 ? r + 1 : r;
}

function randomGrid(rnd, rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.floor(rnd() * 3)));
}

test('reference matches brute force on 2000 random grids', () => {
  const rnd = mulberry32(994);
  for (let i = 0; i < 2000; i++) {
    const grid = randomGrid(rnd, 1 + Math.floor(rnd() * 7), 1 + Math.floor(rnd() * 7));
    assert.equal(reference(grid), brute(grid), JSON.stringify(grid));
  }
});

test('reference matches brute force on sparse grids with long paths', () => {
  const rnd = mulberry32(995);
  for (let i = 0; i < 300; i++) {
    const rows = 5 + Math.floor(rnd() * 8);
    const cols = 5 + Math.floor(rnd() * 8);
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rnd() < 0.08 ? 2 : rnd() < 0.85 ? 1 : 0)));
    assert.equal(reference(grid), brute(grid), JSON.stringify(grid));
  }
});

test('visible expectations agree; 15 valid cases; two 300 x 300 grids', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length * t.args[0][0].length >= 90000).length >= 2);
  // The snake forces tens of thousands of minutes, so per-minute rescans cannot pass at full size.
  assert.ok(problem.hiddenTests.some((t) => t.expected > 40000));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [firstSourceOnly, ignoresUnreachable, countsEmptyWave]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects malformed grids', () => {
  assert.deepEqual(problem.parseCustomInput('[[2,1],[0,1]]').args, [[[2, 1], [0, 1]]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[]]').ok, false);
  assert.equal(problem.parseCustomInput('[[2,1],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1.5]]').ok, false);
  assert.equal(problem.parseCustomInput('[2,1]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
