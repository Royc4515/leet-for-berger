import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/point-wiring/problem.js';

// Brute force: Kruskal's algorithm over the explicit list of every pair, a different MST method
// from the reference's Prim.
function brute(points) {
  const n = points.length;
  const edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) edges.push([Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]), i, j]);
  }
  edges.sort((a, b) => a[0] - b[0]);
  const parent = points.map((_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  let total = 0;
  for (const [w, a, b] of edges) {
    if (find(a) === find(b)) continue;
    parent[find(a)] = find(b);
    total += w;
  }
  return total;
}

test('reference matches Kruskal on 1500 random point sets', () => {
  const rnd = mulberry32(1204);
  for (let i = 0; i < 1500; i++) {
    const n = 1 + Math.floor(rnd() * 9);
    const range = 1 + Math.floor(rnd() * 20);
    const seen = new Set();
    const points = [];
    while (points.length < n) {
      const p = [Math.floor(rnd() * (2 * range + 1)) - range, Math.floor(rnd() * (2 * range + 1)) - range];
      if (!seen.has(p.join())) {
        seen.add(p.join());
        points.push(p);
      }
    }
    assert.equal(reference(points), brute(points));
  }
});

test('visible expectations agree; four 1000-point cases match Kruskal; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 1000);
  assert.ok(big.length >= 4);
  for (const t of big) assert.equal(t.expected, brute(t.args[0]));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,0],[0,0]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,1000001]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,1,2]]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array.from({ length: 1001 }, (_, i) => [i, 0]))).ok, false);
  assert.deepEqual(problem.parseCustomInput('[[0,0],[1,1]]').args, [[[0, 0], [1, 1]]]);
});
