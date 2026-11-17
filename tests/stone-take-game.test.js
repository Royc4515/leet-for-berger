import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/stone-take-game/problem.js';

// Brute force: the game table. A size is winning if some move of 1 to 3 reaches a losing size.
const LIMIT = 5000;
const wins = [false];
for (let n = 1; n <= LIMIT; n++) wins.push([1, 2, 3].some((k) => k <= n && !wins[n - k]));

test('reference matches the game table for every n up to 5000 and 1000 seeded picks', () => {
  for (let n = 1; n <= LIMIT; n++) assert.equal(reference(n), wins[n], `n = ${n}`);
  const rnd = mulberry32(40);
  for (let i = 0; i < 1000; i++) {
    const n = 1 + Math.floor(rnd() * LIMIT);
    assert.equal(reference(n), wins[n]);
  }
});

test('visible expectations agree; large piles are tested; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  for (const t of all) assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] > 2 ** 30).length >= 2);
  // Both answers must appear among the large piles, or always returning one value passes them.
  const large = problem.hiddenTests.filter((t) => t.args[0] > 10 ** 8).map((t) => t.expected);
  assert.ok(large.includes(true) && large.includes(false));
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput(' 7 '), { ok: true, args: [7] });
  assert.deepEqual(problem.parseCustomInput('2147483647'), { ok: true, args: [2147483647] });
  assert.equal(problem.parseCustomInput('0').ok, false);
  assert.equal(problem.parseCustomInput('2147483648').ok, false);
  assert.equal(problem.parseCustomInput('-4').ok, false);
  assert.equal(problem.parseCustomInput('4.5').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
});
