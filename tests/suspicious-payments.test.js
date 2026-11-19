import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/suspicious-payments/problem.js';

// Brute force: compare every record with every other record. Independent of the sliding-window reference.
function brute(payments) {
  const rows = payments.map((p) => p.split(','));
  return payments.filter((_, i) => {
    const [name, minute, amount, city] = rows[i];
    if (Number(amount) > 1000) return true;
    return rows.some(([n2, m2, , c2], j) => j !== i && n2 === name && c2 !== city && Math.abs(Number(m2) - Number(minute)) <= 60);
  });
}

function randomSmall(rnd) {
  const pick = (n) => Math.floor(rnd() * n);
  const names = ['a', 'b', 'ab'];
  const cities = ['x', 'y', 'z'];
  const n = 1 + pick(10);
  // A narrow minute range makes boundary distances (59, 60, 61) common.
  const span = 1 + pick(200);
  return Array.from({ length: n }, () => {
    const amount = rnd() < 0.15 ? 999 + pick(4) : pick(1001);
    return `${names[pick(names.length)]},${pick(span)},${amount},${cities[pick(1 + pick(3))]}`;
  });
}

test('reference matches brute force on 3000 random cases', () => {
  const rnd = mulberry32(1169);
  for (let i = 0; i < 3000; i++) {
    const payments = randomSmall(rnd);
    assert.deepEqual(reference(payments), brute(payments), JSON.stringify(payments));
  }
});

test('reference matches brute force on every shipped case', () => {
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.deepEqual(t.expected, brute(...t.args));
});

test('authored visible expectations agree with the reference', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
});

test('exactly 5 visible and 10 hidden tests', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
});

test('at least two hidden tests are at maximum size, and hidden answers are not all trivial', () => {
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 1000).length >= 2);
  const sizes = problem.hiddenTests.map((t) => t.expected.length);
  assert.ok(sizes.some((s) => s === 0) && sizes.some((s) => s > 100));
});

test('a conflict flags the earlier record too, and order follows the input', () => {
  assert.deepEqual(reference(['kim,500,5,oslo', 'kim,440,5,lima']), ['kim,500,5,oslo', 'kim,440,5,lima']);
});

test('custom input parser accepts a JSON array and rejects bad records', () => {
  assert.deepEqual(problem.parseCustomInput('["ana,20,800,haifa"]'), { ok: true, args: [['ana,20,800,haifa']] });
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('["Ana,20,800,haifa"]').ok, false);
  assert.equal(problem.parseCustomInput('["ana,1001,800,haifa"]').ok, false);
  assert.equal(problem.parseCustomInput('["ana,20,2001,haifa"]').ok, false);
  assert.equal(problem.parseCustomInput('["ana,020,800,haifa"]').ok, false);
  assert.equal(problem.parseCustomInput('["ana,20,800"]').ok, false);
  assert.equal(problem.parseCustomInput('not json').ok, false);
});
