import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/prefix-tree/problem.js';

// Brute force: a list of inserted words; search compares whole words, startsWith checks every
// word's beginning. Independent of the reference's trie.
function brute(ops, args) {
  const words = [];
  return ops.map((op, i) => {
    const s = args[i][0];
    if (op === 'insert') words.push(s);
    if (op === 'search') return words.includes(s);
    if (op === 'startsWith') return words.some((w) => w.startsWith(s));
    return null;
  });
}

test('reference matches brute force on 1000 random sessions', () => {
  const rnd = mulberry32(103);
  const word = () => {
    let s = '';
    const len = 1 + Math.floor(rnd() * 4);
    for (let i = 0; i < len; i++) s += 'abc'[Math.floor(rnd() * 3)];
    return s;
  };
  for (let t = 0; t < 1000; t++) {
    const ops = ['Trie'];
    const args = [[]];
    for (let i = 0; i < 30; i++) {
      const r = rnd();
      ops.push(r < 0.4 ? 'insert' : r < 0.7 ? 'search' : 'startsWith');
      args.push([word()]);
    }
    assert.deepEqual(reference(ops, args), brute(ops, args));
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests.slice(0, 6)) assert.deepEqual(t.expected, brute(...t.args));
  // 5 * 10^4 stored words queried 5 * 10^4 times: a list of words is billions of comparisons.
  const big = problem.hiddenTests.filter((t) => t.args[0].filter((o) => o === 'insert').length === 50000 && t.args[0].length === 100001);
  assert.ok(big.length >= 2);
  for (const t of big) assert.ok(t.expected.includes(false));
  assert.ok(big.some((t) => t.expected.includes(true)));
  assert.ok(problem.hiddenTests.some((t) => t.args[1].some((a) => a[0]?.length === 2000)));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
});

test('custom input parser rejects invalid sessions', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['Trie', 'insert', 'search', 'startsWith'], [[], ['a'], ['a'], ['a']]), true);
  assert.equal(ok(['Trie', 'insert'], [[], ['']]), false);
  assert.equal(ok(['Trie', 'insert'], [[], ['Abc']]), false);
  assert.equal(ok(['Trie', 'insert'], [[], ['a'.repeat(2001)]]), false);
  assert.equal(ok(['Trie', 'search'], [[], []]), false);
  assert.equal(ok(['Trie', 'delete'], [[], ['a']]), false);
  assert.equal(ok(['Trie', ...Array(300).fill('insert')], [[], ...Array(300).fill(['a'.repeat(2000)])]), false);
  assert.equal(ok(['Tree'], [[]]), false);
  assert.equal(problem.parseCustomInput('["Trie"]').ok, false);
});
