import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/coin-combos/problem.js';

// Brute force: choose how many of each coin to use, one denomination at a time (exact counts,
// no modulus needed at these sizes). Independent of the knapsack table.
function brute(amount, coins, i = 0) {
  if (i === coins.length) return amount === 0 ? 1 : 0;
  let ways = 0;
  for (let used = 0; used * coins[i] <= amount; used++) ways += brute(amount - used * coins[i], coins, i + 1);
  return ways;
}

test('reference matches brute force on 2000 random cases', () => {
  const rnd = mulberry32(349);
  for (let t = 0; t < 2000; t++) {
    const set = new Set();
    const k = 1 + Math.floor(rnd() * 4);
    while (set.size < k) set.add(1 + Math.floor(rnd() * 12));
    const coins = [...set];
    const amount = Math.floor(rnd() * 40);
    assert.equal(reference(amount, coins), brute(amount, coins), `${amount} ${JSON.stringify(coins)}`);
  }
});

test('the modulus matches an exact BigInt count on a huge case', () => {
  const coins = Array.from({ length: 50 }, (_, i) => i + 1);
  const ways = new Array(501).fill(0n);
  ways[0] = 1n;
  for (const c of coins) for (let a = c; a <= 500; a++) ways[a] += ways[a - c];
  assert.ok(ways[500] > 2n ** 64n);
  assert.equal(reference(500, coins), Number(ways[500] % 1000000007n));
});

test('visible expectations agree; 15 valid cases; two cases at amount 5000 with 300 coins', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${t.args[0]}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] === 5000 && t.args[1].length === 300).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('5\n[1,2,5]').args, [5, [1, 2, 5]]);
  assert.equal(problem.parseCustomInput('5').ok, false);
  assert.equal(problem.parseCustomInput('-1\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('5001\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('5\n[]').ok, false);
  assert.equal(problem.parseCustomInput('5\n[0]').ok, false);
  assert.equal(problem.parseCustomInput('5\n[2,2]').ok, false);
  assert.equal(problem.parseCustomInput('5\n[5001]').ok, false);
});
