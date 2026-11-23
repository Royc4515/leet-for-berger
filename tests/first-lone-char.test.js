import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/first-lone-char/problem.js';

// Brute force: check every position against every other position in O(n^2).
function brute(s) {
  for (let i = 0; i < s.length; i++) {
    let unique = true;
    for (let j = 0; j < s.length; j++) {
      if (i !== j && s[i] === s[j]) {
        unique = false;
        break;
      }
    }
    if (unique) return i;
  }
  return -1;
}

test('reference matches brute force on 2000 random strings', () => {
  const rnd = mulberry32(387);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 30);
    const alpha = 1 + Math.floor(rnd() * 12);
    let s = '';
    for (let k = 0; k < n; k++) s += String.fromCharCode(97 + Math.floor(rnd() * alpha));
    assert.equal(reference(s), brute(s), s);
  }
});

test('5 visible and 10 hidden cases, visible agree, at least two max-size inputs, inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const parsed = problem.parseCustomInput(JSON.stringify(t.args[0]));
    assert.equal(parsed.ok, true, parsed.error);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 4);
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length < 200)) {
    assert.equal(brute(...t.args), t.expected);
  }
});

test('classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Parity bug: treats odd count (3) as unique.
  const oddParity = (s) => {
    const p = new Int32Array(26);
    for (let i = 0; i < s.length; i++) p[s.charCodeAt(i) - 97] ^= 1;
    for (let i = 0; i < s.length; i++) if (p[s.charCodeAt(i) - 97] === 1) return i;
    return -1;
  };
  // Returns the index of the alphabetically smallest unique letter instead of the earliest index.
  const alphaOrder = (s) => {
    const c = new Int32Array(26);
    for (let i = 0; i < s.length; i++) c[s.charCodeAt(i) - 97]++;
    for (let k = 0; k < 26; k++) if (c[k] === 1) return s.indexOf(String.fromCharCode(97 + k));
    return -1;
  };
  // Only looks forward, ignoring earlier duplicates.
  const forwardOnly = (s) => {
    for (let i = 0; i < s.length; i++) if (s.indexOf(s[i], i + 1) === -1) return i;
    return -1;
  };
  for (const [name, wrong] of [['odd parity', oddParity], ['alphabetical order', alphaOrder], ['forward only', forwardOnly]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"river"').args, ['river']);
  assert.deepEqual(problem.parseCustomInput('river').args, ['river']);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"River"').ok, false);
  assert.equal(problem.parseCustomInput('"ab1"').ok, false);
  assert.equal(problem.parseCustomInput(`"${'a'.repeat(100001)}"`).ok, false);
  assert.equal(problem.solveReference(['level']), 2);
});
