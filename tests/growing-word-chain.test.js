import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/growing-word-chain/problem.js';

/** True when inserting one letter into a gives b: a two-pointer scan with one skip allowed. */
function growsInto(a, b) {
  if (a.length + 1 !== b.length) return false;
  let i = 0;
  for (let j = 0; j < b.length; j++) if (i < a.length && a[i] === b[j]) i++;
  return i === a.length;
}

// Brute force: longest path in the "grows into" DAG by memoized DFS over every pair of words.
// Independent of the reference, which never compares two words directly.
function brute(words) {
  const memo = new Map();
  const longestFrom = (k) => {
    if (memo.has(k)) return memo.get(k);
    let best = 1;
    for (let j = 0; j < words.length; j++) if (growsInto(words[k], words[j])) best = Math.max(best, 1 + longestFrom(j));
    memo.set(k, best);
    return best;
  };
  return Math.max(...words.map((_, k) => longestFrom(k)));
}

function randomSmall(rnd) {
  const pick = (n) => Math.floor(rnd() * n);
  const alphabet = 'abc'.slice(0, 1 + pick(3));
  const n = 1 + pick(14);
  return Array.from({ length: n }, () => Array.from({ length: 1 + pick(5) }, () => alphabet[pick(alphabet.length)]).join(''));
}

test('reference matches brute force on 3000 random cases', () => {
  const rnd = mulberry32(1048);
  const seen = new Set();
  for (let i = 0; i < 3000; i++) {
    const words = randomSmall(rnd);
    const want = brute(words);
    seen.add(want);
    assert.equal(reference(words), want, JSON.stringify(words));
  }
  // The generator must reach long chains, not just 1 and 2.
  assert.ok(seen.has(5), [...seen].join(','));
});

test('reference matches brute force on the small shipped cases', () => {
  for (const t of [...problem.visibleTests, ...problem.hiddenTests].filter((c) => c.args[0].length <= 500)) {
    assert.equal(t.expected, brute(t.args[0]));
  }
});

test('authored visible expectations agree with the reference', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
});

test('exactly 5 visible and 10 hidden tests', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
});

test('at least two hidden tests are at maximum size, within the constraints', () => {
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 20000).length >= 2);
  for (const t of problem.hiddenTests) assert.ok(t.args[0].every((w) => /^[a-z]{1,16}$/.test(w)));
});

test('a rearrangement or a two-letter insertion is not a step', () => {
  assert.equal(reference(['ab', 'bca']), 1);
  assert.equal(reference(['ab', 'abcd']), 1);
});

test('custom input parser accepts a JSON array of words and rejects bad input', () => {
  assert.deepEqual(problem.parseCustomInput('["o","on"]'), { ok: true, args: [['o', 'on']] });
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[""]').ok, false);
  assert.equal(problem.parseCustomInput('["Abc"]').ok, false);
  assert.equal(problem.parseCustomInput(`["${'a'.repeat(17)}"]`).ok, false);
  assert.equal(problem.parseCustomInput('o, on').ok, false);
});
