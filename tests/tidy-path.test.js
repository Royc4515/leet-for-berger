import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/tidy-path/problem.js';

// Brute force by rewriting the string until nothing changes: collapse slashes, drop "/./", cancel
// "/name/../" and drop a ".." at the root. Independent of the stack walk, and quadratic.
function brute(path) {
  let s = path + '/';
  for (;;) {
    const before = s;
    s = s.replace(/\/+/g, '/');
    s = s.replace(/\/\.\//, '/');
    s = s.replace(/^\/\.\.\//, '/');
    s = s.replace(/\/(?!\.\.?\/)[^/]+\/\.\.\//, '/');
    if (s === before) break;
  }
  return s.length > 1 ? s.slice(0, -1) : s;
}

// Classic wrong answers.
const dotsAreSpecial = (path) => {
  const stack = [];
  for (const part of path.split('/')) {
    if (part === '' || /^\.+$/.test(part) && part !== '..') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return '/' + stack.join('/');
};
const hiddenNamesSpecial = (path) => {
  const stack = [];
  for (const part of path.split('/')) {
    if (part === '' || part.startsWith('.')) continue;
    stack.push(part);
  }
  return '/' + stack.join('/');
};
const climbsPastRoot = (path) => {
  const stack = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..' && stack.length && stack[stack.length - 1] !== '..') stack.pop();
    else stack.push(part);
  }
  return '/' + stack.join('/');
};
const keepsEmpty = (path) => {
  const stack = [];
  for (const part of path.split('/').slice(1)) {
    if (part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return '/' + stack.join('/');
};
const emptyRoot = (path) => reference(path).replace(/^\/$/, '');
const trailingSlash = (path) => (reference(path) === '/' ? '/' : reference(path) + '/');

/** Random path over a tiny alphabet of pieces, so every rule fires constantly. */
function randomPath(rnd, pieces) {
  const pool = ['a', 'b', 'c', '.', '..', '...', '.x', '', 'x.y'];
  let s = '/';
  for (let i = 0; i < pieces; i++) s += pool[Math.floor(rnd() * pool.length)] + '/'.repeat(1 + Math.floor(rnd() * 2));
  return rnd() < 0.5 ? s : s.replace(/\/+$/, '') || '/';
}

test('reference matches brute force on 3000 random paths', () => {
  const rnd = mulberry32(99);
  for (let i = 0; i < 3000; i++) {
    const path = randomPath(rnd, Math.floor(rnd() * 14));
    assert.equal(reference(path), brute(path), JSON.stringify(path));
  }
});

test('visible expectations agree; 5 visible, 10 hidden, three at the 10^5 limit', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true, t.args[0].slice(0, 40));
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests.slice(0, 5)]) assert.equal(brute(...t.args), t.expected);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 99990).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [dotsAreSpecial, hiddenNamesSpecial, climbsPastRoot, keepsEmpty, emptyRoot, trailingSlash]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('"/a/./b/../c/"'), { ok: true, args: ['/a/./b/../c/'] });
  assert.equal(problem.parseCustomInput('"/"').ok, true);
  assert.equal(problem.parseCustomInput('""').ok, false);
  assert.equal(problem.parseCustomInput('"a/b"').ok, false);
  assert.equal(problem.parseCustomInput('"/a b"').ok, false);
  assert.equal(problem.parseCustomInput('"/a-b"').ok, false);
  assert.equal(problem.parseCustomInput(`"/${'a'.repeat(100000)}"`).ok, false);
  assert.equal(problem.parseCustomInput('/a').ok, false);
  assert.equal(problem.parseCustomInput('5').ok, false);
});
