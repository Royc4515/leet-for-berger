import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSuite, judge, comparatorFor, checkRandomizedSet, plausiblyUniform, JUDGE_MODES, deepEqual } from '../src/js/engine/harness.js';
import { mulberry32 } from '../src/js/engine/rng.js';
import randomPool, { reference } from '../src/js/problems/random-pool/problem.js';

const tc = (ops, args) => ({ args: [ops, args], expected: reference(ops, args) });

test('comparatorFor: exact by default, named modes, unknown modes rejected', () => {
  assert.equal(comparatorFor({}), JUDGE_MODES.exact);
  assert.equal(comparatorFor({ judge: 'randomized-set' }), checkRandomizedSet);
  assert.equal(comparatorFor(randomPool), checkRandomizedSet);
  assert.throws(() => comparatorFor({ judge: 'close-enough' }));
  assert.ok(JUDGE_MODES.exact([1, 2], [1, 2]) && !JUDGE_MODES.exact([1, 2], [2, 1]));
});

test('randomized-set: exact on insert/remove, membership on getRandom', () => {
  const c = tc(['RandomizedSet', 'insert', 'insert', 'getRandom', 'remove', 'getRandom'], [[], [1], [2], [], [1], []]);
  assert.deepEqual(c.expected, [null, true, true, null, true, null]);
  assert.ok(checkRandomizedSet([null, true, true, 1, true, 2], c.expected, c));
  assert.ok(checkRandomizedSet([null, true, true, 2, true, 2], c.expected, c));
  assert.ok(!checkRandomizedSet([null, true, true, 3, true, 2], c.expected, c), 'never a member');
  assert.ok(!checkRandomizedSet([null, true, true, 1, true, 1], c.expected, c), 'removed member');
  assert.ok(!checkRandomizedSet([null, true, false, 1, true, 2], c.expected, c), 'wrong insert result');
  assert.ok(!checkRandomizedSet([null, true, true, 1, true], c.expected, c), 'missing a result');
  assert.ok(!checkRandomizedSet('oops', c.expected, c));
});

function picks(members, n, choose) {
  const ops = ['RandomizedSet', ...members.map(() => 'insert'), ...Array(n).fill('getRandom')];
  const args = [[], ...members.map((v) => [v]), ...Array(n).fill([])];
  const c = tc(ops, args);
  const actual = c.expected.map((e, i) => (ops[i] === 'getRandom' ? choose(i) : e));
  return checkRandomizedSet(actual, c.expected, c);
}

test('randomized-set: long runs must look uniform, short runs are not judged on fairness', () => {
  const members = [10, 20, 30, 40];
  const rnd = mulberry32(5);
  assert.ok(picks(members, 4000, () => members[Math.floor(rnd() * 4)]), 'a fair pick passes');
  assert.ok(!picks(members, 4000, () => 10), 'always the same member fails');
  assert.ok(!picks(members, 4000, () => members[Math.floor(rnd() * 3)]), 'never picking the last member fails');
  assert.ok(!picks(members, 4000, () => (rnd() < 0.4 ? 10 : members[Math.floor(rnd() * 4)])), 'a 55% favorite fails');
  assert.ok(picks(members, 40, () => 10), '10 expected picks per member is too few to judge');
});

test('plausiblyUniform: thresholds', () => {
  assert.ok(plausiblyUniform(new Map([[1, 500]]), 500, 1), 'one member is always fair');
  assert.ok(plausiblyUniform(new Map([[1, 100], [2, 100]]), 200, 2));
  assert.ok(!plausiblyUniform(new Map([[1, 200]]), 200, 2), 'a member never picked');
  assert.ok(plausiblyUniform(new Map([[1, 10]]), 10, 2), 'below 100 expected picks per member: not checked');
});

test('a fair picker passes every check thousands of times (false failures stay out of reach)', () => {
  const rnd = mulberry32(77);
  const suite = buildSuite(randomPool);
  for (let round = 0; round < 3; round++) {
    for (const c of suite) {
      const [ops, args] = c.args;
      const live = [];
      const where = new Map();
      const actual = ops.map((op, i) => {
        if (op === 'getRandom') return live[Math.floor(rnd() * live.length)];
        if (op === 'insert' && !where.has(args[i][0])) {
          where.set(args[i][0], live.length);
          live.push(args[i][0]);
        } else if (op === 'remove' && where.has(args[i][0])) {
          const k = where.get(args[i][0]);
          const last = live.pop();
          if (k < live.length) {
            live[k] = last;
            where.set(last, k);
          }
          where.delete(args[i][0]);
        }
        return c.expected[i];
      });
      assert.ok(checkRandomizedSet(actual, c.expected, c), `case ${c.id}`);
    }
  }
});

test('judge passes the case to the comparator and still redacts hidden cases', () => {
  const suite = buildSuite(randomPool);
  const raw = suite.map((c) => ({ id: c.id, state: 'ok', actual: c.expected }));
  // Echoing expected puts null where getRandom must return a member, so every case with a pick fails.
  const res = judge(suite, raw, comparatorFor(randomPool));
  assert.equal(res.accepted, false);
  for (const c of res.cases.filter((x) => !x.visible)) {
    assert.equal(c.args, undefined);
    assert.equal(c.expected, undefined);
    assert.equal(c.actual, undefined);
  }
  // The default comparator ignores the third argument, so existing problems judge as before.
  assert.ok(judge(suite, raw).accepted);
  assert.ok(deepEqual(res.cases[1].expected, suite[1].expected));
});
