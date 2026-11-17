import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/course-check/problem.js';

// Brute force: transitive closure (Floyd-Warshall on booleans); a cycle exists exactly when some
// course can reach itself.
function brute(n, pairs) {
  const reach = Array.from({ length: n }, () => Array(n).fill(false));
  for (const [a, b] of pairs) reach[b][a] = true;
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) if (reach[i][k]) for (let j = 0; j < n; j++) if (reach[k][j]) reach[i][j] = true;
  return reach.every((row, i) => !row[i]);
}

function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 7);
  const seen = new Set();
  const pairs = [];
  const tries = Math.floor(rnd() * 12);
  for (let t = 0; t < tries; t++) {
    const a = Math.floor(rnd() * n);
    const b = Math.floor(rnd() * n);
    // Self-pairs are rarer so most cases are not trivially cyclic.
    if (a === b && rnd() < 0.8) continue;
    if (seen.has(`${a},${b}`)) continue;
    seen.add(`${a},${b}`);
    pairs.push([a, b]);
  }
  return [n, pairs];
}

test('reference matches brute force on 3000 random graphs, both answers well represented', () => {
  const rnd = mulberry32(82);
  let yes = 0;
  for (let i = 0; i < 3000; i++) {
    const [n, pairs] = randomCase(rnd);
    const want = brute(n, pairs);
    assert.equal(reference(n, pairs), want);
    if (want) yes++;
  }
  assert.ok(yes > 500 && yes < 2500);
});

test('visible expectations agree; two max-size cases; both answers hidden; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0] === 100000);
  assert.ok(big.length >= 2 && big.some((t) => t.expected) && big.some((t) => !t.expected));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${t.args[0]}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('2').ok, false);
  assert.equal(problem.parseCustomInput('0\n[]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[1,0],[1,0]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[1]]').ok, false);
  assert.equal(problem.parseCustomInput('100001\n[]').ok, false);
  assert.deepEqual(problem.parseCustomInput('2\n[[1,0]]').args, [2, [[1, 0]]]);
  assert.deepEqual(problem.parseCustomInput('1\n[[0,0]]').args, [1, [[0, 0]]]);
});
