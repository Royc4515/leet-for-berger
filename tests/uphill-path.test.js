import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/uphill-path/problem.js';

// Brute force: unmemoized depth-first search from every cell. Exponential, fine on tiny grids,
// and independent of the sorted-order reference.
function brute(g) {
  const m = g.length;
  const n = g[0].length;
  const from = (i, j) => {
    let best = 1;
    for (const [x, y] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (x >= 0 && x < m && y >= 0 && y < n && g[x][y] > g[i][j]) best = Math.max(best, 1 + from(x, y));
    }
    return best;
  };
  let answer = 0;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) answer = Math.max(answer, from(i, j));
  return answer;
}

test('reference matches brute force on 1500 random small grids', () => {
  const rnd = mulberry32(337);
  for (let t = 0; t < 1500; t++) {
    const m = 1 + Math.floor(rnd() * 4);
    const n = 1 + Math.floor(rnd() * 4);
    const hi = t % 3 === 0 ? 3 : 20;
    const g = Array.from({ length: m }, () => Array.from({ length: n }, () => Math.floor(rnd() * hi)));
    assert.equal(reference(g), brute(g), JSON.stringify(g));
  }
});

test('visible expectations agree; 15 valid cases; 200 x 200 grids incl. a 40,000-cell path', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  const full = problem.hiddenTests.filter((t) => t.args[0].length === 200 && t.args[0][0].length === 200);
  assert.ok(full.length >= 2);
  assert.ok(full.filter((t) => t.expected === 40000).length >= 2, 'recursion depth trap');
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[[1,2],[4,3]]').args, [[[1, 2], [4, 3]]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[-1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[2147483648]]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify([Array(201).fill(0)])).ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
});
