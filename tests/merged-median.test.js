import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/merged-median/problem.js';

// Brute force: merge by sorting, then add the middle value(s).
function brute(a, b) {
  const all = [...a, ...b].sort((x, y) => x - y);
  const n = all.length;
  return n % 2 ? 2 * all[(n - 1) / 2] : all[n / 2 - 1] + all[n / 2];
}

const sorted = (rnd, n) => Array.from({ length: n }, () => Math.floor(rnd() * 21) - 10).sort((x, y) => x - y);

test('reference matches brute force on 3000 random pairs', () => {
  const rnd = mulberry32(67);
  for (let i = 0; i < 3000; i++) {
    const a = sorted(rnd, Math.floor(rnd() * 9));
    const b = sorted(rnd, (a.length === 0 ? 1 : 0) + Math.floor(rnd() * 9));
    assert.equal(reference(a, b), brute(a, b), `${JSON.stringify(a)} ${JSON.stringify(b)}`);
  }
});

test('visible and hidden expectations agree with brute force; two max-size cases; a 64-bit answer; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests) assert.equal(t.expected, brute(...t.args));
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => Math.abs(t.expected) > 2 ** 31));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n[]').ok, false);
  assert.equal(problem.parseCustomInput('[2,1]\n[]').ok, false);
  assert.equal(problem.parseCustomInput('[2147483648]\n[]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]\n[]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[]\n[7]').args, [[], [7]]);
  assert.deepEqual(problem.parseCustomInput('[1,3]\n[2]').args, [[1, 3], [2]]);
});
