import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference, fitsInt32 } from '../src/js/problems/plain-arithmetic/problem.js';

// Brute force with BigInt in two passes: first collapse every * and / (left to right, truncating),
// then sum the terms. Shares no running-term state with the reference.
function brute(s) {
  const tokens = s.match(/\d+|[-+*/]/g);
  const terms = [];
  let i = 0;
  let sign = 1n;
  while (i < tokens.length) {
    let value = BigInt(tokens[i++]);
    while (i < tokens.length && (tokens[i] === '*' || tokens[i] === '/')) {
      const n = BigInt(tokens[i + 1]);
      value = tokens[i] === '*' ? value * n : value / n;
      i += 2;
    }
    terms.push(sign * value);
    if (i < tokens.length) sign = tokens[i] === '+' ? 1n : -1n;
    i++;
  }
  return Number(terms.reduce((a, b) => a + b, 0n));
}

/**
 * One-pass scanner with the operator handling and two details made switchable, so each wrong
 * answer changes exactly one thing. `divide` is the division used on the signed open term.
 */
function scan(s, { divide = Math.trunc, accumulateDigits = true, flushOnTrailingSpace = true } = {}) {
  let total = 0;
  let last = 0;
  let num = 0;
  let op = '+';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const isDigit = c >= '0' && c <= '9';
    if (isDigit) num = accumulateDigits ? num * 10 + Number(c) : Number(c);
    const atEnd = i === s.length - 1 && (flushOnTrailingSpace || isDigit);
    if ((c !== ' ' && !isDigit) || atEnd) {
      if (op === '+') {
        total += last;
        last = num;
      } else if (op === '-') {
        total += last;
        last = -num;
      } else if (op === '*') last *= num;
      else last = divide(last / num);
      op = c;
      num = 0;
    }
  }
  return total + last;
}

// Wrong answer: no precedence, strictly left to right.
function leftToRight(s) {
  const t = s.match(/\d+|[-+*/]/g);
  let acc = Number(t[0]);
  for (let i = 1; i < t.length; i += 2) {
    const n = Number(t[i + 1]);
    acc = t[i] === '+' ? acc + n : t[i] === '-' ? acc - n : t[i] === '*' ? acc * n : Math.trunc(acc / n);
  }
  return acc;
}

// Wrong answer: in each term, does every * before any /, as if they had different ranks, so 8/2*3
// becomes 8/(2*3).
function mulBeforeDiv(s) {
  const t = s.match(/\d+|[-+*/]/g);
  let total = 0;
  let sign = 1;
  let i = 0;
  while (i < t.length) {
    // Collect the term: factors with the operator before each one.
    const factors = [{ op: '*', n: Number(t[i++]) }];
    while (i < t.length && (t[i] === '*' || t[i] === '/')) {
      factors.push({ op: t[i], n: Number(t[i + 1]) });
      i += 2;
    }
    // Fold the multiplications into the factor before them, then divide left to right.
    const merged = [factors[0]];
    for (const f of factors.slice(1)) {
      if (f.op === '*') merged[merged.length - 1].n *= f.n;
      else merged.push(f);
    }
    let value = merged[0].n;
    for (const f of merged.slice(1)) value = Math.trunc(value / f.n);
    total += sign * value;
    if (i < t.length) sign = t[i] === '+' ? 1 : -1;
    i++;
  }
  return total;
}

// Wrong answer: a signed term divided with Math.floor, as Python's // would.
const floorsNegative = (s) => scan(s, { divide: Math.floor });

// Wrong answer: reads one digit per number instead of accumulating digits.
const singleDigits = (s) => scan(s, { accumulateDigits: false });

// Wrong answer: the last number is only applied when the text ends in a digit, so a trailing space
// leaves it out.
const dropsLastWithTrailingSpace = (s) => scan(s, { flushOnTrailingSpace: false });

function randomExpr(rnd) {
  const terms = 1 + Math.floor(rnd() * 5);
  const sp = () => (rnd() < 0.3 ? ' '.repeat(1 + Math.floor(rnd() * 2)) : '');
  let out = sp();
  for (let t = 0; t < terms; t++) {
    if (t > 0) out += (rnd() < 0.5 ? '+' : '-') + sp();
    const factors = 1 + Math.floor(rnd() * 3);
    let divide = false;
    for (let f = 0; f < factors; f++) {
      if (f > 0) {
        divide = rnd() < 0.5;
        out += (divide ? '/' : '*') + sp();
      }
      // A divisor is never zero.
      const n = divide ? 1 + Math.floor(rnd() * 30) : Math.floor(rnd() * 31);
      out += String(n) + sp();
    }
  }
  return out;
}

