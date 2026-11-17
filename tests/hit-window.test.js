import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/hit-window/problem.js';

// Brute force: count, on every query, the stored hits inside (t - 300, t].
// Independent of the reference's binary search.
function brute(ops, args) {
  const hits = [];
  return ops.map((op, i) => {
    const t = args[i][0];
    if (op === 'hit') hits.push(t);
    return op === 'getHits' ? hits.filter((h) => h > t - 300 && h <= t).length : null;
  });
}

test('reference matches brute force on 1000 random sessions', () => {
  const rnd = mulberry32(101);
  for (let s = 0; s < 1000; s++) {
    const ops = ['HitCounter'];
    const args = [[]];
    let now = 1;
    const maxStep = [1, 50, 400][s % 3];
    for (let i = 0; i < 40; i++) {
      now += Math.floor(rnd() * maxStep);
      ops.push(rnd() < 0.6 ? 'hit' : 'getHits');
      args.push([now]);
    }
    assert.deepEqual(reference(ops, args), brute(ops, args));
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests.slice(0, 6)) assert.deepEqual(t.expected, brute(...t.args));
  // Max-size sessions; one with 10^5 hits inside a single window, all of them counted.
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 200001);
  assert.ok(big.length >= 2);
  assert.ok(big.some((t) => t.expected.includes(100000)));
  assert.ok(problem.hiddenTests.some((t) => t.args[1].some((a) => a[0] === 2000000000)));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
});

test('custom input parser rejects invalid sessions', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['HitCounter', 'hit', 'getHits'], [[], [1], [1]]), true);
  assert.equal(ok(['HitCounter', 'hit', 'getHits'], [[], [5], [4]]), false);
  assert.equal(ok(['HitCounter', 'hit'], [[], [0]]), false);
  assert.equal(ok(['HitCounter', 'hit'], [[], [2000000001]]), false);
  assert.equal(ok(['HitCounter', 'hit'], [[], []]), false);
  assert.equal(ok(['HitCounter', 'reset'], [[], [1]]), false);
  assert.equal(ok(['Counter'], [[]]), false);
  assert.equal(problem.parseCustomInput('["HitCounter"]').ok, false);
});
