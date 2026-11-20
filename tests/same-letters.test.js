import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/same-letters/problem.js';

// Brute force: sort the characters of both strings and compare.
const brute = (s, t) => [...s].sort().join('') === [...t].sort().join('');

test('reference matches the sorted comparison on 4000 random pairs, true and false', () => {
  const rnd = mulberry32(101);
  let trues = 0;
  for (let i = 0; i < 4000; i++) {
    const n = 1 + Math.floor(rnd() * 8);
    const alpha = 'abcd'.slice(0, 1 + Math.floor(rnd() * 4));
    const s = Array.from({ length: n }, () => alpha[Math.floor(rnd() * alpha.length)]).join('');
    let t;
    if (rnd() < 0.5) {
      // A shuffle of s, so about half of the pairs are rearrangements.
      const a = s.split('');
      for (let k = a.length - 1; k > 0; k--) {
        const j = Math.floor(rnd() * (k + 1));
        [a[k], a[j]] = [a[j], a[k]];
      }
      t = a.join('');
    } else {
      const m = 1 + Math.floor(rnd() * 8);
      t = Array.from({ length: m }, () => alpha[Math.floor(rnd() * alpha.length)]).join('');
    }
    const want = brute(s, t);
    if (want) trues++;
    assert.equal(reference(s, t), want, `${s} ${t}`);
  }
  assert.ok(trues > 500, `${trues} true cases`);
});

test('5 visible and 10 hidden cases, expectations agree, max-size cases, valid input', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  assert.ok(all.some((t) => t.expected === true) && all.some((t) => t.expected === false));
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 99999).length >= 2);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Compares the sets of letters, ignoring counts.
  const sameSet = (s, t) => [...new Set(s)].sort().join('') === [...new Set(t)].sort().join('');
  // Compares the sum of letter codes: "ad" and "bc" collide.
  const sameSum = (s, t) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) === [...t].reduce((a, c) => a + c.charCodeAt(0), 0);
  // Compares lengths only.
  const sameLength = (s, t) => s.length === t.length;
  // Checks that every letter of s occurs in t (ignores counts and extra letters in t).
  const subsetOnly = (s, t) => [...s].every((c) => t.includes(c));
  // Compares letter counts but forgets to compare lengths first and only checks letters of s.
  const countsOfS = (s, t) => {
    const c = {};
    for (const ch of s) c[ch] = (c[ch] ?? 0) + 1;
    for (const ch of t) c[ch] = (c[ch] ?? 0) - 1;
    return Object.values(c).every((v) => v >= 0);
  };
  for (const [name, wrong] of [['same set', sameSet], ['same sum', sameSum], ['same length', sameLength], ['subset only', subsetOnly], ['counts of s only', countsOfS]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"listen"\n"silent"'), { ok: true, args: ['listen', 'silent'] });
  assert.equal(problem.parseCustomInput('"listen"').ok, false);
  assert.equal(problem.parseCustomInput('""\n"a"').ok, false);
  assert.equal(problem.parseCustomInput('"Listen"\n"silent"').ok, false);
  assert.equal(problem.parseCustomInput('"a1"\n"1a"').ok, false);
  assert.equal(problem.parseCustomInput(`${JSON.stringify('a'.repeat(100001))}\n"a"`).ok, false);
  assert.equal(problem.parseCustomInput('listen\nsilent').ok, false);
  assert.equal(problem.solveReference(['rat', 'tar']), true);
});
