import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/next-arrangement/problem.js';

// Brute force: build every distinct arrangement, sort them in dictionary order, take the entry
// after the input (wrapping to the first). Only usable for a handful of values.
function brute(nums) {
  const seen = new Set();
  const out = [];
  const rec = (rest, cur) => {
    if (!rest.length) {
      const key = cur.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        out.push(cur);
      }
      return;
    }
    rest.forEach((v, i) => rec([...rest.slice(0, i), ...rest.slice(i + 1)], [...cur, v]));
  };
  rec(nums, []);
  const cmp = (a, b) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
  };
  out.sort(cmp);
  const at = out.findIndex((p) => cmp(p, nums) === 0);
  return out[(at + 1) % out.length];
}

test('reference matches brute force on 3000 random arrays, with and without repeated values', () => {
  const rnd = mulberry32(31);
  let wrapped = 0;
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 7);
    const maxVal = 1 + Math.floor(rnd() * 5);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * (maxVal + 1)));
    const copy = [...nums];
    const want = brute(nums);
    if (want.join() === [...nums].sort((a, b) => a - b).join() && want.join() !== nums.join()) wrapped++;
    assert.deepEqual(reference(nums), want, JSON.stringify(nums));
    assert.deepEqual(nums, copy, 'reference must not mutate its input');
  }
  assert.ok(wrapped > 20, `${wrapped} wrap-around cases`);
});

test('5 visible and 10 hidden cases, expectations agree, max-size cases, valid input', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    // Same multiset of values, same length.
    assert.deepEqual([...t.expected].sort((a, b) => a - b), [...t.args[0]].sort((a, b) => a - b));
  }
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 8)) assert.deepEqual(brute(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  const pivotOf = (a) => {
    let i = a.length - 2;
    while (i >= 0 && a[i] >= a[i + 1]) i--;
    return i;
  };
  const rev = (a, lo) => {
    for (let l = lo, r = a.length - 1; l < r; l++, r--) [a[l], a[r]] = [a[r], a[l]];
  };
  // Swaps the pivot with its immediate neighbor instead of the rightmost larger value.
  const nearestSwap = (nums) => {
    const a = [...nums];
    const i = pivotOf(a);
    if (i >= 0) [a[i], a[i + 1]] = [a[i + 1], a[i]];
    rev(a, i + 1);
    return a;
  };
  // Forgets to reverse the suffix after the swap.
  const noReverse = (nums) => {
    const a = [...nums];
    const i = pivotOf(a);
    if (i < 0) return a.reverse();
    let j = a.length - 1;
    while (a[j] <= a[i]) j--;
    [a[i], a[j]] = [a[j], a[i]];
    return a;
  };
  // Only ever swaps the last two values, and sorts when that does not grow the array.
  const lastTwo = (nums) => {
    const a = [...nums];
    const n = a.length;
    if (n >= 2 && a[n - 2] < a[n - 1]) [a[n - 2], a[n - 1]] = [a[n - 1], a[n - 2]];
    else a.sort((x, y) => x - y);
    return a;
  };
  for (const [name, wrong] of [['nearest swap', nearestSwap], ['no reverse', noReverse], ['last two only', lastTwo]]) {
    assert.ok(all.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,3]'), { ok: true, args: [[1, 2, 3]] });
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[100001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(new Array(100001).fill(1))).ok, false);
  assert.equal(problem.parseCustomInput('1,2').ok, false);
  assert.deepEqual(problem.solveReference([[3, 2, 1]]), [1, 2, 3]);
});
