import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/rotated-search/problem.js';

test('reference matches indexOf on 3000 random rotated arrays', () => {
  const rnd = mulberry32(65);
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 12);
    const sorted = [];
    let v = Math.floor(rnd() * 10) - 20;
    for (let j = 0; j < n; j++) {
      sorted.push(v);
      v += 1 + Math.floor(rnd() * 3);
    }
    const shift = Math.floor(rnd() * n);
    const nums = [...sorted.slice(shift), ...sorted.slice(0, shift)];
    const target = sorted[0] - 2 + Math.floor(rnd() * (v - sorted[0] + 4));
    assert.equal(reference(nums, target), nums.indexOf(target), `${JSON.stringify(nums)} ${target}`);
  }
});

test('visible expectations agree; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
    assert.equal(t.expected, t.args[0].indexOf(t.args[1]));
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[1,2,3]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,1,2]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[3,1,2,0]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,3,2]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n1000000001').ok, false);
  assert.deepEqual(problem.parseCustomInput('[4,5,1,2]\n5').args, [[4, 5, 1, 2], 5]);
  assert.deepEqual(problem.parseCustomInput('[1,2,3]\n2').args, [[1, 2, 3], 2]);
});
