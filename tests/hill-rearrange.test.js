import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference, isHill } from '../src/js/problems/hill-rearrange/problem.js';

// Brute force: breadth-first search over every string reachable by swapping two neighboring hill
// substrings, then the largest one. It uses the move exactly as stated and no structure theory.
function brute(s) {
  const seen = new Set([s]);
  const queue = [s];
  while (queue.length) {
    const cur = queue.pop();
    const n = cur.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 2; j < n; j += 2) {
        if (!isHill(cur.slice(i, j))) continue;
        for (let k = j + 2; k <= n; k += 2) {
          if (!isHill(cur.slice(j, k))) continue;
          const next = cur.slice(0, i) + cur.slice(j, k) + cur.slice(i, j) + cur.slice(k);
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
    }
  }
  return [...seen].sort().pop();
}

/** A random hill of length 2 * pairs, built by gluing and wrapping smaller random hills. */
function randomHill(rnd, pairs) {
  if (pairs === 0) return '';
  const inner = Math.floor(rnd() * pairs);
  return '1' + randomHill(rnd, inner) + '0' + randomHill(rnd, pairs - 1 - inner);
}

test('reference matches brute force on 1500 random hills up to length 14', () => {
  const rnd = mulberry32(761);
  const seen = new Set();
  let changed = 0;
  for (let i = 0; i < 1500; i++) {
    const s = randomHill(rnd, 1 + Math.floor(rnd() * 7));
    assert.ok(isHill(s));
    seen.add(s);
    if (reference(s) !== s) changed++;
    assert.equal(reference(s), brute(s), s);
  }
  assert.ok(seen.size > 100, `${seen.size} distinct hills`);
  assert.ok(changed > 200, `${changed} inputs where a rearrangement helps`);
});

test('5 visible and 10 hidden cases, visible expectations agree, max-size inputs', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const parsed = problem.parseCustomInput(JSON.stringify(t.args[0]));
    assert.equal(parsed.ok, true, parsed.error ?? t.args[0].slice(0, 30));
    // The answer is a rearrangement of the same string: same length, same counts, still a hill.
    assert.equal(t.expected.length, t.args[0].length);
    assert.ok(isHill(t.expected));
    assert.ok(t.expected >= t.args[0]);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 1000).length >= 4);
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 12)) assert.equal(brute(...t.args), t.expected);
  // At least one hidden case where a rearrangement actually changes the string at depth.
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] !== t.expected).length >= 4);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  /** Top-level hills of s. */
  const split = (s) => {
    const parts = [];
    let h = 0;
    let start = 0;
    for (let i = 0; i < s.length; i++) {
      h += s[i] === '1' ? 1 : -1;
      if (h === 0) {
        parts.push(s.slice(start, i + 1));
        start = i + 1;
      }
    }
    return parts;
  };
  // Sorts the top-level pieces only, never looking inside them.
  const topOnly = (s) => split(s).sort().reverse().join('');
  // Rearranges inside every piece but leaves the pieces in their original order.
  const insideOnly = (s) =>
    split(s)
      .map((p) => '1' + (p.length > 2 ? insideOnly(p.slice(1, -1)) : '') + '0')
      .join('');
  // Recurses correctly but sorts ascending.
  const ascending = (s) =>
    split(s)
      .map((p) => '1' + (p.length > 2 ? ascending(p.slice(1, -1)) : '') + '0')
      .sort()
      .join('');
  for (const [name, wrong] of [['top level only', topOnly], ['inside only', insideOnly], ['ascending order', ascending]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"1100"').args, ['1100']);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"1"').ok, false);
  assert.equal(problem.parseCustomInput('"01"').ok, false);
  assert.equal(problem.parseCustomInput('"1000"').ok, false);
  assert.equal(problem.parseCustomInput('"1010a"').ok, false);
  assert.equal(problem.parseCustomInput('1100').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify('10'.repeat(501))).ok, false);
  assert.equal(problem.solveReference(['101100']), '110010');
});
