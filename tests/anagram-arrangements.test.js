import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/anagram-arrangements/problem.js';

// Brute force: the set of distinct permutations of each word, multiplied together.
function permutations(word) {
  if (word.length <= 1) return new Set([word]);
  const out = new Set();
  for (let i = 0; i < word.length; i++) {
    for (const rest of permutations(word.slice(0, i) + word.slice(i + 1))) out.add(word[i] + rest);
  }
  return out;
}

const brute = (s) => s.split(' ').reduce((acc, w) => (acc * BigInt(permutations(w).size)) % 1000000007n, 1n);

test('reference matches distinct-permutation counting on 1500 random sentences', () => {
  const rnd = mulberry32(280);
  for (let k = 0; k < 1500; k++) {
    const words = Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => 'abc'[Math.floor(rnd() * 3)]).join(''));
    const s = words.join(' ');
    assert.equal(reference(s), Number(brute(s)), s);
  }
});

test('reference matches exact BigInt multinomials on long words', () => {
  const fact = (n) => {
    let r = 1n;
    for (let i = 2n; i <= BigInt(n); i++) r *= i;
    return r;
  };
  const rnd = mulberry32(281);
  for (let k = 0; k < 50; k++) {
    const w = Array.from({ length: 20 + Math.floor(rnd() * 200) }, () => 'abcdefghij'[Math.floor(rnd() * 10)]).join('');
    const counts = {};
    for (const ch of w) counts[ch] = (counts[ch] ?? 0) + 1;
    const exact = Object.values(counts).reduce((acc, c) => acc / fact(c), fact(w.length));
    assert.equal(reference(w), Number(exact % 1000000007n));
  }
});

test('visible expectations agree; max sizes; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(t.args[0]).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('too hot'), { ok: true, args: ['too hot'] });
  assert.deepEqual(problem.parseCustomInput('"aa"'), { ok: true, args: ['aa'] });
  assert.equal(problem.parseCustomInput('too  hot').ok, false);
  assert.equal(problem.parseCustomInput('Too').ok, false);
  assert.equal(problem.parseCustomInput('"too "').ok, false);
  assert.equal(problem.parseCustomInput('a1').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
  assert.equal(problem.parseCustomInput('a'.repeat(100001)).ok, false);
});
