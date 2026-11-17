import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/account-merge/problem.js';

const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Brute force: keep merging any two groups that share an email until no pair does.
function brute(accounts) {
  let groups = accounts.map((acc) => ({ name: acc[0], emails: new Set(acc.slice(1)) }));
  for (let merged = true; merged; ) {
    merged = false;
    outer: for (let i = 0; i < groups.length; i++)
      for (let j = i + 1; j < groups.length; j++)
        if ([...groups[j].emails].some((e) => groups[i].emails.has(e))) {
          for (const e of groups[j].emails) groups[i].emails.add(e);
          groups.splice(j, 1);
          merged = true;
          break outer;
        }
  }
  return groups
    .map((g) => [g.name, ...[...g.emails].sort(byCode)])
    .sort((a, b) => byCode(a[0], b[0]) || byCode(a[1], b[1]));
}

test('reference matches brute force on 2000 random inputs', () => {
  const rnd = mulberry32(89);
  const names = ['Al', 'al', 'Bo', 'McX', 'Mca'];
  for (let i = 0; i < 2000; i++) {
    const people = 1 + Math.floor(rnd() * 5);
    const nameOf = Array.from({ length: people }, () => names[Math.floor(rnd() * names.length)]);
    const accounts = Array.from({ length: 1 + Math.floor(rnd() * 8) }, () => {
      const person = Math.floor(rnd() * people);
      const k = 1 + Math.floor(rnd() * 4);
      // Emails mix '.', '_', digits and both cases so character-code order matters.
      return [nameOf[person], ...Array.from({ length: k }, () => `${'aB._9'[Math.floor(rnd() * 5)]}${person}@${Math.floor(rnd() * 4)}`)];
    });
    assert.deepEqual(reference(accounts), brute(accounts));
  }
});

test('visible expectations agree; two max-size cases; ordinal order is exercised; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 10000).length >= 2);
  // One hidden answer must put "McDonald" before "Mcafee" (dictionary order would not).
  assert.ok(problem.hiddenTests.some((t) => {
    const names = t.expected.map((a) => a[0]);
    return names.indexOf('McDonald') !== -1 && names.indexOf('McDonald') < names.indexOf('Mcafee');
  }));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[["Ann"]]').ok, false);
  assert.equal(problem.parseCustomInput('[["Ann","no-at-sign"]]').ok, false);
  assert.equal(problem.parseCustomInput('[["Ann 2","a@x.com"]]').ok, false);
  assert.equal(problem.parseCustomInput('[["Ann","a@x.com"],["Bob","a@x.com"]]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify([['Ann', ...Array(10).fill('a@x.com')]])).ok, false);
  assert.deepEqual(problem.parseCustomInput('[["Ann","a@x.com"]]').args, [[['Ann', 'a@x.com']]]);
});
