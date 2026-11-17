import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference, flatten, drainOps } from '../src/js/problems/nested-flatten/problem.js';

// Brute force: flatten recursively with JSON.stringify-free logic, then answer each call.
function brute(ops, args) {
  const values = [];
  const walk = (l) => l.forEach((x) => (Array.isArray(x) ? walk(x) : values.push(x)));
  walk(args[0][0]);
  const out = [null];
  let i = 0;
  for (let k = 1; k < ops.length; k++) out.push(ops[k] === 'hasNext' ? i < values.length : values[i++]);
  return out;
}

function randomList(rnd, budget, depth) {
  const list = [];
  const n = Math.floor(rnd() * 5);
  for (let k = 0; k < n && budget.left > 0; k++) {
    if (depth < 4 && rnd() < 0.35) list.push(randomList(rnd, budget, depth + 1));
    else {
      list.push(Math.floor(rnd() * 21) - 10);
      budget.left--;
    }
  }
  return list;
}

test('reference matches brute force on 1500 random nested lists and call sequences', () => {
  const rnd = mulberry32(73);
  for (let k = 0; k < 1500; k++) {
    const list = randomList(rnd, { left: 12 }, 1);
    const args = drainOps(list, { seed: k, repeat: rnd() });
    assert.deepEqual(reference(...args), brute(...args));
  }
});

test('flatten is iterative and keeps order', () => {
  assert.deepEqual(flatten([[1, 1], 2, [1, 1]]), [1, 1, 2, 1, 1]);
  assert.deepEqual(flatten([[[]], []]), []);
  let deep = [7];
  for (let i = 0; i < 20000; i++) deep = [deep];
  assert.deepEqual(flatten(deep), [7]);
});

test('drainOps calls next only when hasNext is true and ends on hasNext', () => {
  const [ops] = drainOps([1, [2, [3]]], { seed: 4, repeat: 1 });
  assert.equal(ops[0], 'NestedIterator');
  assert.equal(ops.filter((o) => o === 'next').length, 3);
  assert.equal(ops[ops.length - 1], 'hasNext');
  assert.ok(ops.filter((o) => o === 'hasNext').length > 4, 'repeat adds extra hasNext calls');
});

test('visible expectations agree with the reference; 5 visible, 10 hidden, 2+ at max size', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  assert.ok(problem.hiddenTests.filter((t) => flatten(t.args[1][0][0]).length >= 49999).length >= 2);
  // Every hidden list respects the constraints the parser enforces.
  for (const t of problem.hiddenTests) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[1][0][0])).ok, true);
});

test('custom input parser drains the list as LeetCode does', () => {
  const r = problem.parseCustomInput('[[1,1],2,[1,1]]');
  assert.equal(r.ok, true);
  assert.deepEqual(problem.solveReference(r.args), [null, true, 1, true, 1, true, 2, true, 1, true, 1, false]);
  assert.deepEqual(problem.parseCustomInput('[]'), { ok: true, args: [['NestedIterator', 'hasNext'], [[[]], []]] });
  assert.equal(problem.parseCustomInput('[1,"a"]').ok, false);
  assert.equal(problem.parseCustomInput('[1000001]').ok, false);
  assert.equal(problem.parseCustomInput('5').ok, false);
  let deep = [1];
  for (let i = 0; i < 60; i++) deep = [deep];
  assert.equal(problem.parseCustomInput(JSON.stringify(deep)).ok, false);
});
