import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/undo-running-xor/problem.js';

// Brute force: at each index, find the one value whose XOR with the prefix of the answer so far
// gives pref[i], by trying every bit pattern up to a bound (small values only). Independent of
// the neighbor-XOR identity.
function brute(pref) {
  const arr = [];
  for (let i = 0; i < pref.length; i++) {
    let running = 0;
    for (const v of arr) running ^= v;
    let found = -1;
    for (let c = 0; c < 64; c++) {
      if ((running ^ c) === pref[i]) found = c;
    }
    arr.push(found);
  }
  return arr;
}

// Same idea without the value bound: recompute the prefix of the answer for every index.
function rebuildEveryPrefix(pref) {
  const arr = [];
  for (let i = 0; i < pref.length; i++) {
    let running = 0;
    for (const v of arr) running ^= v;
    arr.push(pref[i] ^ running);
  }
  return arr;
}

// Classic wrong answers.
const xorWithPreviousAnswer = (pref) => {
  const arr = [pref[0]];
  for (let i = 1; i < pref.length; i++) arr.push(pref[i] ^ arr[i - 1]);
  return arr;
};
const subtract = (pref) => pref.map((v, i) => (i === 0 ? v : v - pref[i - 1]));

// The forward direction: running XORs of arr.
function prefixXor(arr) {
  let run = 0;
  return arr.map((v) => (run ^= v));
}

test('reference matches brute force on 1500 seeded small arrays', () => {
  const rnd = mulberry32(2433);
  for (let i = 0; i < 1500; i++) {
    const n = 1 + Math.floor(rnd() * 10);
    const pref = Array.from({ length: n }, () => Math.floor(rnd() * 64));
    assert.deepEqual(reference(pref), brute(pref), JSON.stringify(pref));
  }
});

test('reference matches the O(n^2) rebuild and round-trips through prefix XOR on large values', () => {
  const rnd = mulberry32(2434);
  for (let i = 0; i < 300; i++) {
    const n = 1 + Math.floor(rnd() * 40);
    const pref = Array.from({ length: n }, () => Math.floor(rnd() * 1000000001));
    const arr = reference(pref);
    assert.deepEqual(arr, rebuildEveryPrefix(pref));
    assert.deepEqual(prefixXor(arr), pref);
  }
});

test('visible expectations agree; 15 valid cases; five arrays at 10^5 elements', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(prefixXor(t.expected), t.args[0]);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.deepEqual(prefixXor(t.expected), t.args[0]);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [xorWithPreviousAnswer, subtract]) {
    assert.ok(suite.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects malformed arrays', () => {
  assert.deepEqual(problem.parseCustomInput('[5, 2, 0]').args, [[5, 2, 0]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('5').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
