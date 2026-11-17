import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/no-adjacent-repeat/problem.js';

// Brute force: generate every distinct arrangement in lexicographic order (sorted letters, each
// position tries the smaller letters first) and return the first with no equal neighbours.
function brute(s) {
  const letters = [...s].sort();
  const used = new Array(letters.length).fill(false);
  const path = [];
  let found = null;
  const dfs = () => {
    if (found !== null) return;
    if (path.length === letters.length) {
      if (path.every((c, i) => i === 0 || c !== path[i - 1])) found = path.join('');
      return;
    }
    for (let i = 0; i < letters.length; i++) {
      if (used[i] || (i > 0 && letters[i] === letters[i - 1] && !used[i - 1])) continue;
      used[i] = true;
      path.push(letters[i]);
      dfs();
      path.pop();
      used[i] = false;
    }
  };
  dfs();
  return found ?? '';
}

test('reference matches brute force on 1500 random strings', () => {
  const rnd = mulberry32(43);
  for (let t = 0; t < 1500; t++) {
    const len = 1 + Math.floor(rnd() * 8);
    const alphabet = 1 + Math.floor(rnd() * 4);
    let s = '';
    for (let i = 0; i < len; i++) s += 'abcd'[Math.floor(rnd() * alphabet)];
    assert.equal(reference(s), brute(s), s);
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 99999).length >= 2);
  // Both outcomes must be exercised among the large hidden inputs.
  assert.ok(problem.hiddenTests.some((t) => t.args[0].length >= 99999 && t.expected === ''));
  assert.ok(problem.hiddenTests.some((t) => t.args[0].length >= 99999 && t.expected !== ''));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"aB"').ok, false);
  assert.equal(problem.parseCustomInput('aab').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify('a'.repeat(100001))).ok, false);
  assert.deepEqual(problem.parseCustomInput('"aab"').args, ['aab']);
});
