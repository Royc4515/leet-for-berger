import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/caesar-groups/problem.js';

// Brute force: try all 26 shifts of a word against each group's first word. Independent of the
// reference's normalized key.
function isShiftOf(a, b) {
  if (a.length !== b.length) return false;
  for (let s = 0; s < 26; s++) {
    let same = true;
    for (let i = 0; i < a.length && same; i++) same = (a.charCodeAt(i) - 97 + s) % 26 === b.charCodeAt(i) - 97;
    if (same) return true;
  }
  return false;
}

function brute(words) {
  const groups = [];
  for (const w of words) {
    const g = groups.find((grp) => isShiftOf(grp[0], w));
    if (g) g.push(w);
    else groups.push([w]);
  }
  return groups;
}

test('reference matches brute force on 1000 random word lists', () => {
  const rnd = mulberry32(249);
  for (let i = 0; i < 1000; i++) {
    // Few letters and short words so many words really are shifts of each other.
    const words = Array.from({ length: 1 + Math.floor(rnd() * 12) }, () => {
      const len = 1 + Math.floor(rnd() * 3);
      const base = rnd() < 0.5 ? 0 : 23;
      return Array.from({ length: len }, () => String.fromCharCode(97 + ((base + Math.floor(rnd() * 5)) % 26))).join('');
    });
    assert.deepEqual(reference(words), brute(words), JSON.stringify(words));
  }
});

test('visible expectations agree; hidden tests match brute force; tests are valid input', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests.filter((h) => h.args[0].length <= 500)) assert.deepEqual(t.expected, brute(...t.args));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 10000);
  assert.ok(big.length >= 3);
  // One max-size test has every word in its own group, all of length 50.
  assert.ok(big.some((t) => t.expected.length === 10000 && t.args[0].every((w) => w.length === 50)));
});

test('wrap-around and gap keys without separators', () => {
  assert.deepEqual(reference(['az', 'ba']), [['az', 'ba']]);
  assert.deepEqual(reference(['abm', 'alm']), [['abm'], ['alm']]);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('["abc","bcd"]'), { ok: true, args: [['abc', 'bcd']] });
  assert.equal(problem.parseCustomInput('["Abc"]').ok, false);
  assert.equal(problem.parseCustomInput('[""]').ok, false);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput(`["${'a'.repeat(51)}"]`).ok, false);
  assert.equal(problem.parseCustomInput('"abc"').ok, false);
});
