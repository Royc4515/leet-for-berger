import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/ring-queue/problem.js';

// Brute force: a plain JS array used as a queue (push and shift). Independent of the ring indexes.
function brute(ops, args) {
  let items = [];
  let cap = 0;
  return ops.map((op, i) => {
    switch (op) {
      case 'RingQueue':
        cap = args[i][0];
        items = [];
        return null;
      case 'push':
        if (items.length === cap) return false;
        items.push(args[i][0]);
        return true;
      case 'pop':
        if (!items.length) return false;
        items.shift();
        return true;
      case 'front':
        return items.length ? items[0] : -1;
      case 'back':
        return items.length ? items[items.length - 1] : -1;
      case 'isEmpty':
        return items.length === 0;
      default:
        return items.length === cap;
    }
  });
}

/**
 * Wrong-answer factory: a ring simulation whose parts are replaced one at a time. `fix` gets the
 * state {data, cap, head, size, pushed} and the operation, and returns undefined to fall through to
 * the correct behaviour or a result to use instead.
 */
function ring(fix) {
  return (ops, args) => {
    const s = { data: [], cap: 0, head: 0, size: 0, pushed: 0 };
    return ops.map((op, i) => {
      const own = fix(s, op, args[i]);
      if (own !== undefined) return own === 'null' ? null : own;
      switch (op) {
        case 'RingQueue':
          s.cap = args[i][0];
          s.data = new Array(s.cap).fill(0);
          return null;
        case 'push':
          if (s.size === s.cap) return false;
          s.data[(s.head + s.size) % s.cap] = args[i][0];
          s.size++;
          return true;
        case 'pop':
          if (s.size === 0) return false;
          s.head = (s.head + 1) % s.cap;
          s.size--;
          return true;
        case 'front':
          return s.size === 0 ? -1 : s.data[s.head];
        case 'back':
          return s.size === 0 ? -1 : s.data[(s.head + s.size - 1) % s.cap];
        case 'isEmpty':
          return s.size === 0;
        default:
          return s.size === s.cap;
      }
    });
  };
}

// Wrong answer: head/tail indexes with the one-slot-wasted trick but an array of exactly capacity
// slots, so the queue holds only capacity - 1 items.
const oneSlotShort = ring((s, op) => {
  if (op === 'push' && s.size === s.cap - 1) return false;
  if (op === 'isFull') return s.size === s.cap - 1;
});

// Wrong answer: indexes that never wrap, so the queue is "full" after capacity pushes in total.
const noWrap = ring((s, op) => {
  if (op === 'push') {
    if (s.pushed === s.cap) return false;
    s.pushed++;
  }
});

// Wrong answer: back() reads the slot after the last item.
const backOffByOne = ring((s, op) => {
  if (op === 'back') return s.size === 0 ? -1 : s.data[(s.head + s.size) % s.cap];
});

// Wrong answer: front() and back() return whatever the slot still holds when the queue is empty.
const staleWhenEmpty = ring((s, op) => {
  if (op === 'front') return s.data[s.head];
  if (op === 'back') return s.data[(s.head + s.cap - 1) % s.cap];
});

function randomCase(rnd) {
  const cap = 1 + Math.floor(rnd() * 5);
  const reads = ['front', 'back', 'isEmpty', 'isFull'];
  const calls = [];
  const n = 1 + Math.floor(rnd() * 40);
  for (let k = 0; k < n; k++) {
    const r = rnd();
    if (r < 0.4) calls.push(['push', Math.floor(rnd() * 10)]);
    else if (r < 0.65) calls.push(['pop']);
    else calls.push([reads[Math.floor(rnd() * 4)]]);
  }
  return [['RingQueue', ...calls.map((c) => c[0])], [[cap], ...calls.map((c) => c.slice(1))]];
}

function deepEq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

test('reference matches brute force on 3000 random sessions', () => {
  const rnd = mulberry32(622);
  let fulls = 0;
  let wraps = 0;
  for (let i = 0; i < 3000; i++) {
    const [ops, args] = randomCase(rnd);
    const expected = brute(ops, args);
    assert.deepEqual(reference(ops, args), expected, JSON.stringify([ops, args]));
    fulls += expected.filter((v, j) => ops[j] === 'push' && v === false).length;
    wraps += ops.filter((o) => o === 'pop').length;
  }
  assert.ok(fulls > 500, `only ${fulls} refused pushes`);
  assert.ok(wraps > 3000);
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
  const big = problem.hiddenTests.filter((t) => t.args[0].length >= 99900);
  assert.ok(big.length >= 2);
  // A big ring that is half full while the head laps it many times.
  assert.ok(big.some((t) => t.args[1][0][0] >= 49990 && t.args[0].filter((o) => o === 'pop').length >= 16000));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  const wrongs = { oneSlotShort, noWrap, backOffByOne, staleWhenEmpty };
  for (const [name, wrong] of Object.entries(wrongs)) {
    assert.ok(suite.some((t) => !deepEq(wrong(...t.args), t.expected)), `${name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => !deepEq(wrong(...t.args), t.expected)), `${name} passes every hidden case`);
  }
});

test('custom input parser rejects invalid sequences', () => {
  assert.equal(problem.parseCustomInput('["RingQueue","push","front"]\n[[2],[5],[]]').ok, true);
  assert.equal(problem.parseCustomInput('["push"]\n[[5]]').ok, false);
  assert.equal(problem.parseCustomInput('["RingQueue"]\n[[0]]').ok, false);
  assert.equal(problem.parseCustomInput('["RingQueue"]\n[[100001]]').ok, false);
  assert.equal(problem.parseCustomInput('["RingQueue","push"]\n[[2],[]]').ok, false);
  assert.equal(problem.parseCustomInput('["RingQueue","push"]\n[[2],[1000000001]]').ok, false);
  assert.equal(problem.parseCustomInput('["RingQueue","push"]\n[[2],[-1]]').ok, false);
  assert.equal(problem.parseCustomInput('["RingQueue","pop"]\n[[2],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('["RingQueue","enQueue"]\n[[2],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('["RingQueue","pop"]\n[[2]]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
