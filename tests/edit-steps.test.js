import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/edit-steps/problem.js';

// Brute force: the plain exponential recursion on the first letters. Independent of the table.
function brute(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (a[0] === b[0]) return brute(a.slice(1), b.slice(1));
  return 1 + Math.min(brute(a.slice(1), b), brute(a, b.slice(1)), brute(a.slice(1), b.slice(1)));
}

const word = (rnd, n) => Array.from({ length: n }, () => 'abc'[Math.floor(rnd() * 3)]).join('');

test('reference matches brute force on 2000 random word pairs', () => {
  const rnd = mulberry32(331);
  for (let i = 0; i < 2000; i++) {
    const a = word(rnd, Math.floor(rnd() * 7));
    const b = word(rnd, Math.floor(rnd() * 7));
    assert.equal(reference(a, b), brute(a, b), `${a} / ${b}`);
    assert.equal(reference(a, b), reference(b, a), 'edit distance is symmetric');
  }
});

test('visible expectations agree; 15 valid cases; two 500 x 500 cases', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(t.args.map((a) => JSON.stringify(a)).join('\n')).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 500 && t.args[1].length === 500).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"horse"\n"ros"').args, ['horse', 'ros']);
  assert.deepEqual(problem.parseCustomInput('""\n"abc"').args, ['', 'abc']);
  assert.equal(problem.parseCustomInput('"horse"').ok, false);
  assert.equal(problem.parseCustomInput('horse\nros').ok, false);
  assert.equal(problem.parseCustomInput('"Horse"\n"ros"').ok, false);
  assert.equal(problem.parseCustomInput(`"${'a'.repeat(501)}"\n"b"`).ok, false);
  assert.equal(problem.parseCustomInput('5\n"b"').ok, false);
});
