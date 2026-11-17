import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/two-color-check/problem.js';

// Brute force: try all 2^n splits and check every edge.
function brute(graph) {
  const n = graph.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let u = 0; u < n && ok; u++) for (const v of graph[u]) if (((mask >> u) & 1) === ((mask >> v) & 1)) ok = false;
    if (ok) return true;
  }
  return false;
}

function randomGraph(rnd) {
  const n = 1 + Math.floor(rnd() * 9);
  const g = Array.from({ length: n }, () => []);
  const p = rnd() * 0.5;
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      if (rnd() < p) {
        g[a].push(b);
        g[b].push(a);
      }
  return g;
}

test('reference matches brute force on 3000 random graphs, both answers represented', () => {
  const rnd = mulberry32(87);
  let yes = 0;
  for (let i = 0; i < 3000; i++) {
    const g = randomGraph(rnd);
    const want = brute(g);
    assert.equal(reference(g), want);
    if (want) yes++;
  }
  assert.ok(yes > 600 && yes < 2400);
});

test('visible expectations agree; two max-size cases with both answers; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0].length >= 99999);
  assert.ok(big.length >= 2 && big.some((t) => t.expected) && big.some((t) => !t.expected));
  // Odd cycle away from node 0, with node 0 isolated: a start-at-0-only coloring says true.
  assert.equal(problem.hiddenTests[0].expected, false);
  assert.equal(problem.hiddenTests[0].args[0][0].length, 0);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[1],[]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,1],[0]]').ok, false);
  assert.equal(problem.parseCustomInput('[[2],[0]]').ok, false);
  assert.equal(problem.parseCustomInput('[1,0]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[[1],[0]]').args, [[[1], [0]]]);
});
