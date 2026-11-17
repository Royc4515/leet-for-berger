import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/good-string-count/problem.js';

// Brute force: build every string literally and count the distinct ones in range. Independent of
// the reference, and it checks the "different sequences give different strings" claim too.
function brute(low, high, zero, one) {
  const seen = new Set();
  const go = (s) => {
    if (s.length > high) return;
    if (s.length >= low) seen.add(s);
    go(s + '0'.repeat(zero));
    go(s + '1'.repeat(one));
  };
  go('');
  return seen.size;
}

test('reference matches brute force on 1500 random small inputs', () => {
  const rnd = mulberry32(167);
  for (let t = 0; t < 1500; t++) {
    const high = 1 + Math.floor(rnd() * 14);
    const low = 1 + Math.floor(rnd() * high);
    const zero = 1 + Math.floor(rnd() * low);
    const one = 1 + Math.floor(rnd() * low);
    assert.equal(reference(low, high, zero, one), brute(low, high, zero, one));
  }
});

test('visible expectations agree; two max-size cases; every test parses', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[1] === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(t.args.join(' ')).ok, true);
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('1 2 1').ok, false);
  assert.equal(problem.parseCustomInput('3 2 1 1').ok, false);
  assert.equal(problem.parseCustomInput('1 100001 1 1').ok, false);
  assert.equal(problem.parseCustomInput('2 5 3 1').ok, false);
  assert.equal(problem.parseCustomInput('0 5 1 1').ok, false);
  assert.equal(problem.parseCustomInput('a b c d').ok, false);
  assert.deepEqual(problem.parseCustomInput('2, 3, 1, 2').args, [2, 3, 1, 2]);
});
