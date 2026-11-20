import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/list-mirror/problem.js';

// Brute force: build the reversed list as a string and compare. Independent of the two pointers.
function brute(values) {
  const forward = values.join(',');
  const backward = [...values].reverse().join(',');
  return forward === backward;
}

// Classic wrong answer: only the two ends.
const endsOnly = (values) => values[0] === values[values.length - 1];

// Classic wrong answer: same counts of every value.
function sameCounts(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  // A palindrome has at most one value with an odd count.
  return [...counts.values()].filter((c) => c % 2 === 1).length <= 1;
}

// Classic wrong answer: the digits as one number against the digits reversed.
function asNumber(values) {
  return Number(values.join('')) === Number([...values].reverse().join(''));
}

test('reference matches brute force on 3000 random lists', () => {
  const rnd = mulberry32(234);
  let palindromes = 0;
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 9);
    const range = 1 + Math.floor(rnd() * 3);
    let values = Array.from({ length: n }, () => Math.floor(rnd() * range));
    // Half the cases are made palindromes first, some of them then damaged by one digit.
    if (i % 2 === 0) {
      values = [...values.slice(0, Math.ceil(n / 2)), ...values.slice(0, Math.floor(n / 2)).reverse()];
      if (rnd() < 0.5) values[Math.floor(rnd() * n)] = Math.floor(rnd() * 3);
    }
    const expected = brute(values);
    assert.equal(reference(values), expected, JSON.stringify(values));
    if (expected) palindromes++;
  }
  assert.ok(palindromes > 500 && palindromes < 2500, `${palindromes} palindromes of 3000`);
});

test('visible expectations agree; 15 valid cases; at least two 10^5-node lists; both outcomes', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.equal(brute(t.args[0]), t.expected);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 99999).length >= 2);
  const results = problem.hiddenTests.map((t) => t.expected);
  assert.ok(results.filter(Boolean).length >= 3 && results.filter((r) => !r).length >= 3);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [endsOnly, sameCounts, asNumber]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser enforces the constraints', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,1]').args, [[1, 2, 1]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[10]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('{"a":1}').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(100001).fill(1))).ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
