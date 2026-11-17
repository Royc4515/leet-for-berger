import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { treeFromLevel, levelFromTree, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference, encode, decode } from '../src/js/problems/tree-codec/problem.js';

// Brute force: the textbook recursive pre-order codec. Independent of the stack-based reference.
function bruteEncode(level) {
  const out = [];
  const walk = (n) => {
    if (!n) return out.push('#');
    out.push(String(n.val));
    walk(n.left);
    walk(n.right);
  };
  walk(treeFromLevel(level));
  return out.join(',');
}

function bruteDecode(data) {
  const tokens = data.split(',');
  let pos = 0;
  const build = () => {
    const t = tokens[pos++];
    if (t === '#') return null;
    return { val: Number(t), left: build(), right: build() };
  };
  return levelFromTree(build());
}

function randomTree(rnd, n) {
  if (!n) return [];
  const root = { val: Math.floor(rnd() * 2001) - 1000, left: null, right: null };
  const nodes = [root];
  while (nodes.length < n) {
    const parent = nodes[Math.floor(rnd() * nodes.length)];
    const side = rnd() < 0.5 ? 'left' : 'right';
    if (!parent[side]) {
      parent[side] = { val: Math.floor(rnd() * 2001) - 1000, left: null, right: null };
      nodes.push(parent[side]);
    }
  }
  return levelFromTree(root);
}

test('encode and decode match the recursive codec and round-trip on 1000 random trees', () => {
  const rnd = mulberry32(317);
  for (let i = 0; i < 1000; i++) {
    const level = randomTree(rnd, Math.floor(rnd() * 30));
    const s = encode(level);
    assert.equal(s, bruteEncode(level), JSON.stringify(level));
    assert.deepEqual(decode(s).level, bruteDecode(s));
    assert.deepEqual(decode(s).level, level);
  }
});

test('decode rejects strings that are not exactly one pre-order tree', () => {
  for (const bad of ['', '1', '1,#', '1,#,#,#', '#,#', '1,,#', '1,a,#', '01,#,#', '-0,#,#', '+1,#,#', '1, #,#', '1.5,#,#', 7]) {
    assert.ok(decode(bad).error, JSON.stringify(bad));
  }
  assert.deepEqual(decode('#').level, []);
  assert.deepEqual(decode('-5,#,#').level, [-5]);
});

test('visible expectations agree; 15 valid cases; two tests with 10^4-node trees both ways', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
    // serialize and deserialize are judged on different trees, never only on a round trip.
    const [ops, args] = t.args;
    for (let i = 1; i < ops.length; i++) if (ops[i] === 'serialize') assert.equal(checkLevelArray(args[i][0]), null);
  }
  const big = (t, op) => t.args[0].some((o, i) => o === op && (op === 'serialize' ? t.args[1][i][0] : decode(t.args[1][i][0]).level).filter((v) => v !== null).length === 10000);
  assert.ok(problem.hiddenTests.filter((t) => big(t, 'serialize') && big(t, 'deserialize')).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.args[0].filter((o) => o === 'deserialize').length >= 2), 'one Codec parses twice');
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('["Codec","serialize"]\n[[],[[1,2]]]').ok, true);
  assert.equal(problem.parseCustomInput('["Codec","deserialize"]\n[[],["1,#,#"]]').ok, true);
  assert.equal(problem.parseCustomInput('["Codec","deserialize"]\n[[],["1,#"]]').ok, false);
  assert.equal(problem.parseCustomInput('["Codec","deserialize"]\n[[],["2000,#,#"]]').ok, false);
  assert.equal(problem.parseCustomInput('["Codec","serialize"]\n[[],[[1,null]]]').ok, false);
  assert.equal(problem.parseCustomInput('["Codec","serialize"]\n[[],[]]').ok, false);
  assert.equal(problem.parseCustomInput('["Codec","rotate"]\n[[],[[1]]]').ok, false);
  assert.equal(problem.parseCustomInput('["Tree","serialize"]\n[[],[[1]]]').ok, false);
  assert.equal(problem.parseCustomInput('["Codec"]').ok, false);
});
