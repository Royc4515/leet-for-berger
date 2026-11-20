import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/balanced-pairs/problem.js';

// Brute force: every one of the 2^(2n) bracket strings, kept when a left-to-right scan never goes
// below zero, ends at zero and never exceeds the depth limit. Sorted at the end, so the order
// does not come from the search at all.
function brute(n, maxDepth) {
  const out = [];
  for (let mask = 0; mask < 1 << (2 * n); mask++) {
    let s = '';
    let depth = 0;
    let ok = true;
    for (let i = 2 * n - 1; i >= 0 && ok; i--) {
      if ((mask >> i) & 1) {
        s += ')';
        ok = --depth >= 0;
      } else {
        s += '(';
        ok = ++depth <= maxDepth;
      }
    }
    if (ok && depth === 0) out.push(s);
  }
  return out.sort();
}

test('reference matches brute force for every (n, maxDepth) up to n = 7, plus 1000 seeded repeats', () => {
  let cases = 0;
  for (let n = 1; n <= 7; n++) {
    for (let d = 1; d <= n; d++) {
      assert.deepEqual(reference(n, d), brute(n, d), `${n},${d}`);
      cases++;
    }
  }
  // The same small domain again, drawn from a seeded generator (1000+ checks in total).
  const rnd = mulberry32(22);
  for (let i = 0; i < 1000; i++) {
    const n = 1 + Math.floor(rnd() * 6);
    const d = 1 + Math.floor(rnd() * n);
    assert.deepEqual(reference(n, d), brute(n, d), `${n},${d}`);
    cases++;
  }
  assert.ok(cases >= 1000);
  // Catalan numbers when the limit never applies.
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => reference(n, n).length), [1, 2, 5, 14, 42, 132]);
  assert.equal(reference(11, 11).length, 58786);
});

test('5 visible and 10 hidden cases, visible expectations agree, max-size inputs', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(t.args.join('\n')).ok, true, String(t.args));
  // At least two hidden cases at the largest n, one with tens of thousands of strings.
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] === 11).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected.length === 58786));
  // All distinct inputs, and every answer is sorted and free of duplicates.
  assert.equal(new Set([...problem.visibleTests, ...problem.hiddenTests].map((t) => t.args.join())).size, 15);
  for (const t of problem.hiddenTests) assert.deepEqual(t.expected, [...new Set(t.expected)].sort());
  for (const t of problem.hiddenTests.filter((x) => x.args[0] <= 7)) assert.deepEqual(brute(...t.args), t.expected);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Searches with the right counts but only checks "closed <= n" for closing, so strings that close
  // before opening such as "())(" appear.
  const looseClose = (n, maxDepth) => {
    const out = [];
    const dfs = (s, open, close) => {
      if (s.length === 2 * n) return out.push(s);
      if (open < n && open - close < maxDepth) dfs(s + '(', open + 1, close);
      if (close < n) dfs(s + ')', open, close + 1);
    };
    dfs('', 0, 0);
    return out;
  };
  // Ignores the depth limit (the classic problem).
  const noLimit = (n) => reference(n, n);
  // Tries ")" before "(": every string is found but in the wrong order.
  const closeFirst = (n, maxDepth) => {
    const out = [];
    const dfs = (s, open, close) => {
      if (s.length === 2 * n) return out.push(s);
      if (close < open) dfs(s + ')', open, close + 1);
      if (open < n && open - close < maxDepth) dfs(s + '(', open + 1, close);
    };
    dfs('', 0, 0);
    return out;
  };
  // Builds by wrapping and concatenating smaller answers, which loses the depth limit tracking
  // (depth of "(" + a + ")" is not checked) and the dictionary order.
  const wrapAndJoin = (n) => {
    const memo = [['']];
    for (let m = 1; m <= n; m++) {
      memo[m] = [];
      for (let i = 0; i < m; i++) for (const a of memo[i]) for (const b of memo[m - 1 - i]) memo[m].push(`(${a})${b}`);
    }
    return memo[n];
  };
  for (const [name, wrong] of [['loose close rule', looseClose], ['ignores depth limit', noLimit], ['closes first', closeFirst], ['wrap and join', wrapAndJoin]]) {
    assert.ok(all.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('3\n2').args, [3, 2]);
  assert.equal(problem.parseCustomInput('3').ok, false);
  assert.equal(problem.parseCustomInput('0\n1').ok, false);
  assert.equal(problem.parseCustomInput('12\n3').ok, false);
  assert.equal(problem.parseCustomInput('3\n4').ok, false);
  assert.equal(problem.parseCustomInput('3\n0').ok, false);
  assert.equal(problem.parseCustomInput('a\nb').ok, false);
  assert.deepEqual(problem.solveReference([2, 1]), ['()()']);
});
