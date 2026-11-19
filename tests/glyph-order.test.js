import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/glyph-order/problem.js';

/** Is the list sorted when letters rank by their position in `order`? Prefix first. */
function sortedUnder(words, order) {
  const rank = {};
  [...order].forEach((ch, i) => (rank[ch] = i));
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i];
    const b = words[i + 1];
    const m = Math.min(a.length, b.length);
    let j = 0;
    while (j < m && a[j] === b[j]) j++;
    if (j === m ? a.length > b.length : rank[a[j]] > rank[b[j]]) return false;
  }
  return true;
}

// Brute force: walk every ordering of the letters in alphabetical (lexicographic) order and check
// the whole list under it; the first that fits is the answer. Builds no graph at all.
function brute(words) {
  const perm = [...new Set(words.join(''))].sort();
  const n = perm.length;
  for (;;) {
    if (sortedUnder(words, perm.join(''))) return perm.join('');
    let i = n - 2;
    while (i >= 0 && perm[i] >= perm[i + 1]) i--;
    if (i < 0) return '';
    let j = n - 1;
    while (perm[j] <= perm[i]) j--;
    [perm[i], perm[j]] = [perm[j], perm[i]];
    perm.splice(i + 1, n - i - 1, ...perm.slice(i + 1).reverse());
  }
}

/** Random small lists: sometimes sorted by a secret order (valid), sometimes not sorted at all. */
function randomWords(rnd) {
  const letters = 'abcdefg'.slice(0, 1 + Math.floor(rnd() * 6));
  const n = 1 + Math.floor(rnd() * 7);
  const words = Array.from({ length: n }, () => Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => letters[Math.floor(rnd() * letters.length)]).join(''));
  if (rnd() < 0.5) {
    const order = [...letters].map((c) => [c, rnd()]).sort((x, y) => x[1] - y[1]).map((x) => x[0]);
    words.sort((a, b) => {
      const m = Math.min(a.length, b.length);
      for (let i = 0; i < m; i++) if (a[i] !== b[i]) return order.indexOf(a[i]) - order.indexOf(b[i]);
      return a.length - b.length;
    });
  }
  return words;
}

test('reference matches brute force on 3000 random lists, both outcomes represented', () => {
  const rnd = mulberry32(269);
  let empty = 0;
  for (let i = 0; i < 3000; i++) {
    const words = randomWords(rnd);
    const want = brute(words);
    if (want === '') empty++;
    assert.equal(reference(words), want, JSON.stringify(words));
  }
  assert.ok(empty > 300 && empty < 2700, `${empty} invalid lists`);
});

test('5 visible and 10 hidden cases, visible expectations agree, max-size lists', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true, JSON.stringify(t.args[0]).slice(0, 80));
    // Every non-empty answer must really explain the list and use each letter once.
    if (t.expected) {
      assert.ok(sortedUnder(t.args[0], t.expected));
      assert.equal(new Set(t.expected).size, t.expected.length);
      assert.equal([...t.expected].sort().join(''), [...new Set(t.args[0].join(''))].sort().join(''));
    }
  }
  const big = problem.hiddenTests.filter((t) => t.args[0].length >= 20000);
  assert.ok(big.length >= 2);
  assert.deepEqual(big.map((t) => t.expected === ''), [false, false, true, true]);
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 12)) assert.equal(brute(...t.args), t.expected);
});

/** Kahn's algorithm, smallest free letter first, over the given letters and edges. */
function kahnSmallest(letters, edges) {
  const out = [];
  const left = new Set(letters);
  while (left.size) {
    const free = [...left].sort().find((c) => !edges.some(([u, v]) => v === c && left.has(u)));
    if (!free) return '';
    out.push(free);
    left.delete(free);
  }
  return out.join('');
}

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests].filter((t) => t.args[0].length <= 1000);
  const letters = (words) => [...new Set(words.join(''))];
  // Every differing position of a neighbor pair becomes an edge, not just the first one.
  const everyPosition = (words) => {
    const edges = [];
    for (let i = 0; i + 1 < words.length; i++) {
      const [a, b] = [words[i], words[i + 1]];
      if (a.length > b.length && a.startsWith(b)) return '';
      for (let j = 0; j < Math.min(a.length, b.length); j++) if (a[j] !== b[j]) edges.push([a[j], b[j]]);
    }
    return kahnSmallest(letters(words), edges);
  };
  // A longer word above its own prefix is skipped instead of rejected.
  const noPrefixRule = (words) => {
    const edges = [];
    for (let i = 0; i + 1 < words.length; i++) {
      const [a, b] = [words[i], words[i + 1]];
      const j = [...a].findIndex((ch, k) => ch !== b[k]);
      if (j >= 0 && j < b.length) edges.push([a[j], b[j]]);
    }
    return kahnSmallest(letters(words), edges);
  };
  // Letters that appear in no edge are left out.
  const edgeLettersOnly = (words) => {
    const r = reference(words);
    const inEdge = new Set();
    for (let i = 0; i + 1 < words.length; i++) {
      const [a, b] = [words[i], words[i + 1]];
      const j = [...a].findIndex((ch, k) => ch !== b[k]);
      if (j >= 0 && j < b.length) inEdge.add(a[j]).add(b[j]);
    }
    return [...r].filter((c) => inEdge.has(c)).join('');
  };
  for (const [name, wrong] of [['every-position edges', everyPosition], ['missing prefix rule', noPrefixRule], ['edge letters only', edgeLettersOnly]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
  // On every valid case up to 1000 words, the independent graph-plus-Kahn helper agrees with the reference.
  for (const t of all) assert.equal(noPrefixRule(...t.args) === t.expected || t.expected === '', true);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('["cb","ca"]').args, [['cb', 'ca']]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('["Ab"]').ok, false);
  assert.equal(problem.parseCustomInput('[""]').ok, false);
  assert.equal(problem.parseCustomInput(`["${'a'.repeat(51)}"]`).ok, false);
  assert.equal(problem.parseCustomInput('["a",1]').ok, false);
  assert.equal(problem.parseCustomInput('cb,ca').ok, false);
  assert.equal(problem.solveReference([['xz', 'xy']]), 'xzy');
});
