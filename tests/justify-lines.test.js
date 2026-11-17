import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/justify-lines/problem.js';

// Independent model: split into lines by trying every prefix length; build each line by adding
// one space at a time to the leftmost narrowest gap until the width is reached.
function brute(words, maxWidth) {
  const out = [];
  let i = 0;
  while (i < words.length) {
    let j = i + 1;
    while (j < words.length && words.slice(i, j + 1).join(' ').length <= maxWidth) j++;
    const line = words.slice(i, j);
    if (j === words.length || line.length === 1) {
      out.push(line.join(' ').padEnd(maxWidth, ' '));
    } else {
      const gaps = new Array(line.length - 1).fill(1);
      while (line.join('').length + gaps.reduce((a, b) => a + b, 0) < maxWidth) {
        // The leftmost of the narrowest gaps grows: this yields "left gaps get the extra".
        const g = gaps.indexOf(Math.min(...gaps));
        gaps[g]++;
      }
      out.push(line.map((w, k) => w + (k < gaps.length ? ' '.repeat(gaps[k]) : '')).join(''));
    }
    i = j;
  }
  return out;
}

test('reference matches the independent model on 2000 random inputs', () => {
  const rnd = mulberry32(96);
  for (let k = 0; k < 2000; k++) {
    const maxWidth = 1 + Math.floor(rnd() * 20);
    const words = Array.from({ length: 1 + Math.floor(rnd() * 12) }, () => 'x'.repeat(1 + Math.floor(rnd() * maxWidth)).replace(/x/g, () => 'abc!'[Math.floor(rnd() * 4)]));
    const got = reference(words, maxWidth);
    assert.deepEqual(got, brute(words, maxWidth), JSON.stringify([words, maxWidth]));
    for (const line of got) assert.equal(line.length, maxWidth);
  }
});

test('visible expectations agree; max sizes; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 1000).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('["a","b"]\n3'), { ok: true, args: [['a', 'b'], 3] });
  assert.equal(problem.parseCustomInput('["a","b"]').ok, false);
  assert.equal(problem.parseCustomInput('["abcd"]\n3').ok, false);
  assert.equal(problem.parseCustomInput('["a b"]\n5').ok, false);
  assert.equal(problem.parseCustomInput('[""]\n5').ok, false);
  assert.equal(problem.parseCustomInput('[]\n5').ok, false);
  assert.equal(problem.parseCustomInput('["a"]\n101').ok, false);
  assert.equal(problem.parseCustomInput('["a"]\n0').ok, false);
  assert.equal(problem.parseCustomInput(`${JSON.stringify(['x'.repeat(21)])}\n50`).ok, false);
});
