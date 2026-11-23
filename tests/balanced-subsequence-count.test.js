import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/balanced-subsequence-count/problem.js';

// Brute force: enumerate all 2^n - 1 non-empty index subsets and test whether all present
// characters have the same frequency.
function brute(s) {
  const n = s.length;
  let good = 0;
  for (let mask = 1; mask < 1 << n; mask++) {
    const counts = new Int32Array(26);
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) counts[s.charCodeAt(i) - 97]++;
    }
    let freq = 0;
    let ok = true;
    for (let c = 0; c < 26; c++) {
      if (counts[c] === 0) continue;
      if (freq === 0) freq = counts[c];
      else if (counts[c] !== freq) {
        ok = false;
        break;
      }
    }
    if (ok) good++;
  }
  return good;
}

test('reference matches brute force on 1500 random small strings', () => {
  const rnd = mulberry32(2539);
  for (let i = 0; i < 1500; i++) {
    const n = 1 + Math.floor(rnd() * 10);
    const alpha = 1 + Math.floor(rnd() * 5);
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
    assert.ok(t.expected >= 1 && t.expected < 1000000007);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 10000).length >= 5);
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 12)) {
    assert.equal(brute(...t.args), t.expected);
  }
});

test('classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Forgets to subtract the empty subsequence on each k (subtracts once at the end instead).
  const subtractOnce = (s) => {
    const counts = new Int32Array(26);
    for (let i = 0; i < s.length; i++) counts[s.charCodeAt(i) - 97]++;
    const maxF = Math.max(...counts);
    return (reference(s) + (maxF - 1)) % 1000000007;
  };
  // Only counts k = 1 subsequences (each character at most once).
  const onlyK1 = (s) => {
    const counts = new Int32Array(26);
    for (let i = 0; i < s.length; i++) counts[s.charCodeAt(i) - 97]++;
    let ways = 1n;
    for (const c of counts) if (c > 0) ways = (ways * BigInt(1 + c)) % 1000000007n;
    return Number((ways - 1n + 1000000007n) % 1000000007n);
  };
  // Counts only single-letter subsequences (2^f - 1 per letter).
  const singleLetterOnly = (s) => {
    const counts = new Int32Array(26);
    for (let i = 0; i < s.length; i++) counts[s.charCodeAt(i) - 97]++;
    let ans = 0n;
    for (const c of counts) {
      if (!c) continue;
      let p = 1n;
      for (let i = 0; i < c; i++) p = (p * 2n) % 1000000007n;
      ans = (ans + p - 1n + 1000000007n) % 1000000007n;
    }
    return Number(ans);
  };
  for (const [name, wrong] of [['subtract once', subtractOnce], ['only k=1', onlyK1], ['single letter only', singleLetterOnly]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"aabb"').args, ['aabb']);
  assert.deepEqual(problem.parseCustomInput('aabb').args, ['aabb']);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"AaBb"').ok, false);
  assert.equal(problem.parseCustomInput('"ab1"').ok, false);
  assert.equal(problem.parseCustomInput(`"${'a'.repeat(10001)}"`).ok, false);
  assert.equal(problem.solveReference(['aabb']), 11);
});
