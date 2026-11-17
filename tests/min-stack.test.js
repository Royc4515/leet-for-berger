import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/min-stack/problem.js';

// Brute force: a plain array, minimum found by scanning. Independent of the reference.
function brute(ops, args) {
  const st = [];
  return ops.map((op, i) => {
    if (op === 'push') st.push(args[i][0]);
    else if (op === 'pop') st.pop();
    else if (op === 'top') return st[st.length - 1];
    else if (op === 'getMin') return Math.min(...st);
    return null;
  });
}

test('reference matches brute force on 1000 random sequences', () => {
  const rnd = mulberry32(3);
  for (let k = 0; k < 1000; k++) {
    const ops = ['MinStack'];
    const args = [[]];
    let size = 0;
    for (let i = 0; i < 40; i++) {
      const r = rnd();
      if (!size || r < 0.4) {
        ops.push('push');
        args.push([Math.floor(rnd() * 11) - 5]);
        size++;
      } else if (r < 0.6) {
        ops.push('pop');
        args.push([]);
        size--;
      } else {
        ops.push(r < 0.8 ? 'top' : 'getMin');
        args.push([]);
      }
    }
    assert.deepEqual(reference(ops, args), brute(ops, args));
  }
});

test('every test sequence is valid and sized as declared', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 99999).length >= 2);
});

test('custom input parser rejects invalid sequences', () => {
  assert.equal(problem.parseCustomInput('["MinStack","pop"]\n[[],[]]').ok, false);
  assert.equal(problem.parseCustomInput('["MinStack","peek"]\n[[],[]]').ok, false);
  assert.equal(problem.parseCustomInput('["Stack"]\n[[]]').ok, false);
  assert.equal(problem.parseCustomInput('["MinStack","push"]\n[[],[2147483648]]').ok, false);
});
