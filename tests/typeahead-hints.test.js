import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/typeahead-hints/problem.js';

// Brute force: for every typed prefix, filter the full list and sort it. Independent of the
// sorted-block search.
function brute(products, word) {
  const out = [];
  for (let i = 1; i <= word.length; i++) {
    const prefix = word.slice(0, i);
    out.push(products.filter((p) => p.startsWith(prefix)).sort().slice(0, 3));
  }
  return out;
}

// Classic wrong answer: the first three matches in the given order.
function inputOrder(products, word) {
  const out = [];
  for (let i = 1; i <= word.length; i++) out.push(products.filter((p) => p.startsWith(word.slice(0, i))).slice(0, 3));
  return out;
}

// Classic wrong answer: the word may appear anywhere in the name.
function containsMatch(products, word) {
  const out = [];
  for (let i = 1; i <= word.length; i++) out.push(products.filter((p) => p.includes(word.slice(0, i))).sort().slice(0, 3));
  return out;
}

// Classic wrong answer: shortest names first, ties in dictionary order.
function lengthOrder(products, word) {
  const out = [];
  for (let i = 1; i <= word.length; i++) {
    out.push(products.filter((p) => p.startsWith(word.slice(0, i))).sort((a, b) => a.length - b.length || (a < b ? -1 : 1)).slice(0, 3));
  }
  return out;
}

// Classic wrong answer: every match, no cap of three.
function noCap(products, word) {
  const out = [];
  for (let i = 1; i <= word.length; i++) out.push(products.filter((p) => p.startsWith(word.slice(0, i))).sort());
  return out;
}

function randomCase(rnd) {
  const alphabet = 'abc'.slice(0, 2 + Math.floor(rnd() * 2));
  const name = () => {
    let w = '';
    const len = 1 + Math.floor(rnd() * 5);
    for (let i = 0; i < len; i++) w += alphabet[Math.floor(rnd() * alphabet.length)];
    return w;
  };
  const products = [...new Set(Array.from({ length: 1 + Math.floor(rnd() * 12) }, name))];
  // Half of the words are a prefix of a real name, half are random.
  const word = rnd() < 0.5 ? products[Math.floor(rnd() * products.length)] : name() + name().slice(0, 2);
  return [products, word];
}

test('reference matches the filter-and-sort brute force on 3000 random inputs', () => {
  const rnd = mulberry32(1268);
  for (let i = 0; i < 3000; i++) {
    const [products, word] = randomCase(rnd);
    assert.deepEqual(reference(products, word), brute(products, word), JSON.stringify([products, word]));
  }
});

test('visible expectations agree; 15 valid cases; four lists of 5 * 10^4 names', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
  for (const t of problem.visibleTests) assert.deepEqual(brute(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 50000).length >= 4);
  // The answers must include full rows, short rows and empty rows, or the suite proves little.
  const rows = problem.hiddenTests.flatMap((t) => t.expected);
  assert.ok(rows.some((r) => r.length === 3) && rows.some((r) => r.length > 0 && r.length < 3) && rows.some((r) => r.length === 0));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  // The 5 * 10^4-name lists make filtering per letter slow, so the wrong answers run on the small
  // hidden cases only; those are enough to tell them apart from the reference.
  const small = suite.filter((t) => t.args[0].length <= 10);
  for (const wrong of [inputOrder, containsMatch, lengthOrder, noCap]) {
    assert.ok(small.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every case`);
    const hiddenSmall = problem.hiddenTests.filter((t) => t.args[0].length <= 10);
    assert.ok(hiddenSmall.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every small hidden case`);
  }
});

test('custom input parser rejects bad values', () => {
  assert.deepEqual(problem.parseCustomInput('["mobile","mouse"]\n"mo"').args, [['mobile', 'mouse'], 'mo']);
  assert.equal(problem.parseCustomInput('["a"]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n"a"').ok, false);
  assert.equal(problem.parseCustomInput('["a","a"]\n"a"').ok, false);
  assert.equal(problem.parseCustomInput('["A"]\n"a"').ok, false);
  assert.equal(problem.parseCustomInput('["a"]\n""').ok, false);
  assert.equal(problem.parseCustomInput(`["a"]\n"${'a'.repeat(31)}"`).ok, false);
  assert.equal(problem.parseCustomInput('[1]\n"a"').ok, false);
  assert.equal(problem.parseCustomInput('nope\n"a"').ok, false);
});
