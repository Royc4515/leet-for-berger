import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/number-in-words/problem.js';

// Independent recursive reference + inverse parser to verify bijective round-trip on 2000 inputs.
const WORDS = {
  Zero: 0, One: 1, Two: 2, Three: 3, Four: 4, Five: 5, Six: 6, Seven: 7, Eight: 8, Nine: 9,
  Ten: 10, Eleven: 11, Twelve: 12, Thirteen: 13, Fourteen: 14, Fifteen: 15, Sixteen: 16,
  Seventeen: 17, Eighteen: 18, Nineteen: 19, Twenty: 20, Thirty: 30, Forty: 40, Fifty: 50,
  Sixty: 60, Seventy: 70, Eighty: 80, Ninety: 90,
};
const SCALE_VAL = { Thousand: 1000, Million: 1000000, Billion: 1000000000 };

function parseEnglish(text) {
  assert.ok(text.length > 0 && text === text.trim() && !text.includes('  '), `bad spacing: "${text}"`);
  if (text === 'Zero') return 0;
  let total = 0;
  let cur = 0;
  for (const tok of text.split(' ')) {
    if (tok === 'Hundred') {
      assert.ok(cur >= 1 && cur <= 9, `unexpected Hundred in "${text}"`);
      cur *= 100;
    } else if (SCALE_VAL[tok]) {
      assert.ok(cur > 0, `empty scale group in "${text}"`);
      total += cur * SCALE_VAL[tok];
      cur = 0;
    } else {
      assert.ok(WORDS[tok] > 0, `unknown or Zero word "${tok}" in "${text}"`);
      cur += WORDS[tok];
    }
  }
  return total + cur;
}

test('reference round-trips cleanly across 2000 seeded numbers plus edge values', () => {
  const edges = [0, 1, 9, 10, 11, 19, 20, 21, 99, 100, 101, 110, 999, 1000, 1001, 10000, 100000, 1000000, 1000000000, 2147483647];
  for (const n of edges) assert.equal(parseEnglish(reference(n)), n, `edge ${n}`);

  const rnd = mulberry32(273);
  for (let i = 0; i < 2000; i++) {
    const n = Math.floor(rnd() * 2147483648);
    assert.equal(parseEnglish(reference(n)), n, `random ${n}`);
  }
});

test('5 visible and 10 hidden cases, visible agree, inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
    assert.equal(parseEnglish(t.expected), t.args[0]);
  }
  assert.ok(problem.hiddenTests.some((t) => t.args[0] === 2147483647));
});

test('classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Returns empty string for 0 instead of "Zero".
  const emptyZero = (n) => (n === 0 ? '' : reference(n));
  // Emits "Thousand" even for a zero middle chunk.
  const emitsZeroScale = (n) => (n === 1000010 ? 'One Million Thousand Ten' : reference(n));
  // Leaves a trailing space on exact hundreds.
  const trailingSpace = (n) => (n % 100 === 0 && n > 0 ? `${reference(n)} ` : reference(n));
  for (const [name, wrong] of [['empty zero', emptyZero], ['zero middle scale', emitsZeroScale], ['trailing space', trailingSpace]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('12345').args, [12345]);
  assert.equal(problem.parseCustomInput('0').ok, true);
  assert.equal(problem.parseCustomInput('2147483647').ok, true);
  assert.equal(problem.parseCustomInput('-1').ok, false);
  assert.equal(problem.parseCustomInput('2147483648').ok, false);
  assert.equal(problem.parseCustomInput('12.5').ok, false);
  assert.equal(problem.parseCustomInput('"123"').ok, false);
  assert.equal(problem.solveReference([42]), 'Forty Two');
});
