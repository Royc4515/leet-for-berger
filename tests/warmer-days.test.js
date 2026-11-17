import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/warmer-days/problem.js';

// Brute force: from every day, scan forward for the first strictly warmer one.
function brute(temps) {
  return temps.map((t, i) => {
    for (let j = i + 1; j < temps.length; j++) if (temps[j] > t) return j - i;
    return 0;
  });
}

test('reference matches a forward scan on 2000 random weeks', () => {
  const rnd = mulberry32(81);
  for (let i = 0; i < 2000; i++) {
    const temps = Array.from({ length: 1 + Math.floor(rnd() * 14) }, () => 30 + Math.floor(rnd() * 6));
    assert.deepEqual(reference(temps), brute(temps));
  }
});

test('visible expectations agree; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[29]').ok, false);
  assert.equal(problem.parseCustomInput('[101]').ok, false);
  assert.equal(problem.parseCustomInput('[50.5]').ok, false);
  assert.equal(problem.parseCustomInput('hot').ok, false);
  assert.deepEqual(problem.parseCustomInput('[30,31]').args, [[30, 31]]);
});
