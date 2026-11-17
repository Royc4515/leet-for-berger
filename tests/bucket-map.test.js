import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/bucket-map/problem.js';

// Brute force: one flat list of [key, value] pairs, scanned on every call.
// Independent of the reference's Map.
function brute(ops, args) {
  const pairs = [];
  return ops.map((op, i) => {
    const key = args[i][0];
    const at = op === 'MyHashMap' ? -1 : pairs.findIndex((p) => p[0] === key);
    if (op === 'put') {
      if (at >= 0) pairs[at][1] = args[i][1];
      else pairs.push([key, args[i][1]]);
    } else if (op === 'remove') {
      if (at >= 0) pairs.splice(at, 1);
    } else if (op === 'get') {
      return at >= 0 ? pairs[at][1] : -1;
    }
    return null;
  });
}

test('reference matches brute force on 1000 random sessions', () => {
  const rnd = mulberry32(97);
  for (let s = 0; s < 1000; s++) {
    const ops = ['MyHashMap'];
    const args = [[]];
    const keys = 1 + Math.floor(rnd() * 8);
    for (let i = 0; i < 40; i++) {
      const key = Math.floor(rnd() * keys) * 1024;
      const r = rnd();
      if (r < 0.4) {
        ops.push('put');
        args.push([key, Math.floor(rnd() * 5)]);
      } else if (r < 0.8) {
        ops.push('get');
        args.push([key]);
      } else {
        ops.push('remove');
        args.push([key]);
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
  // Sessions of 2 * 10^5 calls with tens of thousands of distinct keys: a flat list of pairs is
  // far too slow. One of them uses only multiples of 1024.
  const distinct = (t) => new Set(t.args[1].slice(1).map((a) => a[0])).size;
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 200001 && distinct(t) >= 50000);
  assert.ok(big.length >= 2);
  assert.ok(big.some((t) => t.args[1].slice(1).every((a) => a[0] % 1024 === 0)));
  for (const t of big) assert.ok(t.expected.some((v) => v !== null && v >= 0) && t.expected.includes(-1));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
});

test('custom input parser rejects invalid sessions', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['MyHashMap', 'put', 'get', 'remove'], [[], [1, 2], [1], [1]]), true);
  assert.equal(ok(['MyHashMap', 'put'], [[], [1000000001, 1]]), false);
  assert.equal(ok(['MyHashMap', 'put'], [[], [1, -1]]), false);
  assert.equal(ok(['MyHashMap', 'get'], [[], [-1]]), false);
  assert.equal(ok(['MyHashMap', 'remove'], [[], []]), false);
  assert.equal(ok(['MyHashMap', 'clear'], [[], []]), false);
  assert.equal(ok(['HashMap'], [[]]), false);
  assert.equal(problem.parseCustomInput('["MyHashMap"]').ok, false);
});
