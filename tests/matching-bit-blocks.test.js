import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/matching-bit-blocks/problem.js';

// Brute force: test every substring against the definition, k of one bit then k of the other.
function brute(s) {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 2; j <= s.length; j += 2) {
      const t = s.slice(i, j);
      const k = t.length / 2;
      if (t === '0'.repeat(k) + '1'.repeat(k) || t === '1'.repeat(k) + '0'.repeat(k)) count++;
    }
  }
  return count;
}

/** Random binary string, biased toward runs so borders are not rare. */
function randomBits(rnd, n) {
  let s = '';
  let bit = rnd() < 0.5 ? '0' : '1';
  while (s.length < n) {
    s += bit.repeat(1 + Math.floor(rnd() * 4));
    bit = bit === '0' ? '1' : '0';
  }
  return s.slice(0, n);
}

test('reference matches brute force on 2000 random strings', () => {
  const rnd = mulberry32(696);
  for (let i = 0; i < 1000; i++) {
    const s = randomBits(rnd, 1 + Math.floor(rnd() * 24));
    assert.equal(reference(s), brute(s), s);
  }
  for (let i = 0; i < 1000; i++) {
    let s = '';
    const n = 1 + Math.floor(rnd() * 14);
    for (let j = 0; j < n; j++) s += rnd() < 0.5 ? '0' : '1';
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
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length < 100)) assert.equal(brute(...t.args), t.expected);
  // Work of a scan from every start: the sum of the lengths a start has to look at. The two
  // long-run inputs push a quadratic solution past the limit.
  const scanWork = (s) => {
    let work = 0;
    let i = 0;
    while (i < s.length) {
      let j = i;
      while (j < s.length && s[j] === s[i]) j++;
      const run = j - i;
      // Each start inside this run reads the rest of the run and then, at most, the next one.
      work += (run * (run + 1)) / 2 + run * Math.min(run, s.length - j);
      i = j;
    }
    return work;
  };
  assert.ok(problem.hiddenTests.some((t) => scanWork(t.args[0]) > 1e9));
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Counts every substring with equal numbers of 0 and 1, grouped or not.
  const anyBalanced = (s) => {
    let count = 0;
    const seen = new Map([[0, 1]]);
    let bal = 0;
    for (const ch of s) {
      bal += ch === '1' ? 1 : -1;
      count += seen.get(bal) ?? 0;
      seen.set(bal, (seen.get(bal) ?? 0) + 1);
    }
    return count;
  };
  // Counts only distinct substrings (text), not positions.
  const distinct = (s) => {
    const found = new Set();
    for (let i = 0; i < s.length; i++) {
      for (let j = i + 2; j <= s.length; j += 2) {
        const t = s.slice(i, j);
        const k = t.length / 2;
        if (t === '0'.repeat(k) + '1'.repeat(k) || t === '1'.repeat(k) + '0'.repeat(k)) found.add(t);
      }
    }
    return found.size;
  };
  // Forgets the last border (no update after the loop).
  const missesLast = (s) => {
    let prev = 0;
    let cur = 1;
    let total = 0;
    for (let i = 1; i < s.length; i++) {
      if (s[i] === s[i - 1]) cur++;
      else {
        total += Math.min(prev, cur);
        prev = cur;
        cur = 1;
      }
    }
    return total;
  };
  // Uses max instead of min for a border.
  const useMax = (s) => {
    let prev = 0;
    let cur = 1;
    let total = 0;
    for (let i = 1; i < s.length; i++) {
      if (s[i] === s[i - 1]) cur++;
      else {
        total += Math.max(prev, cur);
        prev = cur;
        cur = 1;
      }
    }
    return total + Math.max(prev, cur);
  };
  // Counts a border once instead of once per matching length.
  const bordersOnly = (s) => {
    let n = 0;
    for (let i = 1; i < s.length; i++) if (s[i] !== s[i - 1]) n++;
    return n;
  };
  for (const [name, wrong] of [['any balanced substring', anyBalanced], ['distinct substrings', distinct], ['misses last border', missesLast], ['max instead of min', useMax], ['counts borders', bordersOnly]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"00110011"').args, ['00110011']);
  // An unquoted number is not a string.
  assert.equal(problem.parseCustomInput('00110011').ok, false);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"0012"').ok, false);
  assert.equal(problem.parseCustomInput('"ab"').ok, false);
  assert.equal(problem.parseCustomInput('[1,0]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify('0'.repeat(100001))).ok, false);
  assert.equal(problem.solveReference(['0011']), 2);
});
