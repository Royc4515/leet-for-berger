import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/abbrev-match/problem.js';

// Brute force: expand the shorthand into a pattern of letters and "any one letter" wildcards
// (a number n becomes n wildcards) and compare it with the word position by position. Only usable
// for small numbers, which is all the random inputs use.
function brute(word, abbr) {
  const tokens = abbr.match(/[a-z]|[0-9]+/g) ?? [];
  if (tokens.join('') !== abbr) return false;
  let pattern = [];
  for (const tok of tokens) {
    if (/^[0-9]+$/.test(tok)) {
      if (tok[0] === '0') return false;
      pattern = pattern.concat(Array(Number(tok)).fill('?'));
    } else {
      pattern.push(tok);
    }
  }
  if (pattern.length !== word.length) return false;
  return pattern.every((p, i) => p === '?' || p === word[i]);
}

/** A random word and either a valid shorthand of it or a random mutation of one. */
function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 12);
  let word = '';
  for (let i = 0; i < n; i++) word += 'ab'[Math.floor(rnd() * 2)];
  let abbr = '';
  let i = 0;
  let lastNumber = false;
  while (i < n) {
    if (!lastNumber && rnd() < 0.5) {
      const run = 1 + Math.floor(rnd() * (n - i));
      abbr += run;
      i += run;
      lastNumber = true;
    } else {
      abbr += word[i++];
      lastNumber = false;
    }
  }
  const roll = rnd();
  if (roll < 0.3) {
    // Change one character.
    const k = Math.floor(rnd() * abbr.length);
    abbr = abbr.slice(0, k) + '0123ab'[Math.floor(rnd() * 6)] + abbr.slice(k + 1);
  } else if (roll < 0.45) {
    abbr += '1';
  } else if (roll < 0.55) {
    abbr = abbr.slice(0, -1) || 'a';
  }
  return [word, abbr];
}

test('reference matches brute force on 3000 random pairs', () => {
  const rnd = mulberry32(408);
  let trues = 0;
  for (let i = 0; i < 3000; i++) {
    const [w, a] = randomCase(rnd);
    const got = reference(w, a);
    if (got) trues++;
    assert.equal(got, brute(w, a), `${w} ${a}`);
  }
  // The random cases must exercise both answers.
  assert.ok(trues > 600 && trues < 2600, `true count ${trues}`);
});

test('5 visible and 10 hidden cases, visible agree, at least two max-size inputs, inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const parsed = problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`);
    assert.equal(parsed.ok, true, parsed.error);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  // Both answers appear, with the same count among the hidden tests.
  assert.equal(problem.hiddenTests.filter((t) => t.expected).length, 5);
  // Small hidden cases agree with the brute force.
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length < 100)) assert.equal(brute(...t.args), t.expected);
  // A 9-digit number would need a billion-letter expansion: the hidden set contains one.
  assert.ok(problem.hiddenTests.some((t) => /[0-9]{9}/.test(t.args[1])));
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Reads every digit as its own number: "a10" skips one letter, then zero.
  const singleDigits = (word, abbr) => {
    let i = 0;
    for (const c of abbr) {
      if (c >= '0' && c <= '9') i += Number(c);
      else if (word[i] === c) i++;
      else return false;
    }
    return i === word.length;
  };
  // Does not reject a number with a leading zero.
  const allowsLeadingZero = (word, abbr) => {
    let i = 0;
    let j = 0;
    while (i < word.length && j < abbr.length) {
      if (abbr[j] >= '0' && abbr[j] <= '9') {
        let num = 0;
        while (j < abbr.length && abbr[j] >= '0' && abbr[j] <= '9') num = num * 10 + Number(abbr[j++]);
        i += num;
      } else {
        if (word[i] !== abbr[j]) return false;
        i++;
        j++;
      }
    }
    return i === word.length && j === abbr.length;
  };
  // Forgets to check that the word is used up completely.
  const ignoresLeftover = (word, abbr) => {
    let i = 0;
    let j = 0;
    while (i < word.length && j < abbr.length) {
      if (abbr[j] === '0') return false;
      if (abbr[j] >= '0' && abbr[j] <= '9') {
        let num = 0;
        while (j < abbr.length && abbr[j] >= '0' && abbr[j] <= '9') num = num * 10 + Number(abbr[j++]);
        i += num;
      } else {
        if (word[i] !== abbr[j]) return false;
        i++;
        j++;
      }
    }
    return j === abbr.length;
  };
  // Accepts a skip that overshoots the word (only checks that i does not fall short).
  const allowsOvershoot = (word, abbr) => {
    let i = 0;
    let j = 0;
    while (j < abbr.length) {
      if (abbr[j] === '0') return false;
      if (abbr[j] >= '0' && abbr[j] <= '9') {
        let num = 0;
        while (j < abbr.length && abbr[j] >= '0' && abbr[j] <= '9') num = num * 10 + Number(abbr[j++]);
        i += num;
      } else {
        if (word[i] !== abbr[j]) return false;
        i++;
        j++;
      }
    }
    return i >= word.length;
  };
  for (const [name, wrong] of [['single digits', singleDigits], ['leading zero allowed', allowsLeadingZero], ['ignores leftover', ignoresLeftover], ['allows overshoot', allowsOvershoot]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"apple"\n"a3e"').args, ['apple', 'a3e']);
  assert.equal(problem.parseCustomInput('"apple"').ok, false);
  assert.equal(problem.parseCustomInput('apple\n"a3e"').ok, false);
  assert.equal(problem.parseCustomInput('""\n"a"').ok, false);
  assert.equal(problem.parseCustomInput('"apple"\n""').ok, false);
  assert.equal(problem.parseCustomInput('"Apple"\n"a3e"').ok, false);
  assert.equal(problem.parseCustomInput('"apple"\n"A3e"').ok, false);
  assert.equal(problem.parseCustomInput('"apple"\n"a-3"').ok, false);
  assert.equal(problem.parseCustomInput('"apple"\n"1234567890"').ok, false);
  assert.equal(problem.parseCustomInput('"apple"\n"123456789"').ok, true);
  assert.equal(problem.parseCustomInput(`"${'a'.repeat(100001)}"\n"1"`).ok, false);
  assert.equal(problem.solveReference(['apple', 'a3e']), true);
  assert.equal(problem.solveReference(['apple', 'a2e']), false);
});
