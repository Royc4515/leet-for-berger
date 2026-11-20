import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/backup-station/problem.js';

// Brute force: for every check, search the grid from scratch with a breadth-first walk over the
// cables (offline stations included) and take the smallest online station found.
function brute(c, links, queries) {
  const adj = Array.from({ length: c + 1 }, () => []);
  for (const [u, v] of links) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const online = new Array(c + 1).fill(true);
  const out = [];
  for (const [type, x] of queries) {
    if (type === 2) {
      online[x] = false;
      continue;
    }
    if (online[x]) {
      out.push(x);
      continue;
    }
    const seen = new Set([x]);
    const queue = [x];
    let best = -1;
    for (let i = 0; i < queue.length; i++) {
      const u = queue[i];
      if (online[u] && (best === -1 || u < best)) best = u;
      for (const w of adj[u]) if (!seen.has(w)) (seen.add(w), queue.push(w));
    }
    out.push(best);
  }
  return out;
}

// Classic wrong answer: removes an offline station from the graph, which splits a grid at a bridge.
function deletesOffline(c, links, queries) {
  const adj = Array.from({ length: c + 1 }, () => []);
  for (const [u, v] of links) (adj[u].push(v), adj[v].push(u));
  const online = new Array(c + 1).fill(true);
  const out = [];
  for (const [type, x] of queries) {
    if (type === 2) {
      online[x] = false;
      continue;
    }
    if (online[x]) {
      out.push(x);
      continue;
    }
    // Walks only through online stations, as if the offline ones were deleted.
    const seen = new Set();
    const queue = adj[x].filter((w) => online[w]);
    queue.forEach((w) => seen.add(w));
    let best = -1;
    for (let i = 0; i < queue.length; i++) {
      const u = queue[i];
      if (best === -1 || u < best) best = u;
      for (const w of adj[u]) if (online[w] && !seen.has(w)) (seen.add(w), queue.push(w));
    }
    out.push(best);
  }
  return out;
}

// Classic wrong answer: the smallest station of the grid, whether or not it is online.
function ignoresOffline(c, links, queries) {
  const adj = Array.from({ length: c + 1 }, () => []);
  for (const [u, v] of links) (adj[u].push(v), adj[v].push(u));
  const online = new Array(c + 1).fill(true);
  const out = [];
  for (const [type, x] of queries) {
    if (type === 2) {
      online[x] = false;
      continue;
    }
    if (online[x]) {
      out.push(x);
      continue;
    }
    const seen = new Set([x]);
    const queue = [x];
    for (let i = 0; i < queue.length; i++) for (const w of adj[queue[i]]) if (!seen.has(w)) (seen.add(w), queue.push(w));
    out.push(Math.min(...queue));
  }
  return out;
}

// Classic wrong answer: the smallest online station of the whole network, ignoring grids.
function ignoresGrids(c, links, queries) {
  const online = new Array(c + 1).fill(true);
  const out = [];
  for (const [type, x] of queries) {
    if (type === 2) {
      online[x] = false;
      continue;
    }
    if (online[x]) {
      out.push(x);
      continue;
    }
    out.push(online.indexOf(true, 1));
  }
  return out;
}

// Classic wrong answer: always the smallest online station of the grid, even for an online x.
function alwaysSmallest(c, links, queries) {
  const adj = Array.from({ length: c + 1 }, () => []);
  for (const [u, v] of links) (adj[u].push(v), adj[v].push(u));
  const online = new Array(c + 1).fill(true);
  const out = [];
  for (const [type, x] of queries) {
    if (type === 2) {
      online[x] = false;
      continue;
    }
    const seen = new Set([x]);
    const queue = [x];
    let best = -1;
    for (let i = 0; i < queue.length; i++) {
      const u = queue[i];
      if (online[u] && (best === -1 || u < best)) best = u;
      for (const w of adj[u]) if (!seen.has(w)) (seen.add(w), queue.push(w));
    }
    out.push(best);
  }
  return out;
}

const asInput = (args) => [args[0], JSON.stringify(args[1]), JSON.stringify(args[2])].join('\n');

function randomCase(rnd) {
  const c = 1 + Math.floor(rnd() * 9);
  const links = [];
  for (let u = 1; u <= c; u++) for (let v = u + 1; v <= c; v++) if (rnd() < 0.2) links.push([u, v]);
  const queries = Array.from({ length: 1 + Math.floor(rnd() * 14) }, () => [rnd() < 0.55 ? 1 : 2, 1 + Math.floor(rnd() * c)]);
  return [c, links, queries];
}

test('reference matches brute force on 3000 random networks', () => {
  const rnd = mulberry32(3607);
  let answers = 0;
  let offlineAnswers = 0;
  for (let i = 0; i < 3000; i++) {
    const args = randomCase(rnd);
    const expected = brute(...args);
    assert.deepEqual(reference(...args), expected, JSON.stringify(args));
    answers += expected.length;
    offlineAnswers += expected.filter((a) => a === -1).length;
  }
  assert.ok(answers > 10000);
  assert.ok(offlineAnswers > 100, 'the -1 answer must be exercised');
});

test('visible expectations agree; inputs are valid; at least two max-size cases', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(asInput(t.args)).ok, true);
  const big = problem.hiddenTests.filter((t) => t.args[0] === 100000 && t.args[2].length === 100000);
  assert.ok(big.length >= 2);
  // The big line case makes every check walk far: the answer is never the station itself.
  assert.ok(problem.hiddenTests.some((t) => t.expected.length >= 50000));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests].filter((t) => t.args[0] <= 3000);
  for (const wrong of [deletesOffline, ignoresOffline, ignoresGrids, alwaysSmallest]) {
    assert.ok(
      suite.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)),
      `${wrong.name} passes every small case`,
    );
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('3\n[[1,2]]\n[[1,3]]').ok, true);
  assert.equal(problem.parseCustomInput('3\n[]\n[[1,3]]').ok, true);
  assert.equal(problem.parseCustomInput('3\n[[1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('0\n[]\n[[1,1]]').ok, false);
  assert.equal(problem.parseCustomInput('3\n[[1,1]]\n[[1,3]]').ok, false);
  assert.equal(problem.parseCustomInput('3\n[[1,4]]\n[[1,3]]').ok, false);
  assert.equal(problem.parseCustomInput('3\n[[1,2],[2,1]]\n[[1,3]]').ok, false);
  assert.equal(problem.parseCustomInput('3\n[]\n[]').ok, false);
  assert.equal(problem.parseCustomInput('3\n[]\n[[3,1]]').ok, false);
  assert.equal(problem.parseCustomInput('3\n[]\n[[1,4]]').ok, false);
  assert.deepEqual(problem.parseCustomInput('3\n[[2,3]]\n[[2,2],[1,2]]').args, [3, [[2, 3]], [[2, 2], [1, 2]]]);
});
