import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/grammar-symbol/problem.js';

// Brute force: build the rows literally with string rewriting (only feasible for small n).
const rows = ['0'];
for (let i = 1; i < 16; i++) rows.push([...rows[i - 1]].map((c) => (c === '0' ? '01' : '10')).join(''));
const brute = (n, k) => Number(rows[n - 1][k - 1]);

test('reference matches the literal rows on 3000 random positions', () => {
  const rnd = mulberry32(28);
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 16);
    const k = 1 + Math.floor(rnd() * 2 ** (n - 1));
    assert.equal(reference(n, k), brute(n, k), `${n} ${k}`);
  }
});

test('deep answers equal the parity of 1 bits in k - 1', () => {
  for (const t of problem.hiddenTests) {
    const ones = [...(t.args[1] - 1).toString(2)].filter((c) => c === '1').length;
    assert.equal(t.expected, ones % 2);
  }
});

test('visible expectations agree; tests are valid input; row 30 is exercised', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${t.args[0]}\n${t.args[1]}`).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] === 30).length >= 2);
  assert.deepEqual([...new Set(problem.hiddenTests.map((t) => t.expected))].sort(), [0, 1]);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('3').ok, false);
  assert.equal(problem.parseCustomInput('3\n5').ok, false);
  assert.equal(problem.parseCustomInput('0\n1').ok, false);
  assert.equal(problem.parseCustomInput('31\n1').ok, false);
  assert.equal(problem.parseCustomInput('3\n0').ok, false);
  assert.deepEqual(problem.parseCustomInput('30\n536870912'), { ok: true, args: [30, 536870912] });
});
