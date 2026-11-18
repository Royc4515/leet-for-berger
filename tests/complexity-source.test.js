import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTables } from '../scripts/content/complexity.mjs';

test('parseTables reads number, time and space from kamyu104 rows', () => {
  const md = [
    '|  #  | Title | Solution | Time | Space | Difficulty | Tag | Note|',
    '|-----|---|---|---|---|---|---|---|',
    '0136 | [Single Number](u) | [C++](a) | _O(n)_       | _O(1)_          | Easy         |||',
    '0004 | [Median](u) | [C++](a) | _O(log(min(m, n)))_ | _O(1)_ | Hard |||',
    '0136 | [Single Number](u) | [C++](a) | _O(n^2)_ | _O(n)_ | Easy |||',
    '0999 | [No Data](u) | [C++](a) | | - | Easy |||',
  ].join('\n');
  const rows = parseTables(md);
  assert.deepEqual(rows.get(136), { time: 'O(n)', space: 'O(1)' });
  assert.deepEqual(rows.get(4), { time: 'O(log(min(m, n)))', space: 'O(1)' });
  assert.deepEqual(rows.get(999), { time: null, space: null });
  assert.equal(rows.size, 3);
});

test('complexity.json covers every essential LeetCode problem', async () => {
  const { readFileSync } = await import('node:fs');
  const complexity = JSON.parse(readFileSync(new URL('../content/index/complexity.json', import.meta.url))).problems;
  const raw = JSON.parse(readFileSync(new URL('../content/index/problems.json', import.meta.url)));
  const index = Array.isArray(raw) ? raw : raw.problems;
  const missing = index.filter((p) => p.essential && p.platform === 'leetcode' && p.number && !complexity[p.number]?.time);
  assert.deepEqual(missing.map((p) => p.slug), []);
});
