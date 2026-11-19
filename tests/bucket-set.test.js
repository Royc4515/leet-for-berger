import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/bucket-set/problem.js';

// Brute force: one flat array of keys, scanned on every call. Independent of the reference's Set.
function brute(ops, args) {
  const keys = [];
  return ops.map((op, i) => {
    const key = args[i][0];
    const at = op === 'MyHashSet' ? -1 : keys.indexOf(key);
    if (op === 'add') {
      if (at < 0) keys.push(key);
    } else if (op === 'remove') {
      if (at >= 0) keys.splice(at, 1);
    } else if (op === 'contains') {
      return at >= 0;
    }
    return null;
  });
}

test('reference matches brute force on 1000 random sessions', () => {
  const rnd = mulberry32(705);
  for (let s = 0; s < 1000; s++) {
    const ops = ['MyHashSet'];
    const args = [[]];
    const keys = 1 + Math.floor(rnd() * 8);
    for (let i = 0; i < 40; i++) {
      const r = rnd();
      ops.push(r < 0.4 ? 'add' : r < 0.8 ? 'contains' : 'remove');
      args.push([Math.floor(rnd() * keys) * 1024]);
    }
    assert.deepEqual(reference(ops, args), brute(ops, args));
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests.slice(0, 6)) assert.deepEqual(t.expected, brute(...t.args));
  // Sessions of 2 * 10^5 calls with tens of thousands of distinct keys: a flat list is far too
  // slow. One of them uses only multiples of 1024.
  const distinct = (t) => new Set(t.args[1].slice(1).map((a) => a[0])).size;
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 200001 && distinct(t) >= 50000);
  assert.ok(big.length >= 3);
  assert.ok(big.some((t) => t.args[1].slice(1).every((a) => a[0] % 1024 === 0)));
  for (const t of big) assert.ok(t.expected.includes(true) && t.expected.includes(false));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
});

test('a key added twice is gone after one remove', () => {
  assert.deepEqual(reference(['MyHashSet', 'add', 'add', 'remove', 'contains'], [[], [4], [4], [4], [4]]), [null, null, null, null, false]);
});

test('custom input parser rejects invalid sessions', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['MyHashSet', 'add', 'contains', 'remove'], [[], [1], [1], [1]]), true);
  assert.equal(ok(['MyHashSet', 'add'], [[], [1000000001]]), false);
  assert.equal(ok(['MyHashSet', 'contains'], [[], [-1]]), false);
  assert.equal(ok(['MyHashSet', 'add'], [[], [1, 2]]), false);
  assert.equal(ok(['MyHashSet', 'remove'], [[], []]), false);
  assert.equal(ok(['MyHashSet', 'clear'], [[], []]), false);
  assert.equal(ok(['HashSet'], [[]]), false);
  assert.equal(problem.parseCustomInput('["MyHashSet"]').ok, false);
});
