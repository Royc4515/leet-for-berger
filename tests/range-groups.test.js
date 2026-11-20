import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/range-groups/problem.js';

const MOD = 1000000007n;

// Brute force: try every assignment of ranges to the two groups and keep the ones where no
// overlapping pair is split. Independent of any merging or counting of blocks.
function brute(ranges) {
  const n = ranges.length;
  const overlaps = (a, b) => Math.max(a[0], b[0]) <= Math.min(a[1], b[1]);
  let ways = 0n;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let i = 0; i < n && ok; i++) {
      for (let j = i + 1; j < n; j++) {
        if (overlaps(ranges[i], ranges[j]) && ((mask >> i) & 1) !== ((mask >> j) & 1)) {
          ok = false;
          break;
        }
      }
    }
    if (ok) ways++;
  }
  return Number(ways % MOD);
}

/** Wrong-answer factory: blocks counted by `split(prevEnd, start)` after sorting by start. */
function withBlocks(isNewBlock, keepMax) {
  return (ranges) => {
    const sorted = ranges.map((r) => [...r]).sort((a, b) => a[0] - b[0]);
    let blocks = 0;
    let reach = -1;
    for (const [s, e] of sorted) {
      if (isNewBlock(s, reach)) blocks++;
      reach = keepMax ? Math.max(reach, e) : e;
    }
    let ways = 1n;
    for (let i = 0; i < blocks; i++) ways = (ways * 2n) % MOD;
    return Number(ways);
  };
}

// Classic wrong answer: ranges that only touch (3 right after 2) are merged.
const touchingMerges = withBlocks((s, reach) => s > reach + 1, true);
// Classic wrong answer: ranges that share an endpoint are split.
const endpointSplits = withBlocks((s, reach) => s >= reach, true);
// Classic wrong answer: the reach is the latest end, not the furthest.
const latestEnd = withBlocks((s, reach) => s > reach, false);
// Classic wrong answer: no modulus, a double loses precision (and overflows) at 10^5 blocks.
const noModulus = (ranges) => 2 ** countBlocks(ranges);
function countBlocks(ranges) {
  const sorted = ranges.map((r) => [...r]).sort((a, b) => a[0] - b[0]);
  let blocks = 0;
  let reach = -1;
  for (const [s, e] of sorted) {
    if (s > reach) blocks++;
    reach = Math.max(reach, e);
  }
  return blocks;
}

function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 9);
  const span = 4 + Math.floor(rnd() * 20);
  return Array.from({ length: n }, () => {
    const a = Math.floor(rnd() * span);
    return [a, a + Math.floor(rnd() * 4)];
  });
}

test('reference matches brute force on 3000 random range sets', () => {
  const rnd = mulberry32(2580);
  const seen = new Set();
  for (let i = 0; i < 3000; i++) {
    const ranges = randomCase(rnd);
    assert.equal(reference(ranges), brute(ranges), JSON.stringify(ranges));
    seen.add(countBlocks(ranges));
  }
  assert.ok(seen.size >= 4, 'random cases cover several block counts');
});

test('visible expectations agree; inputs are valid; max-size cases', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  // The 10^5-block cases need the modulus; the expected value is a residue, never the power itself.
  assert.ok(problem.hiddenTests.some((t) => countBlocks(t.args[0]) === 100000));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [touchingMerges, endpointSplits, latestEnd, noModulus]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[[1,3],[2,5]]').args, [[[1, 3], [2, 5]]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[3,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[-1,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,1000000001]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2,3]]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
