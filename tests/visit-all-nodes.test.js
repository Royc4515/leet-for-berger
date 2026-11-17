import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/visit-all-nodes/problem.js';

// Brute force: all-pairs shortest paths, then every order of the nodes; the shortest walk
// visiting them all is the cheapest order summed over consecutive distances.
function brute(n, edges) {
  const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const [a, b] of edges) d[a][b] = d[b][a] = 1;
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
  let best = Infinity;
  const used = new Array(n).fill(false);
  const go = (last, count, cost) => {
    if (cost >= best) return;
    if (count === n) {
      best = cost;
      return;
    }
    for (let v = 0; v < n; v++) {
      if (used[v]) continue;
      used[v] = true;
      go(v, count + 1, last === -1 ? 0 : cost + d[last][v]);
      used[v] = false;
    }
  };
  go(-1, 0, 0);
  return best;
}

const asInput = (args) => `${args[0]}\n${JSON.stringify(args[1])}`;

test('reference matches brute force on 1500 random connected graphs', () => {
  const rnd = mulberry32(1209);
  for (let i = 0; i < 1500; i++) {
    const n = 1 + Math.floor(rnd() * 7);
    const edges = [];
    const has = new Set();
    // A random tree keeps the graph connected; extra edges are added on top.
    for (let v = 1; v < n; v++) {
      const u = Math.floor(rnd() * v);
      edges.push([u, v]);
      has.add(u * n + v);
    }
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) if (!has.has(a * n + b) && rnd() < 0.2) edges.push([b, a]);
    }
    assert.equal(reference(n, edges), brute(n, edges));
  }
});

test('visible expectations agree; four 12-node cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] === 12).length >= 4);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(asInput(t.args)).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('3').ok, false);
  assert.equal(problem.parseCustomInput('13\n[]').ok, false);
  assert.equal(problem.parseCustomInput('3\n[[0,1]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[0,1],[1,0]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[0,0]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[0,2]]').ok, false);
  assert.deepEqual(problem.parseCustomInput('1\n[]').args, [1, []]);
  assert.deepEqual(problem.parseCustomInput('2\n[[1,0]]').args, [2, [[1, 0]]]);
});
