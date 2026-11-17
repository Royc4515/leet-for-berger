import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/limited-paths/problem.js';

// Brute force: a separate search per query over the edges strictly shorter than its limit.
function brute(n, edges, queries) {
  return queries.map(([p, q, limit]) => {
    const adj = Array.from({ length: n }, () => []);
    for (const [u, v, w] of edges) {
      if (w < limit) {
        adj[u].push(v);
        adj[v].push(u);
      }
    }
    const seen = new Set([p]);
    const stack = [p];
    while (stack.length) for (const v of adj[stack.pop()]) if (!seen.has(v)) seen.add(v), stack.push(v);
    return seen.has(q);
  });
}

test('reference matches brute force on 1500 random graphs, both answers represented', () => {
  const rnd = mulberry32(90);
  let yes = 0;
  let total = 0;
  for (let i = 0; i < 1500; i++) {
    const n = 2 + Math.floor(rnd() * 7);
    const maxW = 1 + Math.floor(rnd() * 8);
    const pair = () => {
      const a = Math.floor(rnd() * n);
      let b = Math.floor(rnd() * (n - 1));
      if (b >= a) b++;
      return [a, b];
    };
    const edges = Array.from({ length: 1 + Math.floor(rnd() * 10) }, () => [...pair(), 1 + Math.floor(rnd() * maxW)]);
    const queries = Array.from({ length: 1 + Math.floor(rnd() * 8) }, () => [...pair(), 1 + Math.floor(rnd() * (maxW + 1))]);
    const want = brute(n, edges, queries);
    assert.deepEqual(reference(n, edges, queries), want);
    yes += want.filter(Boolean).length;
    total += want.length;
  }
  assert.ok(yes > total * 0.2 && yes < total * 0.8);
});

test('visible expectations agree; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0] === 100000 && t.args[2].length === 100000);
  assert.ok(big.length >= 2);
  for (const t of big) assert.ok(t.expected.some(Boolean) && t.expected.some((x) => !x));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(t.args.map((a) => JSON.stringify(a)).join('\n')).ok, true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('2\n[[0,1,1]]').ok, false);
  assert.equal(problem.parseCustomInput('1\n[[0,1,1]]\n[[0,1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[]\n[[0,1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[0,0,1]]\n[[0,1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[0,1,0]]\n[[0,1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[0,1,1]]\n[[0,2,2]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[0,1,1]]\n[[0,1,1000000001]]').ok, false);
  assert.deepEqual(problem.parseCustomInput('2\n[[0,1,1]]\n[[1,0,2]]').args, [2, [[0, 1, 1]], [[1, 0, 2]]]);
});
