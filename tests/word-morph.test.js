import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/word-morph/problem.js';

// Brute force: build the graph by comparing every pair of words, then BFS over it.
function brute(begin, end, list) {
  const nodes = [begin, ...list.filter((w) => w !== begin)];
  const target = nodes.indexOf(end);
  if (target <= 0 || !list.includes(end)) return 0;
  const oneApart = (a, b) => [...a].filter((ch, i) => ch !== b[i]).length === 1;
  const dist = new Array(nodes.length).fill(-1);
  dist[0] = 1;
  const queue = [0];
  for (let h = 0; h < queue.length; h++) {
    const u = queue[h];
    for (let v = 0; v < nodes.length; v++) {
      if (dist[v] === -1 && oneApart(nodes[u], nodes[v])) {
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  return Math.max(dist[target], 0);
}

test('reference matches brute force on 2000 random dictionaries', () => {
  const rnd = mulberry32(84);
  const word = (len, letters) => Array.from({ length: len }, () => String.fromCharCode(97 + Math.floor(rnd() * letters))).join('');
  let reachable = 0;
  for (let i = 0; i < 2000; i++) {
    const len = 1 + Math.floor(rnd() * 4);
    const letters = 2 + Math.floor(rnd() * 3);
    const list = [...new Set(Array.from({ length: 1 + Math.floor(rnd() * 12) }, () => word(len, letters)))];
    const begin = word(len, letters);
    // Usually aim at a dictionary word so reachable chains are common.
    const end = rnd() < 0.8 ? list[Math.floor(rnd() * list.length)] : word(len, letters);
    if (begin === end) continue;
    const want = brute(begin, end, list);
    assert.equal(reference(begin, end, list), want);
    if (want > 0) reachable++;
  }
  assert.ok(reachable > 300);
});

test('visible expectations agree; hidden tests hit the intended shapes; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[2].length === 20000);
  assert.ok(big.length >= 2 && big.some((t) => t.expected > 0) && big.some((t) => t.expected === 0));
  // The forced chain has no shortcut: 250 changes means 251 words.
  assert.ok(problem.hiddenTests.some((t) => t.expected === 251));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(t.args.map((a) => JSON.stringify(a)).join('\n')).ok, true);
  }
});

test('custom input parser', () => {
  const p = (b, e, l) => problem.parseCustomInput([b, e, l].map((x) => JSON.stringify(x)).join('\n'));
  assert.equal(p('hit', 'hit', ['hit']).ok, false);
  assert.equal(p('hit', 'co', ['co']).ok, false);
  assert.equal(p('hit', 'cog', []).ok, false);
  assert.equal(p('hit', 'cog', ['cog', 'cog']).ok, false);
  assert.equal(p('hit', 'cog', ['Cog']).ok, false);
  assert.equal(p('hit', 'cog', ['cogs']).ok, false);
  assert.equal(problem.parseCustomInput('hit\ncog\n["cog"]').ok, false);
  assert.deepEqual(p('hit', 'cog', ['cog']).args, ['hit', 'cog', ['cog']]);
});
