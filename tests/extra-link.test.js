import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/extra-link/problem.js';

// Brute force: from the back, remove each link and check that the rest connects all n nodes.
function brute(edges) {
  const n = edges.length;
  for (let skip = n - 1; skip >= 0; skip--) {
    const adj = Array.from({ length: n + 1 }, () => []);
    edges.forEach(([a, b], i) => {
      if (i === skip) return;
      adj[a].push(b);
      adj[b].push(a);
    });
    const seen = new Set([1]);
    const stack = [1];
    while (stack.length) for (const v of adj[stack.pop()]) if (!seen.has(v)) seen.add(v), stack.push(v);
    if (seen.size === n) return edges[skip];
  }
  return null;
}

/** Random tree on n nodes plus one extra distinct link, shuffled, each link written [small, big]. */
function randomCase(rnd, n) {
  const edges = [];
  const seen = new Set();
  const add = (a, b) => {
    const e = a < b ? [a, b] : [b, a];
    if (a === b || seen.has(e.join())) return false;
    seen.add(e.join());
    edges.push(e);
    return true;
  };
  for (let v = 2; v <= n; v++) add(v, 1 + Math.floor(rnd() * (v - 1)));
  while (!add(1 + Math.floor(rnd() * n), 1 + Math.floor(rnd() * n)));
  // Relabel and shuffle so node 1 is not always the root.
  const label = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = n; i > 1; i--) {
    const j = 1 + Math.floor(rnd() * i);
    [label[i], label[j]] = [label[j], label[i]];
  }
  for (let i = edges.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [edges[i], edges[j]] = [edges[j], edges[i]];
  }
  return edges.map(([a, b]) => [Math.min(label[a], label[b]), Math.max(label[a], label[b])]);
}

test('reference matches brute force on 2000 random cases', () => {
  const rnd = mulberry32(88);
  for (let i = 0; i < 2000; i++) {
    const edges = randomCase(rnd, 3 + Math.floor(rnd() * 10));
    assert.deepEqual(reference(edges), brute(edges));
  }
});

test('visible expectations agree; at least two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  // Some hidden answer must not be the last link, so "return the last link" fails.
  assert.ok(problem.hiddenTests.some((t) => t.expected.join() !== t.args[0][t.args[0].length - 1].join()));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[[1,2],[2,3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[2,3],[3,4]]').ok, false);
  assert.equal(problem.parseCustomInput('[[2,1],[2,3],[1,3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[1,2],[2,3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[1,3],[2,3],[1,4],[2,4],[3,4]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[2,3],[1,3],[5,6],[4,6],[4,5]]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[[1,2],[1,3],[2,3]]').args, [[[1, 2], [1, 3], [2, 3]]]);
});
