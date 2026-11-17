import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/random-pool/problem.js';

// Brute force on a plain array with linear search: independent of Set semantics.
function brute(ops, args) {
  const arr = [];
  return ops.map((op, i) => {
    const v = args[i][0];
    if (op === 'insert') {
      if (arr.includes(v)) return false;
      arr.push(v);
      return true;
    }
    if (op === 'remove') {
      const k = arr.indexOf(v);
      if (k < 0) return false;
      arr.splice(k, 1);
      return true;
    }
    return null;
  });
}

test('reference matches brute force on 1500 random call sequences', () => {
  const rnd = mulberry32(91);
  for (let k = 0; k < 1500; k++) {
    const ops = ['RandomizedSet'];
    const args = [[]];
    const n = 1 + Math.floor(rnd() * 30);
    for (let i = 0; i < n; i++) {
      const r = rnd();
      ops.push(r < 0.45 ? 'insert' : r < 0.85 ? 'remove' : 'getRandom');
      args.push(ops[ops.length - 1] === 'getRandom' ? [] : [Math.floor(rnd() * 6)]);
    }
    assert.deepEqual(reference(ops, args), brute(ops, args));
  }
});

test('visible expectations agree with the reference; 5 visible, 10 hidden, 2+ at max size', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 200000).length >= 2);
  // Every test is valid input: getRandom only on a non-empty set, at most 2 * 10^5 calls.
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
  // Some hidden runs are long enough for the fairness check.
  assert.ok(problem.hiddenTests.some((t) => t.args[0].filter((o) => o === 'getRandom').length >= 10000));
});

test('custom input parser', () => {
  const ok = problem.parseCustomInput('["RandomizedSet","insert","getRandom"]\n[[],[1],[]]');
  assert.deepEqual(ok, { ok: true, args: [['RandomizedSet', 'insert', 'getRandom'], [[], [1], []]] });
  assert.equal(problem.parseCustomInput('["RandomizedSet","getRandom"]\n[[],[]]').ok, false);
  assert.equal(problem.parseCustomInput('["RandomizedSet","insert","remove","getRandom"]\n[[],[1],[1],[]]').ok, false);
  assert.equal(problem.parseCustomInput('["RandomizedSet","insert"]\n[[],[2147483648]]').ok, false);
  assert.equal(problem.parseCustomInput('["RandomizedSet","pop"]\n[[],[]]').ok, false);
  assert.equal(problem.parseCustomInput('["Set","insert"]\n[[],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('["RandomizedSet"]').ok, false);
});
