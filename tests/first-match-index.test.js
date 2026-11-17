import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/first-match-index/problem.js';

// Brute force: compare the needle at every position.
function brute(haystack, needle) {
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    let j = 0;
    while (j < needle.length && haystack[i + j] === needle[j]) j++;
    if (j === needle.length) return i;
  }
  return -1;
}

const randomText = (rnd, n, k) => Array.from({ length: n }, () => 'abc'[Math.floor(rnd() * k)]).join('');

test('reference matches brute force on 3000 random small pairs', () => {
  const rnd = mulberry32(50);
  for (let k = 0; k < 3000; k++) {
    const letters = 1 + Math.floor(rnd() * 3);
    const haystack = randomText(rnd, 1 + Math.floor(rnd() * 20), letters);
    // Half the needles are cut from the haystack so matches are common.
    let needle;
    if (rnd() < 0.5) {
      const i = Math.floor(rnd() * haystack.length);
      needle = haystack.slice(i, i + 1 + Math.floor(rnd() * 6));
    } else {
      needle = randomText(rnd, 1 + Math.floor(rnd() * 6), letters);
    }
    assert.equal(reference(haystack, needle), brute(haystack, needle), `${haystack} / ${needle}`);
  }
  assert.equal(reference('ab', 'abc'), -1);
});

test('hidden expectations agree with the brute force on the small cases; sizes are adversarial', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests.filter((h) => h.args[0].length < 100)) assert.equal(t.expected, brute(...t.args));
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  for (const t of all) assert.equal(problem.parseCustomInput(t.args.join('\n')).ok, true);
  // At least two max-size texts with needles of 10^5 or more: quadratic scans need ~10^10 steps.
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 500000 && t.args[1].length >= 100000).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('hello\nll'), { ok: true, args: ['hello', 'll'] });
  assert.deepEqual(problem.parseCustomInput('"aaa"\n"aaaa"'), { ok: true, args: ['aaa', 'aaaa'] });
  assert.equal(problem.parseCustomInput('hello').ok, false);
  assert.equal(problem.parseCustomInput('hello\nLL').ok, false);
  assert.equal(problem.parseCustomInput('hel lo\nl').ok, false);
  assert.equal(problem.parseCustomInput(`${'a'.repeat(500001)}\na`).ok, false);
  assert.equal(problem.parseCustomInput('a\nb\nc').ok, false);
});
