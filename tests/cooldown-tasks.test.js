import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/cooldown-tasks/problem.js';

// Brute force: breadth-first search over schedules. A state is the remaining count of each kind
// plus how many slots each kind must still wait; every slot runs one ready kind or idles. The
// first time all counts reach zero is the optimum. Independent of the frame formula.
function brute(tasks, n) {
  const kinds = [...new Set(tasks)];
  const start = kinds.map((k) => [...tasks].filter((c) => c === k).length);
  const key = (cnt, wait) => `${cnt.join(',')}|${wait.join(',')}`;
  let frontier = [[start, kinds.map(() => 0)]];
  const seen = new Set([key(start, kinds.map(() => 0))]);
  for (let steps = 0; ; steps++) {
    const next = [];
    for (const [cnt, wait] of frontier) {
      if (cnt.every((v) => v === 0)) return steps;
      const cooled = wait.map((w) => Math.max(0, w - 1));
      const moves = [[cnt, cooled]];
      cnt.forEach((v, i) => {
        if (v > 0 && wait[i] === 0) {
          const c2 = [...cnt];
          c2[i]--;
          const w2 = [...cooled];
          w2[i] = n;
          moves.push([c2, w2]);
        }
      });
      for (const [c2, w2] of moves) {
        const k = key(c2, w2);
        if (!seen.has(k)) {
          seen.add(k);
          next.push([c2, w2]);
        }
      }
    }
    frontier = next;
  }
}

test('reference matches brute force on 1000 random inputs', () => {
  const rnd = mulberry32(41);
  for (let t = 0; t < 1000; t++) {
    const len = 1 + Math.floor(rnd() * 8);
    const alphabet = 1 + Math.floor(rnd() * 4);
    let tasks = '';
    for (let i = 0; i < len; i++) tasks += 'ABCD'[Math.floor(rnd() * alphabet)];
    const n = Math.floor(rnd() * 4);
    assert.equal(reference(tasks, n), brute(tasks, n), `${tasks} ${n}`);
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('""\n1').ok, false);
  assert.equal(problem.parseCustomInput('"AaB"\n1').ok, false);
  assert.equal(problem.parseCustomInput('"AB"\n101').ok, false);
  assert.equal(problem.parseCustomInput('"AB"\n-1').ok, false);
  assert.equal(problem.parseCustomInput('"AB"').ok, false);
  assert.deepEqual(problem.parseCustomInput('"AAB"\n2').args, ['AAB', 2]);
});
