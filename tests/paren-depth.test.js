import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/paren-depth/problem.js';

// Brute force: strip every innermost "(...)" group at once and count the rounds until no bracket
// is left. No counter, no stack: the number of peeling rounds is the depth.
function brute(s) {
  let rounds = 0;
  while (s.includes('(')) {
    s = s.replace(/\([^()]*\)/g, '');
    rounds++;
  }
  return rounds;
}

/** A random balanced expression: filler characters and nested groups, built recursively. */
function randomExpr(rnd, depth) {
  const filler = '0123456789+-*/';
  let out = '';
  const parts = 1 + Math.floor(rnd() * 4);
  for (let i = 0; i < parts; i++) {
    if (depth > 0 && rnd() < 0.5) out += '(' + randomExpr(rnd, depth - 1) + ')';
    else out += filler[Math.floor(rnd() * filler.length)];
  }
  return out;
}

test('reference matches brute force on 1500 random expressions, depths vary', () => {
  const rnd = mulberry32(1614);
  const seen = new Set();
  for (let i = 0; i < 1500; i++) {
    const s = randomExpr(rnd, 1 + Math.floor(rnd() * 6));
    seen.add(reference(s));
    assert.equal(reference(s), brute(s), s);
  }
  assert.ok(seen.size >= 5, `${[...seen]} depths seen`);
});

test('5 visible and 10 hidden cases, visible expectations agree, max-size inputs', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true, t.args[0].slice(0, 40));
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000);
  assert.ok(big.length >= 4);
  assert.deepEqual(problem.hiddenTests.slice(6, 8).map((t) => t.expected), [50000, 1]);
  assert.ok(problem.hiddenTests.slice(0, 6).every((t) => brute(...t.args) === t.expected));
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  const totalOpen = (s) => [...s].filter((c) => c === '(').length;
  const longestRun = (s) => Math.max(0, ...(s.match(/\(+/g) ?? []).map((r) => r.length));
  // Resets the counter after a closing bracket instead of subtracting one.
  const resets = (s) => {
    let d = 0;
    let best = 0;
    for (const c of s) {
      if (c === '(') best = Math.max(best, ++d);
      else if (c === ')') d = 0;
    }
    return best;
  };
  for (const [name, wrong] of [['total openers', totalOpen], ['longest run of (', longestRun], ['reset on close', resets]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"(1+(2))"').args, ['(1+(2))']);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"(1"').ok, false);
  assert.equal(problem.parseCustomInput('")1("').ok, false);
  assert.equal(problem.parseCustomInput('"(a)"').ok, false);
  assert.equal(problem.parseCustomInput('5').ok, false);
  assert.equal(problem.parseCustomInput('(1)').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify('1'.repeat(100001))).ok, false);
  assert.equal(problem.solveReference(['((1))']), 2);
});
