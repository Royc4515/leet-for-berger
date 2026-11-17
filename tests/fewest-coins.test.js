import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/fewest-coins/problem.js';

// Brute force: breadth-first search over amounts paid so far; the first time we hit `amount` uses
// the fewest coins. Independent of the reference's DP table.
function brute(coins, amount) {
  if (amount === 0) return 0;
  const seen = new Set([0]);
  let frontier = [0];
  for (let steps = 1; frontier.length; steps++) {
    const next = [];
    for (const paid of frontier)
      for (const c of coins) {
        const p = paid + c;
        if (p === amount) return steps;
        if (p < amount && !seen.has(p)) {
          seen.add(p);
          next.push(p);
        }
      }
    frontier = next;
  }
  return -1;
}

test('reference matches brute force on 2000 random inputs', () => {
  const rnd = mulberry32(97);
  for (let t = 0; t < 2000; t++) {
    const coins = Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => 1 + Math.floor(rnd() * 12));
    const amount = Math.floor(rnd() * 60);
    assert.equal(reference(coins, amount), brute(coins, amount));
  }
});

test('visible expectations agree; two max-amount cases; both outcomes hidden; every test parses', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[1] >= 9999 && t.args[0].length === 12).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected === -1));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n5').ok, false);
  assert.equal(problem.parseCustomInput('[0]\n5').ok, false);
  assert.equal(problem.parseCustomInput(`${JSON.stringify(Array(13).fill(1))}\n5`).ok, false);
  assert.equal(problem.parseCustomInput('[1]\n10001').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n-1').ok, false);
  assert.deepEqual(problem.parseCustomInput('[1,2,5]\n11').args, [[1, 2, 5], 11]);
});
