import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/postfix-eval/problem.js';

// Independent check: rebuild the expression tree from the postfix tokens recursively (reading
// from the end) and evaluate it with BigInt, whose division truncates toward zero by definition.
function brute(tokens) {
  let pos = tokens.length;
  const build = () => {
    const t = tokens[--pos];
    if (!['+', '-', '*', '/'].includes(t)) return BigInt(t);
    const right = build();
    const left = build();
    if (t === '+') return left + right;
    if (t === '-') return left - right;
    if (t === '*') return left * right;
    return left / right;
  };
  return Number(build());
}

/** A random small expression: build a random tree, print it in postfix. */
function randomTokens(rnd) {
  const gen = (depth) => {
    if (depth === 0 || rnd() < 0.3) return [String(Math.floor(rnd() * 21) - 10)];
    const op = '+-*/'[Math.floor(rnd() * 4)];
    return [...gen(depth - 1), ...gen(depth - 1), op];
  };
  return gen(1 + Math.floor(rnd() * 4));
}

test('reference matches BigInt tree evaluation on 2000 random valid expressions', () => {
  const rnd = mulberry32(91);
  let checked = 0;
  while (checked < 2000) {
    const tokens = randomTokens(rnd);
    // The parser filters out division by zero, exactly as the problem promises.
    if (!problem.parseCustomInput(JSON.stringify(tokens)).ok) continue;
    assert.equal(reference(tokens), brute(tokens), tokens.join(' '));
    checked++;
  }
});

test('visible expectations agree; max-size cases; truncation is exercised; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 99999).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    // Large cases are checked against BigInt too, iteratively, since recursion would be too deep.
    const stack = [];
    for (const tok of t.args[0]) {
      if (!['+', '-', '*', '/'].includes(tok)) stack.push(BigInt(tok));
      else {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(tok === '+' ? a + b : tok === '-' ? a - b : tok === '*' ? a * b : a / b);
      }
    }
    assert.equal(Number(stack[0]), t.expected);
  }
  assert.equal(reference(['-1', '3', '/']), 0);
  assert.ok(Object.is(reference(['-1', '3', '/']), 0), 'no negative zero');
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('["1","+"]').ok, false);
  assert.equal(problem.parseCustomInput('["1","2"]').ok, false);
  assert.equal(problem.parseCustomInput('["1","0","/"]').ok, false);
  assert.equal(problem.parseCustomInput('["201"]').ok, false);
  assert.equal(problem.parseCustomInput('["1.5"]').ok, false);
  assert.equal(problem.parseCustomInput('["007"]').ok, false);
  assert.equal(problem.parseCustomInput('["+3"]').ok, false);
  assert.equal(problem.parseCustomInput('[1]').ok, false);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  // 200^5 = 3.2 * 10^11 leaves the 32-bit range.
  assert.equal(problem.parseCustomInput(JSON.stringify(['200', '200', '*', '200', '*', '200', '*', '200', '*'])).ok, false);
  assert.deepEqual(problem.parseCustomInput('["-3","2","*"]').args, [['-3', '2', '*']]);
});
