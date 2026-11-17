import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/anagram-buckets/problem.js';

// Brute force: compare letter counts pairwise, assign each word to the first matching group.
const counts = (w) => [...'abcdefghijklmnopqrstuvwxyz'].map((c) => w.split(c).length - 1).join(',');
function brute(words) {
  const groups = [];
  for (const w of words) {
    const g = groups.find((grp) => counts(grp[0]) === counts(w));
    if (g) g.push(w);
    else groups.push([w]);
  }
  return groups;
}

test('reference matches brute force on 1000 random word lists', () => {
  const rnd = mulberry32(2);
  for (let i = 0; i < 1000; i++) {
    const words = Array.from({ length: 1 + Math.floor(rnd() * 10) }, () =>
      Array.from({ length: Math.floor(rnd() * 4) }, () => 'abc'[Math.floor(rnd() * 3)]).join(''),
    );
    assert.deepEqual(reference(words), brute(words));
  }
});

test('visible expectations agree; tests are valid input', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 10000).length >= 2);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('["Abc"]').ok, false);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('"abc"').ok, false);
});
