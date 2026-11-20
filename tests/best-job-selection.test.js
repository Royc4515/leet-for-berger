import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/best-job-selection/problem.js';

// Brute force: every subset of jobs, kept when no two of them overlap (touching is fine).
function brute(startTime, endTime, profit) {
  const n = startTime.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    let total = 0;
    for (let i = 0; i < n && ok; i++) {
      if (!((mask >> i) & 1)) continue;
      total += profit[i];
      for (let j = i + 1; j < n; j++) {
        if (((mask >> j) & 1) && startTime[i] < endTime[j] && startTime[j] < endTime[i]) {
          ok = false;
          break;
        }
      }
    }
    if (ok) best = Math.max(best, total);
  }
  return best;
}

/** Greedy that sorts by `key` and takes every job that does not clash with the last one taken. */
function greedy(key, clashes) {
  return (startTime, endTime, profit) => {
    const jobs = startTime.map((s, i) => ({ s, e: endTime[i], p: profit[i] })).sort(key);
    let total = 0;
    const taken = [];
    for (const job of jobs) {
      if (taken.some((t) => clashes(t, job))) continue;
      taken.push(job);
      total += job.p;
    }
    return total;
  };
}
const overlap = (a, b) => a.s < b.e && b.s < a.e;
// Classic wrong answer: earliest-ending jobs first, ignoring what they pay.
const earliestEnd = greedy((a, b) => a.e - b.e, overlap);
// Classic wrong answer: highest-paying job first, ignoring how much time it blocks.
const highestPay = greedy((a, b) => b.p - a.p, overlap);
// Classic wrong answer: a job that starts when another ends counts as a clash (DP with `<`).
function strictClash(startTime, endTime, profit) {
  const order = startTime.map((_, i) => i).sort((a, b) => endTime[a] - endTime[b]);
  const best = new Array(order.length + 1).fill(0);
  for (let k = 0; k < order.length; k++) {
    let p = 0;
    for (let j = 0; j < k; j++) if (endTime[order[j]] < startTime[order[k]]) p = j + 1;
    best[k + 1] = Math.max(best[k], best[p] + profit[order[k]]);
  }
  return best[order.length];
}

const asInput = (args) => args.map((a) => JSON.stringify(a)).join('\n');

function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 8);
  const maxT = 3 + Math.floor(rnd() * 12);
  const startTime = [];
  const endTime = [];
  const profit = [];
  for (let i = 0; i < n; i++) {
    const s = 1 + Math.floor(rnd() * (maxT - 1));
    startTime.push(s);
    endTime.push(s + 1 + Math.floor(rnd() * (maxT - s)));
    profit.push(1 + Math.floor(rnd() * 20));
  }
  return [startTime, endTime, profit];
}

test('reference matches brute force on 3000 random job sets', () => {
  const rnd = mulberry32(1235);
  for (let i = 0; i < 3000; i++) {
    const args = randomCase(rnd);
    assert.equal(reference(...args), brute(...args), JSON.stringify(args));
  }
});

test('visible expectations agree; inputs are valid; max-size cases and the 10^9 answer', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(asInput(t.args)).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  assert.equal(Math.max(...problem.hiddenTests.map((t) => t.expected)), 1e9);
});

test('hidden tests catch the classic wrong answers', () => {
  // The greedy and strict-clash versions are quadratic or worse: run them on the small cases only.
  const small = [...problem.visibleTests, ...problem.hiddenTests].filter((t) => t.args[0].length <= 2000);
  for (const wrong of [earliestEnd, highestPay, strictClash]) {
    assert.ok(
      small.some((t) => wrong(...t.args) !== t.expected),
      `${wrong.name} passes every small case`,
    );
  }
  // The strict-clash mistake must fail on a hidden case, not only a visible one.
  const hiddenSmall = problem.hiddenTests.filter((t) => t.args[0].length <= 2000);
  assert.ok(hiddenSmall.some((t) => strictClash(...t.args) !== t.expected));
  // At full size the back-to-back relay is where strict clashes lose everything.
  const relay = problem.hiddenTests.find((t) => t.args[0].length === 100000 && t.expected > 5e8);
  assert.ok(relay);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2]\n[3,4]\n[5,6]').args, [[1, 2], [3, 4], [5, 6]]);
  assert.equal(problem.parseCustomInput('[1]\n[1]\n[5]').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n[2]\n[0]').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n[2]\n[10001]').ok, false);
  assert.equal(problem.parseCustomInput('[0]\n[2]\n[5]').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n[1000000001]\n[5]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n[3]\n[5,6]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n[]\n[]').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n[2]').ok, false);
});
