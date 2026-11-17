import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/string-gcd/problem.js';

// Brute force: straight from the definition, try every prefix of str1 from longest to shortest.
const divides = (x, s) => s.length % x.length === 0 && x.repeat(s.length / x.length) === s;
function brute(str1, str2) {
  for (let len = str1.length; len >= 1; len--) {
    const x = str1.slice(0, len);
    if (divides(x, str1) && divides(x, str2)) return x;
  }
  return '';
}

test('reference matches brute force on 3000 random pairs', () => {
  const rnd = mulberry32(92);
  const word = (len, alphabet) => Array.from({ length: len }, () => alphabet[Math.floor(rnd() * alphabet.length)]).join('');
  for (let i = 0; i < 3000; i++) {
    let str1;
    let str2;
    if (i % 2) {
      // Repetitions of a shared unit, so non-empty answers are common.
      const unit = word(1 + Math.floor(rnd() * 3), 'AB');
      str1 = unit.repeat(1 + Math.floor(rnd() * 6));
      str2 = unit.repeat(1 + Math.floor(rnd() * 6));
      if (rnd() < 0.3) str2 = str2.slice(0, -1) + (str2.endsWith('A') ? 'B' : 'A');
    } else {
      str1 = word(1 + Math.floor(rnd() * 8), 'AB');
      str2 = word(1 + Math.floor(rnd() * 8), 'AB');
    }
    assert.equal(reference(str1, str2), brute(str1, str2), `${str1} ${str2}`);
  }
});

test('visible expectations agree; hidden tests mix answers; sizes as declared; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
  assert.ok(problem.hiddenTests.some((t) => t.expected === ''));
  assert.ok(problem.hiddenTests.some((t) => t.expected.length > 1));
  assert.ok(problem.hiddenTests.filter((t) => Math.max(t.args[0].length, t.args[1].length) >= 99995).length >= 2);
  // The 10^5 cases agree with the definition too.
  for (const t of problem.hiddenTests.slice(6)) {
    assert.equal(t.expected === '' || (divides(t.expected, t.args[0]) && divides(t.expected, t.args[1])), true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('"ABC"').ok, false);
  assert.equal(problem.parseCustomInput('"abc"\n"ABC"').ok, false);
  assert.equal(problem.parseCustomInput('""\n"ABC"').ok, false);
  assert.equal(problem.parseCustomInput('ABC\nABC').ok, false);
  assert.equal(problem.parseCustomInput(`"${'A'.repeat(100001)}"\n"A"`).ok, false);
  assert.deepEqual(problem.parseCustomInput('"AB"\n"ABAB"'), { ok: true, args: ['AB', 'ABAB'] });
});
