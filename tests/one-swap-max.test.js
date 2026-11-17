import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/one-swap-max/problem.js';

// Brute force: try every pair of positions (and no swap), keep the largest. Independent of the reference.
function brute(num) {
  const d = String(num).split('');
  let best = num;
  for (let i = 0; i < d.length; i++)
    for (let j = i + 1; j < d.length; j++) {
      const e = d.slice();
      [e[i], e[j]] = [e[j], e[i]];
      best = Math.max(best, Number(e.join('')));
    }
  return best;
}

test('reference matches brute force on 0..20000 and 5000 random values up to 10^8', () => {
  for (let n = 0; n <= 20000; n++) assert.equal(reference(n), brute(n));
  const rnd = mulberry32(89);
  for (let t = 0; t < 5000; t++) {
    const n = Math.floor(rnd() * 100000001);
    assert.equal(reference(n), brute(n));
  }
});

test('visible expectations agree; every test parses', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('-1').ok, false);
  assert.equal(problem.parseCustomInput('100000001').ok, false);
  assert.equal(problem.parseCustomInput('1.5').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
  assert.deepEqual(problem.parseCustomInput(' 2736 ').args, [2736]);
});
