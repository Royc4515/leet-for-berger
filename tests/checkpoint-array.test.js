import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/checkpoint-array/problem.js';

// Brute force: copy the whole array on every checkpoint. Independent of the per-slot histories.
function brute(ops, args) {
  const cur = new Array(args[0][0]).fill(0);
  const saved = [];
  return ops.map((op, i) => {
    if (op === 'set') {
      cur[args[i][0]] = args[i][1];
      return null;
    }
    if (op === 'snap') {
      saved.push(cur.slice());
      return saved.length - 1;
    }
    if (op === 'get') return saved[args[i][1]][args[i][0]];
    return null;
  });
}

// Wrong answer: keeps only the latest value of each slot, so old checkpoints read the present.
function latestOnly(ops, args) {
  const cur = new Map();
  let taken = 0;
  return ops.map((op, i) => {
    if (op === 'set') {
      cur.set(args[i][0], args[i][1]);
      return null;
    }
    if (op === 'snap') return taken++;
    if (op === 'get') return cur.get(args[i][0]) ?? 0;
    return null;
  });
}

// Wrong answer: records a write only under the checkpoint it was made in and looks for an exact
// id, so a slot not written in that checkpoint reads 0.
function exactIdOnly(ops, args) {
  const rec = new Map();
  let taken = 0;
  return ops.map((op, i) => {
    if (op === 'set') {
      rec.set(`${args[i][0]}:${taken}`, args[i][1]);
      return null;
    }
    if (op === 'snap') return taken++;
    if (op === 'get') return rec.get(`${args[i][0]}:${args[i][1]}`) ?? 0;
    return null;
  });
}

// Wrong answer: snap returns how many checkpoints exist instead of the new id.
function countNotId(ops, args) {
  const out = reference(ops, args);
  return out.map((v, i) => (ops[i] === 'snap' ? v + 1 : v));
}

// Wrong answer: finds the first write made under an id >= the one asked (a lower bound where an
// upper bound is needed), which reads a write from after the checkpoint.
function lowerBoundSearch(ops, args) {
  const ids = new Map();
  const vals = new Map();
  let taken = 0;
  return ops.map((op, i) => {
    if (op === 'set') {
      const [index, val] = args[i];
      if (!ids.has(index)) {
        ids.set(index, []);
        vals.set(index, []);
      }
      const h = ids.get(index);
      if (h.length && h[h.length - 1] === taken) vals.get(index)[h.length - 1] = val;
      else {
        h.push(taken);
        vals.get(index).push(val);
      }
      return null;
    }
    if (op === 'snap') return taken++;
    if (op === 'get') {
      const h = ids.get(args[i][0]);
      if (!h) return 0;
      const pos = h.findIndex((id) => id >= args[i][1]);
      return pos === -1 ? vals.get(args[i][0])[h.length - 1] : vals.get(args[i][0])[pos];
    }
    return null;
  });
}

function randomCase(rnd) {
  const length = 1 + Math.floor(rnd() * 5);
  const calls = [['snap']];
  let taken = 1;
  const n = 1 + Math.floor(rnd() * 40);
  for (let k = 0; k < n; k++) {
    const r = rnd();
    if (r < 0.4) calls.push(['set', Math.floor(rnd() * length), Math.floor(rnd() * 5)]);
    else if (r < 0.6) {
      calls.push(['snap']);
      taken++;
    } else calls.push(['get', Math.floor(rnd() * length), Math.floor(rnd() * taken)]);
  }
  return [['CheckpointArray', ...calls.map((c) => c[0])], [[length], ...calls.map((c) => c.slice(1))]];
}

function deepEq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

test('reference matches brute force on 3000 random sessions', () => {
  const rnd = mulberry32(1146);
  let nonZeroReads = 0;
  for (let i = 0; i < 3000; i++) {
    const [ops, args] = randomCase(rnd);
    const expected = brute(ops, args);
    assert.deepEqual(reference(ops, args), expected, JSON.stringify([ops, args]));
    nonZeroReads += expected.filter((v, j) => ops[j] === 'get' && v > 0).length;
  }
  assert.ok(nonZeroReads > 3000, `only ${nonZeroReads} non-zero reads`);
});

test('every test sequence is valid; visible expectations agree; max tests reach 10^5 calls', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
  const big = problem.hiddenTests.filter((t) => t.args[0].length >= 99999);
  assert.ok(big.length >= 2);
  // Copying the array per checkpoint must be out of reach: a 10^5-slot array with 30,000+ snaps.
  assert.ok(big.some((t) => t.args[1][0][0] >= 100000 && t.args[0].filter((o) => o === 'snap').length >= 30000));
  assert.ok(problem.hiddenTests.every((t) => t.expected.every((v) => v === null || (Number.isInteger(v) && v >= 0))));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [latestOnly, exactIdOnly, countNotId, lowerBoundSearch]) {
    assert.ok(suite.some((t) => !deepEq(wrong(...t.args), t.expected)), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => !deepEq(wrong(...t.args), t.expected)), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects invalid sequences', () => {
  assert.equal(problem.parseCustomInput('["CheckpointArray","set","snap","get"]\n[[2],[0,5],[],[0,0]]').ok, true);
  assert.equal(problem.parseCustomInput('["set"]\n[[0,5]]').ok, false);
  assert.equal(problem.parseCustomInput('["CheckpointArray"]\n[[0]]').ok, false);
  assert.equal(problem.parseCustomInput('["CheckpointArray"]\n[[100001]]').ok, false);
  assert.equal(problem.parseCustomInput('["CheckpointArray","set"]\n[[2],[2,5]]').ok, false);
  assert.equal(problem.parseCustomInput('["CheckpointArray","set"]\n[[2],[0,1000000001]]').ok, false);
  assert.equal(problem.parseCustomInput('["CheckpointArray","set"]\n[[2],[0,-1]]').ok, false);
  assert.equal(problem.parseCustomInput('["CheckpointArray","get"]\n[[2],[0,0]]').ok, false);
  assert.equal(problem.parseCustomInput('["CheckpointArray","snap","get"]\n[[2],[],[0,1]]').ok, false);
  assert.equal(problem.parseCustomInput('["CheckpointArray","snap"]\n[[2],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('["CheckpointArray","push"]\n[[2],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('["CheckpointArray","snap"]\n[[2]]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
