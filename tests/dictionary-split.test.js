import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/dictionary-split/problem.js';

// Brute force: try every first piece with plain recursion, no memo. Independent of the table.
function brute(text, words) {
  const set = new Set(words);
  const go = (i) => {
    if (i === text.length) return true;
    for (let j = i + 1; j <= text.length; j++) if (set.has(text.slice(i, j)) && go(j)) return true;
    return false;
  };
  return go(0);
}

// Classic wrong answer: at each spot take the longest word that fits, never back up.
function longestFirst(text, words) {
  let i = 0;
  while (i < text.length) {
    const fit = words.filter((w) => text.startsWith(w, i)).sort((a, b) => b.length - a.length)[0];
    if (!fit) return false;
    i += fit.length;
  }
  return true;
}

// Classic wrong answer: same, with the shortest word.
function shortestFirst(text, words) {
  let i = 0;
  while (i < text.length) {
    const fit = words.filter((w) => text.startsWith(w, i)).sort((a, b) => a.length - b.length)[0];
    if (!fit) return false;
    i += fit.length;
  }
  return true;
}

// Classic wrong answer: every word may be used at most once.
function eachOnce(text, words) {
  const go = (i, used) => {
    if (i === text.length) return true;
    return words.some((w, k) => !used.has(k) && text.startsWith(w, i) && go(i + w.length, new Set([...used, k])));
  };
  return text.length <= 40 && words.length <= 40 ? go(0, new Set()) : reference(text, words);
}

// Classic wrong answer: only checks that every letter of the text occurs in some word.
function lettersOnly(text, words) {
  const letters = new Set(words.join(''));
  return [...text].every((ch) => letters.has(ch));
}

function randomCase(rnd) {
  const alphabet = 'abc'.slice(0, 2 + Math.floor(rnd() * 2));
  const word = (max) => {
    let w = '';
    const len = 1 + Math.floor(rnd() * max);
    for (let i = 0; i < len; i++) w += alphabet[Math.floor(rnd() * alphabet.length)];
    return w;
  };
  const words = [...new Set(Array.from({ length: 1 + Math.floor(rnd() * 5) }, () => word(4)))];
  let text;
  if (rnd() < 0.6) {
    text = '';
    const pieces = 1 + Math.floor(rnd() * 4);
    for (let i = 0; i < pieces; i++) text += words[Math.floor(rnd() * words.length)];
    // Half of the glued texts get one letter changed, which usually (not always) breaks them.
    if (rnd() < 0.5) {
      const at = Math.floor(rnd() * text.length);
      text = text.slice(0, at) + alphabet[Math.floor(rnd() * alphabet.length)] + text.slice(at + 1);
    }
  } else {
    text = word(12);
  }
  return [text, words];
}

test('reference matches brute force on 3000 random inputs', () => {
  const rnd = mulberry32(139);
  let yes = 0;
  for (let i = 0; i < 3000; i++) {
    const [text, words] = randomCase(rnd);
    const expected = brute(text, words);
    assert.equal(reference(text, words), expected, JSON.stringify([text, words]));
    if (expected) yes++;
  }
  assert.ok(yes > 600 && yes < 2400, `true answers: ${yes} of 3000`);
});

test('visible expectations agree; 15 valid cases; both outcomes; full-size cases', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
  for (const t of problem.visibleTests) assert.equal(brute(...t.args), t.expected);
  const results = problem.hiddenTests.map((t) => t.expected);
  assert.ok(results.filter(Boolean).length >= 3 && results.filter((r) => !r).length >= 3);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 1999).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [longestFirst, shortestFirst, eachOnce, lettersOnly]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('plain recursion without a memo is exponential on the aaa...ab case', () => {
  // The brute force above is the memo-less recursion; count its calls on a short version of the
  // hidden shape. Twenty extra letters multiply the work, so 2000 can never finish in time.
  const calls = (n) => {
    let count = 0;
    const set = new Set(['a', 'aa', 'aaa']);
    const text = 'a'.repeat(n) + 'b';
    const go = (i) => {
      count++;
      if (i === text.length) return true;
      for (let j = i + 1; j <= Math.min(text.length, i + 3); j++) if (set.has(text.slice(i, j)) && go(j)) return true;
      return false;
    };
    go(0);
    return count;
  };
  assert.ok(calls(24) > 20 * calls(12));
});

test('custom input parser rejects bad values', () => {
  assert.deepEqual(problem.parseCustomInput('"leetcode"\n["leet","code"]').args, ['leetcode', ['leet', 'code']]);
  assert.equal(problem.parseCustomInput('"abc"').ok, false);
  assert.equal(problem.parseCustomInput('"Abc"\n["a"]').ok, false);
  assert.equal(problem.parseCustomInput('""\n["a"]').ok, false);
  assert.equal(problem.parseCustomInput('"abc"\n[]').ok, false);
  assert.equal(problem.parseCustomInput('"abc"\n["a","a"]').ok, false);
  assert.equal(problem.parseCustomInput('"abc"\n["abcdefghijklmnopqrstu"]').ok, false);
  assert.equal(problem.parseCustomInput('"abc"\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('nope\n[]').ok, false);
});
