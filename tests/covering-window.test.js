import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/covering-window/problem.js';

// Brute force: every substring in order of start, then length; keep the first strictly shorter cover.
function brute(s, t) {
  const need = {};
  for (const c of t) need[c] = (need[c] ?? 0) + 1;
  const covers = (sub) => {
    const have = {};
    for (const c of sub) have[c] = (have[c] ?? 0) + 1;
    return Object.keys(need).every((c) => (have[c] ?? 0) >= need[c]);
  };
  let best = '';
  let bestLen = Infinity;
  for (let i = 0; i < s.length; i++)
    for (let j = i; j < s.length; j++) {
      if (j - i + 1 >= bestLen) break;
      if (covers(s.slice(i, j + 1))) {
        best = s.slice(i, j + 1);
        bestLen = j - i + 1;
        break;
      }
    }
  return best;
}

function randomString(rnd, n, alphabet) {
  let out = '';
  for (let i = 0; i < n; i++) out += alphabet[Math.floor(rnd() * alphabet.length)];
  return out;
}

test('reference matches brute force (leftmost on ties) on 2000 random pairs', () => {
  const rnd = mulberry32(63);
  for (let i = 0; i < 2000; i++) {
    const s = randomString(rnd, 1 + Math.floor(rnd() * 14), 'abcA');
    const t = randomString(rnd, 1 + Math.floor(rnd() * 4), 'abcA');
    assert.equal(reference(s, t), brute(s, t), `${s} / ${t}`);
  }
});

test('visible expectations agree; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('"abc"').ok, false);
  assert.equal(problem.parseCustomInput('"abc"\n""').ok, false);
  assert.equal(problem.parseCustomInput('"ab c"\n"a"').ok, false);
  assert.equal(problem.parseCustomInput('"abc"\n"1"').ok, false);
  assert.equal(problem.parseCustomInput(`${JSON.stringify('a'.repeat(100001))}\n"a"`).ok, false);
  assert.deepEqual(problem.parseCustomInput('"ADOBECODEBANC"\n"ABC"').args, ['ADOBECODEBANC', 'ABC']);
});
