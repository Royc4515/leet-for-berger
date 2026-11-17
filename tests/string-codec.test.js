import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/string-codec/problem.js';

// Independent model: encode by the statement's rule; decode with a small state machine that
// reads digits until '#' and then counts characters down.
function modelEncode(strs) {
  let out = '';
  for (const s of strs) out += String(s.length) + '#' + s;
  return out;
}

function modelDecode(s) {
  const out = [];
  let digits = '';
  let remaining = -1;
  let cur = '';
  for (const ch of s) {
    if (remaining < 0) {
      if (ch === '#') {
        remaining = Number(digits);
        digits = '';
        cur = '';
        if (remaining === 0) {
          out.push('');
          remaining = -1;
        }
      } else {
        digits += ch;
      }
    } else {
      cur += ch;
      remaining--;
      if (remaining === 0) {
        out.push(cur);
        remaining = -1;
      }
    }
  }
  return out;
}

function randomList(rnd) {
  const alphabet = ['#', '0', '1', '9', 'a', ' ', '~', '"', '\\'];
  return Array.from({ length: Math.floor(rnd() * 6) }, () => Array.from({ length: Math.floor(rnd() * 13) }, () => alphabet[Math.floor(rnd() * alphabet.length)]).join(''));
}

test('reference matches the independent model on 2000 random sessions', () => {
  const rnd = mulberry32(110);
  for (let k = 0; k < 2000; k++) {
    const ops = ['Codec'];
    const args = [[]];
    const want = [null];
    for (let c = 0; c < 1 + Math.floor(rnd() * 4); c++) {
      const list = randomList(rnd);
      if (rnd() < 0.5) {
        ops.push('encode');
        args.push([list]);
        want.push(modelEncode(list));
      } else {
        ops.push('decode');
        args.push([modelEncode(list)]);
        want.push(list);
      }
    }
    assert.deepEqual(reference(ops, args), want);
    // Round trip, and the model decoder agrees with the reference decoder.
    for (const a of args.slice(1)) {
      if (Array.isArray(a[0])) assert.deepEqual(modelDecode(modelEncode(a[0])), a[0]);
    }
    assert.equal(problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok, true);
  }
});

test('visible expectations agree; hidden tests round-trip; sizes; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
    const [ops, args] = t.args;
    ops.forEach((op, i) => {
      if (op === 'decode') assert.equal(modelEncode(t.expected[i]), args[i][0]);
      if (op === 'encode') assert.deepEqual(modelDecode(t.expected[i]), args[i][0]);
    });
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[1].some((a) => Array.isArray(a[0]) && a[0].length === 10000)).length >= 2);
});

test('custom input parser', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['Codec', 'encode'], [[], [['a']]]), true);
  assert.equal(ok(['Codec', 'decode'], [[], ['1#a']]), true);
  assert.equal(ok(['Codec', 'decode'], [[], ['2#a']]), false);
  assert.equal(ok(['Codec', 'decode'], [[], ['01#a']]), false);
  assert.equal(ok(['Codec', 'decode'], [[], ['a#']]), false);
  assert.equal(ok(['Codec', 'decode'], [[], ['1a']]), false);
  assert.equal(ok(['Codec', 'encode'], [[], [['tab\there']]]), false);
  assert.equal(ok(['Codec', 'encode'], [[], [['x'.repeat(1001)]]]), false);
  assert.equal(ok(['Codec', 'encode'], [[], [[1]]]), false);
  assert.equal(ok(['Codec', 'peek'], [[], ['']]), false);
  assert.equal(ok(['Codec2'], [[]]), false);
  assert.equal(ok(['Codec', ...new Array(21).fill('encode')], [[], ...new Array(21).fill([[]])]), false);
  assert.equal(problem.parseCustomInput('["Codec"]').ok, false);
});
