import { test } from 'node:test';
import assert from 'node:assert/strict';
import problem, { reference } from '../src/js/problems/repeated-emails/problem.js';
import { sqlProblemTests } from './helpers/sql-problem.js';

function random(rnd) {
  const n = Math.floor(rnd() * 10);
  return [Array.from({ length: n }, (_, i) => [i + 1, `${'abcd'[Math.floor(rnd() * 4)]}@x.io`])];
}

// Independent brute force: compare every pair of rows.
function brute(persons) {
  const out = [];
  persons.forEach(([id, e]) => {
    if (persons.some(([id2, e2]) => id2 !== id && e2 === e) && !out.includes(e)) out.push(e);
  });
  return out.sort();
}

sqlProblemTests({
  problem,
  reference,
  random,
  wrong: {
    'no GROUP BY dedup': 'SELECT a.email AS Email FROM Person a JOIN Person b ON a.email = b.email AND a.id <> b.id',
    'HAVING >= 1': 'SELECT email AS Email FROM Person GROUP BY email HAVING COUNT(*) >= 1',
    'wrong column name': 'SELECT email AS mail FROM Person GROUP BY email HAVING COUNT(*) > 1',
  },
});

test('reference matches a pairwise brute force on 1000 random tables', async () => {
  const { mulberry32 } = await import('../src/js/engine/rng.js');
  const rnd = mulberry32(7);
  for (let i = 0; i < 1000; i++) {
    const [persons] = random(rnd);
    assert.deepEqual(reference(persons).rows.map(([e]) => e).sort(), brute(persons));
  }
});

test('parser rejects uppercase emails and NULLs', () => {
  assert.deepEqual(problem.parseCustomInput('{"Person": [[1, "a@b.com"], [2, "a@b.com"]]}'), { ok: true, args: [[[1, 'a@b.com'], [2, 'a@b.com']]] });
  assert.match(problem.parseCustomInput('{"Person": [[1, "A@b.com"]]}').error, /lowercase/);
  assert.equal(problem.parseCustomInput('{"Person": [[1, null]]}').ok, false);
});
