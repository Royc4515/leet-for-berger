import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/versioned-store/problem.js';

// Brute force: keep every set call; a get scans all of them for the latest matching one.
// Independent of the reference's per-key binary search.
function brute(ops, args) {
  const history = [];
  return ops.map((op, i) => {
    if (op === 'set') history.push(args[i]);
    if (op !== 'get') return null;
    const [key, time] = args[i];
    let best = null;
    for (const [k, v, t] of history) if (k === key && t <= time && (best === null || t > best[1])) best = [v, t];
    return best ? best[0] : '';
  });
}

test('reference matches brute force on 1000 random sessions', () => {
  const rnd = mulberry32(89);
  for (let s = 0; s < 1000; s++) {
    const ops = ['TimeMap'];
    const args = [[]];
    const keys = ['a', 'b', 'c'].slice(0, 1 + Math.floor(rnd() * 3));
    let now = 0;
    for (let i = 0; i < 30; i++) {
      const key = keys[Math.floor(rnd() * keys.length)];
      if (rnd() < 0.5) {
        now += 1 + Math.floor(rnd() * 3);
        ops.push('set');
        args.push([key, `v${i}`, now]);
      } else {
        ops.push('get');
        args.push([key, 1 + Math.floor(rnd() * (now + 3))]);
      }
    }
    assert.deepEqual(reference(ops, args), brute(ops, args));
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests.slice(0, 6)) assert.deepEqual(t.expected, brute(...t.args));
  // At least two sessions of 2 * 10^5 calls, one of them a single key with 10^5 versions.
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 200001);
  assert.ok(big.length >= 2);
  assert.ok(big.some((t) => new Set(t.args[1].slice(1).map((a) => a[0])).size === 1));
  // Both found values and empty answers occur among the hidden tests.
  const answers = problem.hiddenTests.flatMap((t) => t.expected).filter((v) => v !== null);
  assert.ok(answers.includes('') && answers.some((v) => v !== ''));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
});

test('custom input parser rejects invalid sessions', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['TimeMap', 'set', 'get'], [[], ['a', 'b', 1], ['a', 1]]), true);
  assert.equal(ok(['TimeMap', 'set', 'set'], [[], ['a', 'b', 2], ['c', 'd', 2]]), false);
  assert.equal(ok(['TimeMap', 'set'], [[], ['a', 'b', 0]]), false);
  assert.equal(ok(['TimeMap', 'set'], [[], ['A', 'b', 1]]), false);
  assert.equal(ok(['TimeMap', 'set'], [[], ['', 'b', 1]]), false);
  assert.equal(ok(['TimeMap', 'get'], [[], ['a', 10000001]]), false);
  assert.equal(ok(['TimeMap', 'get'], [[], ['a']]), false);
  assert.equal(ok(['TimeMap', 'put'], [[], ['a', 1]]), false);
  assert.equal(ok(['TimeMap'], [[1]]), false);
  assert.equal(problem.parseCustomInput('["TimeMap"]').ok, false);
});
