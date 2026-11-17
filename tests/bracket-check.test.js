import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/bracket-check/problem.js';

// Brute force: keep deleting adjacent matching pairs; valid exactly when nothing is left.
function brute(s) {
  let prev;
  do {
    prev = s;
    s = s.replace(/\(\)|\[\]|\{\}/g, '');
  } while (s !== prev);
  return s.length === 0;
}

test('reference matches pair deletion on 3000 random strings', () => {
  const rnd = mulberry32(61);
  for (let i = 0; i < 3000; i++) {
    // Half the strings use two kinds only, so valid ones come up often enough to test both answers.
    const alphabet = i % 2 ? '()[]{}' : '()[]';
    const s = Array.from({ length: 1 + Math.floor(rnd() * 10) }, () => alphabet[Math.floor(rnd() * alphabet.length)]).join('');
    assert.equal(reference(s), brute(s), s);
  }
});

test('visible expectations agree; max-size cases of both answers; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000);
  assert.ok(big.some((t) => t.expected) && big.some((t) => !t.expected) && big.length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(t.args[0]).ok, true);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('').ok, false);
  assert.equal(problem.parseCustomInput('(a)').ok, false);
  assert.equal(problem.parseCustomInput('"()').ok, false);
  assert.equal(problem.parseCustomInput('<>').ok, false);
  assert.deepEqual(problem.parseCustomInput(' {[]} ').args, ['{[]}']);
  assert.deepEqual(problem.parseCustomInput('"()"').args, ['()']);
});