test('reference matches brute force on 3000 random expressions', () => {
  const rnd = mulberry32(227);
  let negatives = 0;
  for (let i = 0; i < 3000; i++) {
    const s = randomExpr(rnd);
    assert.equal(reference(s), brute(s), JSON.stringify(s));
    if (reference(s) < 0) negatives++;
  }
  assert.ok(negatives > 300, `only ${negatives} negative results`);
});

test('visible expectations agree; every test input is valid, in 32-bit range, and agrees with brute force', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true, t.args[0].slice(0, 60));
    assert.ok(fitsInt32(t.args[0]));
    assert.equal(brute(t.args[0]), t.expected);
    assert.ok(Number.isSafeInteger(t.expected) && t.expected >= -(2 ** 31) && t.expected < 2 ** 31);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 290000).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  const wrongs = { leftToRight, mulBeforeDiv, floorsNegative, singleDigits, dropsLastWithTrailingSpace };
  for (const [name, wrong] of Object.entries(wrongs)) {
    assert.ok(suite.some((t) => wrong(t.args[0]) !== t.expected), `${name} passes every case`);
  }
  // The classic-bug scanners must also fail a hidden case, except the trailing-space one, which
  // only a text that ends with a space can show (the visible cases cover it).
  for (const [name, wrong] of Object.entries({ leftToRight, mulBeforeDiv, floorsNegative, singleDigits })) {
    assert.ok(problem.hiddenTests.some((t) => wrong(t.args[0]) !== t.expected), `${name} passes every hidden case`);
  }
  assert.ok(problem.visibleTests.some((t) => t.args[0].endsWith(' ')));
});

test('the wrong-answer scanners are right where they should be', () => {
  assert.equal(scan('2+3*4'), 14);
  assert.equal(scan(' 12 - 3 '), 9);
  assert.equal(mulBeforeDiv('8/2*3'), 1);
  assert.equal(leftToRight('8/2*3'), 12);
  assert.equal(reference('8/2*3'), 12);
});

test('floor division of a negative term is a different answer (the Python trap)', () => {
  assert.equal(reference('1-5/2'), -1);
  assert.equal(floorsNegative('1-5/2'), -2);
  assert.equal(reference('0-7/2'), -3);
  assert.equal(floorsNegative('0-7/2'), -4);
});

test('custom input parser rejects invalid expressions', () => {
  assert.equal(problem.parseCustomInput('" 3+2*2 "').ok, true);
  assert.equal(problem.parseCustomInput('"0"').ok, true);
  assert.equal(problem.parseCustomInput('"2147483647"').ok, true);
  assert.equal(problem.parseCustomInput('nope').ok, false);
  assert.equal(problem.parseCustomInput('42').ok, false);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"   "').ok, false);
  assert.equal(problem.parseCustomInput('"3+"').ok, false);
  assert.equal(problem.parseCustomInput('"+3"').ok, false);
  assert.equal(problem.parseCustomInput('"-3+1"').ok, false);
  assert.equal(problem.parseCustomInput('"3++2"').ok, false);
  assert.equal(problem.parseCustomInput('"3 2"').ok, false);
  assert.equal(problem.parseCustomInput('"(3+2)"').ok, false);
  assert.equal(problem.parseCustomInput('"3.5+2"').ok, false);
  assert.equal(problem.parseCustomInput('"3\\t+2"').ok, false);
  assert.equal(problem.parseCustomInput('"007+1"').ok, false);
  assert.equal(problem.parseCustomInput('"5/0"').ok, false);
  assert.equal(problem.parseCustomInput('"2147483648"').ok, false);
  assert.equal(problem.parseCustomInput('"65536*65536"').ok, false);
  assert.equal(problem.parseCustomInput('"2147483647+1"').ok, false);
  assert.equal(problem.parseCustomInput('"1/0*0"').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify('1+'.repeat(150000) + '1')).ok, false);
});
