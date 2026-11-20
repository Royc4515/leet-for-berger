import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/coin-sweep/problem.js';

function distances(n, edges) {
  const dist = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  for (let i = 0; i < n; i++) dist[i][i] = 0;
  for (const [a, b] of edges) dist[a][b] = dist[b][a] = 1;
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
  return dist;
}

// Brute force: a closed walk that visits a connected node set T crosses its edges twice, and it
// collects every coin within 2 of T. So try every non-empty subset T that is connected, keep the
// ones that cover all coins, and take the smallest 2 * (|T| - 1). Distances come from Floyd-Warshall.
function brute(coins, edges) {
  const n = coins.length;
  const dist = distances(n, edges);
  let best = Infinity;
  for (let mask = 1; mask < 1 << n; mask++) {
    const nodes = [];
    for (let v = 0; v < n; v++) if ((mask >> v) & 1) nodes.push(v);
    // Connected: grow from the first node along edges that stay inside the set.
    const seen = new Set([nodes[0]]);
    const stack = [nodes[0]];
    while (stack.length) {
      const u = stack.pop();
      for (const w of nodes) if (!seen.has(w) && dist[u][w] === 1) (seen.add(w), stack.push(w));
    }
    if (seen.size !== nodes.length) continue;
    let covers = true;
    for (let c = 0; c < n && covers; c++) if (coins[c] && !nodes.some((v) => dist[v][c] <= 2)) covers = false;
    if (covers) best = Math.min(best, 2 * (nodes.length - 1));
  }
  return best;
}

/** Leaf trimming parametrised by what each pass does, to model the classic mistakes. */
function trimmer({ coinlessPass = true, layers = 2, factor = 2 }) {
  return (coins, edges) => {
    const n = coins.length;
    if (!coins.includes(1)) return 0;
    const adj = Array.from({ length: n }, () => new Set());
    for (const [a, b] of edges) (adj[a].add(b), adj[b].add(a));
    const alive = new Set(Array.from({ length: n }, (_, i) => i));
    const remove = (v) => {
      alive.delete(v);
      for (const w of adj[v]) adj[w].delete(v);
    };
    if (coinlessPass) {
      const stack = [...alive].filter((v) => adj[v].size === 1 && !coins[v]);
      while (stack.length) {
        const v = stack.pop();
        if (!alive.has(v) || adj[v].size > 1) continue;
        const [p] = adj[v];
        remove(v);
        if (p !== undefined && adj[p].size === 1 && !coins[p]) stack.push(p);
      }
    }
    for (let i = 0; i < layers; i++) for (const v of [...alive].filter((u) => adj[u].size === 1)) if (alive.has(v) && adj[v].size <= 1) remove(v);
    return Math.max(0, factor * (alive.size - 1));
  };
}

// Classic wrong answers.
const noReach = trimmer({ layers: 0 });
const oneLayer = trimmer({ layers: 1 });
const singleCount = trimmer({ factor: 1 });
const keepsCoinless = trimmer({ coinlessPass: false });

const asInput = (args) => args.map((a) => JSON.stringify(a)).join('\n');

/** Random tree on n nodes: node i hangs from a random earlier node, labels shuffled. */
function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 10);
  // Half of the trees hang each node from one of the last two (long and thin); half from any earlier node.
  const thin = rnd() < 0.5;
  const parentOf = (i) => (thin ? i - 1 - Math.floor(rnd() * Math.min(i, 2)) : Math.floor(rnd() * i));
  const label = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [label[i], label[j]] = [label[j], label[i]];
  }
  const edges = [];
  for (let i = 1; i < n; i++) edges.push([label[i], label[parentOf(i)]]);
  const density = rnd();
  const coins = Array.from({ length: n }, () => (rnd() < density ? 1 : 0));
  return [coins, edges];
}

test('reference matches brute force on 3000 random trees', () => {
  const rnd = mulberry32(2603);
  const answers = new Set();
  for (let i = 0; i < 3000; i++) {
    const args = randomCase(rnd);
    const expected = brute(...args);
    assert.equal(reference(...args), expected, JSON.stringify(args));
    answers.add(expected);
  }
  assert.ok(answers.size >= 5, 'random cases cover several answers');
});

test('visible expectations agree; inputs are valid; max-size cases', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(asInput(t.args)).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 5);
  // Both the zero answer and big answers appear, so neither "always 0" nor "n - 1" can pass.
  assert.ok(problem.hiddenTests.some((t) => t.expected === 0));
  assert.ok(problem.hiddenTests.some((t) => t.expected > 100000));
});

test('hidden tests catch the classic wrong answers', () => {
  const small = [...problem.visibleTests, ...problem.hiddenTests].filter((t) => t.args[0].length <= 1000);
  for (const wrong of [noReach, oneLayer, singleCount, keepsCoinless]) {
    assert.ok(small.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every small case`);
  }
  // The model of the mistakes is itself right when configured correctly.
  const right = trimmer({});
  for (const t of small) assert.equal(right(...t.args), t.expected);
  // A hidden case, not only a visible one, must reject each mistake.
  const hiddenSmall = problem.hiddenTests.filter((t) => t.args[0].length <= 1000);
  for (const wrong of [noReach, oneLayer, singleCount, keepsCoinless]) {
    assert.ok(hiddenSmall.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every small hidden case`);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,0]\n[[0,1]]').args, [[1, 0], [[0, 1]]]);
  assert.deepEqual(problem.parseCustomInput('[1]\n[]').args, [[1], []]);
  assert.equal(problem.parseCustomInput('[1,0]\n[]').ok, false);
  assert.equal(problem.parseCustomInput('[1,0,1]\n[[0,1],[1,0]]').ok, false);
  assert.equal(problem.parseCustomInput('[1,0,1]\n[[0,1],[0,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[1,0]\n[[0,0]]').ok, false);
  assert.equal(problem.parseCustomInput('[1,0]\n[[0,2]]').ok, false);
  assert.equal(problem.parseCustomInput('[2,0]\n[[0,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n[]').ok, false);
  assert.equal(problem.parseCustomInput('[1,0]').ok, false);
});
