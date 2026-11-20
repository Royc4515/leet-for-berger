import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/unfold-brackets/problem.js';

// Brute force: rewrite the innermost group k[letters] (no bracket inside) until none is left.
// Pure text substitution, no stack and no counters.
function brute(s) {
  const innermost = /(\d+)\[([a-z]*)\]/;
  while (innermost.test(s)) s = s.replace(innermost, (_, k, text) => text.repeat(Number(k)));
  return s;
}

/** A small random well-formed encoding, nested up to `depth` levels. */
function randomEncoding(rnd, depth) {
  let out = '';
  const parts = 1 + Math.floor(rnd() * 3);
  for (let i = 0; i < parts; i++) {
    if (depth > 0 && rnd() < 0.55) {
      const k = rnd() < 0.2 ? 10 + Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 4);
      out += `${k}[${randomEncoding(rnd, depth - 1)}]`;
    } else {
      out += 'abcxyz'[Math.floor(rnd() * 6)].repeat(1 + Math.floor(rnd() * 2));
    }
  }
  return out;
}

test('reference matches brute force on 1500 random encodings', () => {
  const rnd = mulberry32(394);
  for (let i = 0; i < 1500; i++) {
    const s = randomEncoding(rnd, 1 + Math.floor(rnd() * 4));
    assert.equal(reference(s), brute(s), s);
  }
});

test('5 visible and 10 hidden cases, visible expectations agree, max-size inputs', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const parsed = problem.parseCustomInput(JSON.stringify(t.args[0]));
    assert.equal(parsed.ok, true, parsed.error ?? t.args[0].slice(0, 40));
    assert.ok(t.expected.length >= 1 && t.expected.length <= 100000);
  }
  // At least two hidden cases decode to 50000+ characters, and one input is the 2000-deep chain.
  assert.ok(problem.hiddenTests.filter((t) => t.expected.length >= 50000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.args[0].length > 5000));
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length < 100)) assert.equal(brute(...t.args), t.expected);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Reads one digit as the whole count: "10[a]" becomes 0 copies.
  const singleDigit = (s) => {
    let out = '';
    const stack = [];
    let k = 0;
    for (const ch of s) {
      if (ch >= '0' && ch <= '9') k = ch.charCodeAt(0) - 48;
      else if (ch === '[') {
        stack.push([out.length, k]);
        k = 0;
      } else if (ch === ']') {
        const [start, times] = stack.pop();
        out += out.slice(start).repeat(Math.max(0, times - 1));
      } else out += ch;
    }
    return out;
  };
  // Expands only one level: groups that contain other groups are left alone.
  const onePass = (s) => s.replace(/(\d+)\[([a-z]*)\]/g, (_, k, text) => text.repeat(Number(k)));
  // Repeats the group but drops the text that follows it.
  const dropsTail = (s) => reference(s.slice(0, s.lastIndexOf(']') + 1));
  for (const [name, wrong] of [['one-digit counts', singleDigit], ['single pass', onePass], ['drops trailing text', dropsTail]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"2[ab]c"').args, ['2[ab]c']);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"2[ab"').ok, false);
  assert.equal(problem.parseCustomInput('"ab]"').ok, false);
  assert.equal(problem.parseCustomInput('"[ab]"').ok, false);
  assert.equal(problem.parseCustomInput('"2[]"').ok, false);
  assert.equal(problem.parseCustomInput('"0[a]"').ok, false);
  assert.equal(problem.parseCustomInput('"02[a]"').ok, false);
  assert.equal(problem.parseCustomInput('"301[a]"').ok, false);
  assert.equal(problem.parseCustomInput('"3a"').ok, false);
  assert.equal(problem.parseCustomInput('"2[A]"').ok, false);
  assert.equal(problem.parseCustomInput('"300[300[ab]]"').ok, false);
  assert.equal(problem.parseCustomInput('"300[300[ab]]"').error, 'The decoded string may have at most 10^5 characters.');
  assert.equal(problem.parseCustomInput(JSON.stringify('a'.repeat(10001))).ok, false);
  assert.equal(problem.parseCustomInput('"3[a]"').ok, true);
  assert.equal(problem.solveReference(['2[a]']), 'aa');
});
