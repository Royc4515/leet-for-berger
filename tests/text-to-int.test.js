import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/text-to-int/problem.js';

const INT_MAX = 2147483647;
const INT_MIN = -2147483648;

// Brute force with a regular expression and exact BigInt arithmetic: no early stop, no clamping
// tricks. Independent of the scan.
function brute(s) {
  const m = /^ *([+-]?)([0-9]+)/.exec(s);
  if (!m) return 0;
  let v = BigInt(m[2]);
  if (m[1] === '-') v = -v;
  if (v > BigInt(INT_MAX)) return INT_MAX;
  if (v < BigInt(INT_MIN)) return INT_MIN;
  return Number(v);
}

// Classic wrong answers.
const wrapsAround = (s) => {
  const m = /^ *([+-]?)([0-9]+)/.exec(s);
  if (!m) return 0;
  const v = BigInt(m[2]) * (m[1] === '-' ? -1n : 1n);
  return Number(BigInt.asIntN(32, v));
};
const clampsPositiveOnly = (s) => {
  const m = /^ *([+-]?)([0-9]+)/.exec(s);
  if (!m) return 0;
  const v = BigInt(m[2]) * (m[1] === '-' ? -1n : 1n);
  return v > BigInt(INT_MAX) ? INT_MAX : Number(BigInt.asIntN(32, v));
};
const symmetricMin = (s) => Math.max(-INT_MAX, reference(s));
const spaceAfterSign = (s) => {
  const m = /^ *([+-]?) *([0-9]+)/.exec(s);
  if (!m) return 0;
  return reference(`${m[1]}${m[2]}`);
};
const secondSign = (s) => {
  const m = /^ *[+-]?([+-]?)([0-9]+)/.exec(s);
  if (!m) return 0;
  return reference(`${m[1]}${m[2]}`);
};
const ignoresStop = (s) => {
  const digits = s.replace(/[^0-9]/g, '');
  return digits ? reference((s.includes('-') ? '-' : '') + digits) : 0;
};

const ALPHABET = ' +-.0123456789ab';

/** Random text from a small alphabet, biased to start like a number. */
function randomText(rnd, maxLen) {
  const len = Math.floor(rnd() * maxLen);
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(rnd() * ALPHABET.length)];
  const prefix = ['', ' ', '  -', '+', '-', ' +0'][Math.floor(rnd() * 6)];
  return prefix + s;
}

test('reference matches brute force on 4000 random texts', () => {
  const rnd = mulberry32(99);
  const outcomes = new Set();
  for (let i = 0; i < 4000; i++) {
    const s = randomText(rnd, 16);
    assert.equal(reference(s), brute(s), JSON.stringify(s));
    outcomes.add(reference(s) === INT_MAX ? 'max' : reference(s) === INT_MIN ? 'min' : reference(s) === 0 ? 'zero' : 'other');
  }
  assert.ok(outcomes.has('other') && outcomes.has('zero') && outcomes.has('max') && outcomes.has('min'), [...outcomes].join());
  assert.ok(Object.is(reference('-0'), 0), '-0 must be 0');
});

test('visible expectations agree; 5 visible, 10 hidden, three at the 10^5 limit', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(brute(...t.args), t.expected);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.ok(t.expected >= INT_MIN && t.expected <= INT_MAX);
  }
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [wrapsAround, clampsPositiveOnly, symmetricMin, spaceAfterSign, secondSign, ignoresStop]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"   -42 with words"'), { ok: true, args: ['   -42 with words'] });
  assert.deepEqual(problem.parseCustomInput('""'), { ok: true, args: [''] });
  assert.equal(problem.parseCustomInput('"1e5"').ok, true);
  assert.equal(problem.parseCustomInput('"12_3"').ok, false);
  assert.equal(problem.parseCustomInput('"12\\t3"').ok, false);
  assert.equal(problem.parseCustomInput(`"${'1'.repeat(100001)}"`).ok, false);
  assert.equal(problem.parseCustomInput('42').ok, false);
  assert.equal(problem.parseCustomInput('not json').ok, false);
});
