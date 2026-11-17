import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/signal-spread/problem.js';

// Brute force: Bellman-Ford, relaxing every link n times.
function brute(times, n, k) {
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  for (let round = 0; round < n; round++) {
    for (const [u, v, w] of times) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  }
  const worst = Math.max(...dist.slice(1));
  return worst === Infinity ? -1 : worst;
}

const asInput = (args) => [JSON.stringify(args[0]), args[1], args[2]].join('\n');

test('reference matches brute force on 2000 random graphs, both outcomes represented', () => {
  const rnd = mulberry32(1203);
  let none = 0;
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 6);
    const times = [];
    const e = Math.floor(rnd() * 12);
    for (let j = 0; j < e && n > 1; j++) {
      const u = 1 + Math.floor(rnd() * n);
      const v = 1 + Math.floor(rnd() * n);
      if (u !== v) times.push([u, v, Math.floor(rnd() * 10)]);
    }
    const k = 1 + Math.floor(rnd() * n);
    const want = brute(times, n, k);
    assert.equal(reference(times, n, k), want);
    if (want === -1) none++;
  }
  assert.ok(none > 200 && none < 1800);
});

test('visible expectations agree; two 10^5-node cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[1] === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(asInput(t.args)).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[[1,2,3]]\n2').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2,3]]\n2\n3').ok, false);
  assert.equal(problem.parseCustomInput('[[1,1,3]]\n2\n1').ok, false);
  assert.equal(problem.parseCustomInput('[[0,1,3]]\n2\n1').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2,-1]]\n2\n1').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2,10001]]\n2\n1').ok, false);
  assert.equal(problem.parseCustomInput('[]\n0\n1').ok, false);
  assert.deepEqual(problem.parseCustomInput('[[1,2,0]]\n2\n1').args, [[[1, 2, 0]], 2, 1]);
});
