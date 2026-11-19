import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/subsequence-check/problem.js';

// Brute force: memoized "can s[i..] be found in t[j..]" over both choices at every step.
// Independent of the greedy reference, which never considers skipping a matching character.
function brute(s, t) {
  const memo = new Map();
  const go = (i, j) => {
    if (i === s.length) return true;
    if (j === t.length) return false;
    const key = i * (t.length + 1) + j;
    if (memo.has(key)) return memo.get(key);
    const r = (s[i] === t[j] && go(i + 1, j + 1)) || go(i, j + 1);
    memo.set(key, r);
    return r;
  };
  return go(0, 0);
}

function randomSmall(rnd) {
  const pick = (n) => Math.floor(rnd() * n);
  const alphabet = 'abc'.slice(0, 1 + pick(3));
  const word = (len) => Array.from({ length: len }, () => alphabet[pick(alphabet.length)]).join('');
  const t = word(pick(10));
  // Half the cases derive s from t, so true answers are as common as false ones.
  const s = rnd() < 0.5 ? [...t].filter(() => rnd() < 0.6).join('') : word(pick(6));
  return [s, t];
}

test('reference matches brute force on 5000 random cases', () => {
  const rnd = mulberry32(392);
  let trues = 0;
  for (let i = 0; i < 5000; i++) {
    const [s, t] = randomSmall(rnd);
    const want = brute(s, t);
    if (want) trues++;
    assert.equal(reference(s, t), want, JSON.stringify([s, t]));
  }
  assert.ok(trues > 1000 && trues < 4000, `${trues} true answers`);
});

test('authored visible expectations agree with the reference', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
});

test('exactly 5 visible and 10 hidden tests, with both answers among the hidden ones', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  const answers = problem.hiddenTests.map((t) => t.expected);
  assert.ok(answers.filter(Boolean).length >= 3 && answers.filter((a) => !a).length >= 3);
});

test('at least two hidden tests are at maximum size', () => {
  const big = problem.hiddenTests.filter((t) => t.args[1].length === 100000 && t.args[0].length >= 50000);
  assert.ok(big.length >= 2, `${big.length} max-size tests`);
});

test('order matters, not just membership', () => {
  assert.equal(reference('ba', 'ab'), false);
  assert.equal(reference('aec', 'abcde'), false);
});

test('custom input parser accepts two JSON strings and rejects bad input', () => {
  assert.deepEqual(problem.parseCustomInput('"ace"\n"abcde"'), { ok: true, args: ['ace', 'abcde'] });
  assert.deepEqual(problem.parseCustomInput('""\n""'), { ok: true, args: ['', ''] });
  assert.equal(problem.parseCustomInput('"ace"').ok, false);
  assert.equal(problem.parseCustomInput('ace\nabcde').ok, false);
  assert.equal(problem.parseCustomInput('"Ace"\n"abcde"').ok, false);
  assert.equal(problem.parseCustomInput('1\n"abcde"').ok, false);
  assert.equal(problem.parseCustomInput(`"a"\n"${'a'.repeat(100001)}"`).ok, false);
});
