import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/circle-elimination/problem.js';

// Brute force: the literal game, removing players from an array.
function brute(n, k) {
  const circle = Array.from({ length: n }, (_, i) => i + 1);
  let at = 0;
  while (circle.length > 1) {
    at = (at + k - 1) % circle.length;
    circle.splice(at, 1);
    // The next round starts at the player who slid into the removed seat.
    if (at === circle.length) at = 0;
  }
  return circle[0];
}

test('reference matches brute force on 3000 random games', () => {
  const rnd = mulberry32(27);
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 40);
    const k = 1 + Math.floor(rnd() * n);
    assert.equal(reference(n, k), brute(n, k), `${n} ${k}`);
  }
});

test('visible expectations agree with the reference and the literal game; tests are valid input', () => {
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${t.args[0]}\n${t.args[1]}`).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] === 100000).length >= 2);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('5').ok, false);
  assert.equal(problem.parseCustomInput('0\n1').ok, false);
  assert.equal(problem.parseCustomInput('5\n6').ok, false);
  assert.equal(problem.parseCustomInput('5\n0').ok, false);
  assert.equal(problem.parseCustomInput('100001\n1').ok, false);
  assert.equal(problem.parseCustomInput('5\n-2').ok, false);
  assert.deepEqual(problem.parseCustomInput('5\n2'), { ok: true, args: [5, 2] });
});
