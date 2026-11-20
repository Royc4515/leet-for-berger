import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/zero-by-powers/problem.js';

// Brute force: one breadth-first search from 0 over [0, LIMIT]. Moves are symmetric (+-2^k), so
// the distance from 0 to n is the distance from n to 0. Independent of the bit rule.
const LIMIT = 1 << 17;
const dist = new Int32Array(LIMIT + 1).fill(-1);
dist[0] = 0;
for (let queue = [0], d = 0; queue.length; d++) {
  const next = [];
  for (const v of queue) {
    for (let p = 1; p <= LIMIT; p *= 2) {
      for (const w of [v + p, v - p]) {
        if (w >= 0 && w <= LIMIT && dist[w] === -1) {
          dist[w] = d + 1;
          next.push(w);
        }
      }
    }
  }
  queue = next;
}
const brute = (n) => dist[n];

// Classic wrong answer: count the 1 bits.
function popcount(n) {
  let c = 0;
  for (; n; n &= n - 1) c++;
  return c;
}

// Classic wrong answer: always subtract the largest power of two that fits.
function largestFit(n) {
  let steps = 0;
  while (n > 0) {
    n -= 2 ** Math.floor(Math.log2(n));
    steps++;
  }
  return steps;
}

test('reference matches the breadth-first brute force for every n up to 20000', () => {
  for (let n = 1; n <= 20000; n++) assert.equal(reference(n), brute(n), String(n));
});

test('reference matches brute force on 2000 seeded values up to 2^16', () => {
  const rnd = mulberry32(2571);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 65535);
    assert.equal(reference(n), brute(n), String(n));
  }
});

test('visible expectations agree; 15 valid cases; maximum values present', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] >= 999999999).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [popcount, largestFit]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('the carry rule stays inside a 32-bit int at the maximum', () => {
  // n + 1 is the largest intermediate value the rule creates.
  assert.ok(1000000000 + 1 < 2 ** 31);
  assert.ok(reference(1000000000) > 0);
});

test('custom input parser rejects out-of-range and malformed values', () => {
  assert.deepEqual(problem.parseCustomInput(' 39 ').args, [39]);
  assert.equal(problem.parseCustomInput('0').ok, false);
  assert.equal(problem.parseCustomInput('1000000001').ok, false);
  assert.equal(problem.parseCustomInput('-5').ok, false);
  assert.equal(problem.parseCustomInput('3.5').ok, false);
  assert.equal(problem.parseCustomInput('abc').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
});
