import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/sparse-dot/problem.js';

// Brute force: expand both vectors into dense arrays over a small index range.
function brute(a, b) {
  const size = 1 + Math.max(0, ...a.map((p) => p[0]), ...b.map((p) => p[0]));
  const x = new Array(size).fill(0);
  const y = new Array(size).fill(0);
  for (const [i, v] of a) x[i] = v;
  for (const [i, v] of b) y[i] = v;
  let dot = 0;
  for (let i = 0; i < size; i++) dot += x[i] * y[i];
  return dot;
}

// Classic wrong answer: multiply the pairs position by position.
function byPosition(a, b) {
  let dot = 0;
  for (let k = 0; k < Math.min(a.length, b.length); k++) dot += a[k][1] * b[k][1];
  return dot;
}
// Classic wrong answer: stop as soon as the first mismatch appears.
function stopAtMismatch(a, b) {
  let dot = 0;
  for (let k = 0; k < Math.min(a.length, b.length); k++) {
    if (a[k][0] !== b[k][0]) break;
    dot += a[k][1] * b[k][1];
  }
  return dot;
}

const randomList = (rnd, span) => {
  const out = [];
  for (let i = 0; i < span; i++) {
    if (rnd() < 0.4) {
      const m = 1 + Math.floor(rnd() * 100);
      out.push([i, rnd() < 0.5 ? m : -m]);
    }
  }
  return out;
};

test('reference matches a dense brute force on 3000 seeded small cases', () => {
  const rnd = mulberry32(1570);
  for (let c = 0; c < 3000; c++) {
    const span = 1 + Math.floor(rnd() * 30);
    const a = randomList(rnd, span);
    const b = randomList(rnd, span);
    assert.equal(reference(a, b), brute(a, b), JSON.stringify([a, b]));
  }
});

test('visible expectations agree; 15 valid cases; at least two at the size limit', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000 && t.args[1].length === 100000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected === 1000000000));
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [byPosition, stopAtMismatch]) {
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser enforces order, range and non-zero values', () => {
  assert.deepEqual(problem.parseCustomInput('[[0,1],[3,2]]; [[3,4]]').args, [[[0, 1], [3, 2]], [[3, 4]]]);
  assert.deepEqual(problem.parseCustomInput('[]\n[]').args, [[], []]);
  assert.equal(problem.parseCustomInput('[[3,1],[1,2]]; []').ok, false);
  assert.equal(problem.parseCustomInput('[[1,1],[1,2]]; []').ok, false);
  assert.equal(problem.parseCustomInput('[[1,0]]; []').ok, false);
  assert.equal(problem.parseCustomInput('[[1,101]]; []').ok, false);
  assert.equal(problem.parseCustomInput('[[1000000000,1]]; []').ok, false);
  assert.equal(problem.parseCustomInput('[[1,1]]').ok, false);
});
