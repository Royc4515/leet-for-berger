import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/interleave-words/problem.js';

// Brute force: two queues, alternately pop the front of each while it has letters.
function brute(a, b) {
  const qa = [...a];
  const qb = [...b];
  let out = '';
  let turn = 0;
  while (qa.length || qb.length) {
    const q = turn === 0 ? qa : qb;
    const other = turn === 0 ? qb : qa;
    if (q.length) out += q.shift();
    else out += other.shift();
    turn ^= 1;
  }
  return out;
}

function randomWord(rnd, n) {
  let s = '';
  for (let i = 0; i < n; i++) s += 'abcxyz'[Math.floor(rnd() * 6)];
  return s;
}

test('reference matches brute force on 1500 random pairs', () => {
  const rnd = mulberry32(1768);
  for (let i = 0; i < 1500; i++) {
    const a = randomWord(rnd, 1 + Math.floor(rnd() * 9));
    const b = randomWord(rnd, 1 + Math.floor(rnd() * 9));
    assert.equal(reference(a, b), brute(a, b), `${a} ${b}`);
  }
});

test('5 visible and 10 hidden cases, visible agree, at least two max-size inputs, inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  for (const t of all) {
    const parsed = problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`);
    assert.equal(parsed.ok, true, parsed.error);
    assert.equal(t.expected.length, t.args[0].length + t.args[1].length);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length + t.args[1].length >= 100001).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.args[0].length === 1 && t.args[1].length > 1000));
  assert.ok(problem.hiddenTests.some((t) => t.args[1].length === 1 && t.args[0].length > 1000));
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Stops when the shorter word ends and drops the tail.
  const dropsTail = (a, b) => {
    let out = '';
    for (let i = 0; i < Math.min(a.length, b.length); i++) out += a[i] + b[i];
    return out;
  };
  // Appends only the second word's remainder.
  const onlyAppendsSecond = (a, b) => {
    const n = Math.min(a.length, b.length);
    let out = '';
    for (let i = 0; i < n; i++) out += a[i] + b[i];
    return out + b.slice(n);
  };
  // Starts with the second word.
  const wrongOrder = (a, b) => reference(b, a);
  // Concatenates both tails, which is right, but takes the second word first when the first is longer.
  const swapsWhenLonger = (a, b) => (a.length > b.length ? reference(b, a) : reference(a, b));
  for (const [name, wrong] of [['drops tail', dropsTail], ['only second tail', onlyAppendsSecond], ['wrong order', wrongOrder], ['swaps when longer', swapsWhenLonger]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"ab"\n"pq"').args, ['ab', 'pq']);
  assert.equal(problem.parseCustomInput('"ab"').ok, false);
  assert.equal(problem.parseCustomInput('ab\n"pq"').ok, false);
  assert.equal(problem.parseCustomInput('""\n"pq"').ok, false);
  assert.equal(problem.parseCustomInput('"aB"\n"pq"').ok, false);
  assert.equal(problem.parseCustomInput(`"${'a'.repeat(100001)}"\n"b"`).ok, false);
  assert.equal(problem.solveReference(['ab', 'xyz']), 'axbyz');
});
