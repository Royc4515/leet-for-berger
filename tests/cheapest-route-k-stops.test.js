import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/cheapest-route-k-stops/problem.js';

// Brute force: walk every route of at most k + 1 flights from src and keep the cheapest that
// ends at dst.
function brute(n, flights, src, dst, k) {
  let best = Infinity;
  const walk = (city, cost, used) => {
    if (city === dst) best = Math.min(best, cost);
    if (used === k + 1) return;
    for (const [f, t, p] of flights) if (f === city) walk(t, cost + p, used + 1);
  };
  walk(src, 0, 0);
  return best === Infinity ? -1 : best;
}

const asInput = (args) => [args[0], JSON.stringify(args[1]), args[2], args[3], args[4]].join('\n');

test('reference matches brute force on 1500 random graphs, both outcomes represented', () => {
  const rnd = mulberry32(1201);
  let none = 0;
  for (let i = 0; i < 1500; i++) {
    const n = 2 + Math.floor(rnd() * 4);
    const flights = [];
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) if (u !== v && rnd() < 0.4) flights.push([u, v, 1 + Math.floor(rnd() * 20)]);
    }
    const src = Math.floor(rnd() * n);
    let dst = Math.floor(rnd() * n);
    if (dst === src) dst = (src + 1) % n;
    const k = Math.floor(rnd() * n);
    const want = brute(n, flights, src, dst, k);
    assert.equal(reference(n, flights, src, dst, k), want);
    if (want === -1) none++;
  }
  assert.ok(none > 100 && none < 1200);
});

test('visible expectations agree; three 100-city cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] === 100).length >= 3);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(asInput(t.args)).ok, true);
});

test('hidden traps: Dijkstra on cost alone and in-place relaxation both fail', () => {
  // Dijkstra that closes a city on its cheapest cost: city 2 is first reached via 0 -> 1 -> 2
  // (2 flights), too many to continue to 3 with k = 1.
  assert.equal(problem.hiddenTests[0].expected, 6);
  // In-place relaxation walks the whole 0 -> 1 -> 2 -> 3 -> 4 chain in one round.
  assert.equal(problem.hiddenTests[1].expected, 100);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('3\n[[0,1,5]]\n0\n1').ok, false);
  assert.equal(problem.parseCustomInput('1\n[]\n0\n0\n0').ok, false);
  assert.equal(problem.parseCustomInput('3\n[[0,0,5]]\n0\n1\n0').ok, false);
  assert.equal(problem.parseCustomInput('3\n[[0,1,5],[0,1,6]]\n0\n1\n0').ok, false);
  assert.equal(problem.parseCustomInput('3\n[[0,1,0]]\n0\n1\n0').ok, false);
  assert.equal(problem.parseCustomInput('3\n[[0,1,5]]\n0\n0\n0').ok, false);
  assert.equal(problem.parseCustomInput('3\n[[0,1,5]]\n0\n1\n3').ok, false);
  assert.deepEqual(problem.parseCustomInput('3\n[[0,1,5],[1,2,5]]\n0\n2\n1').args, [3, [[0, 1, 5], [1, 2, 5]], 0, 2, 1]);
});
