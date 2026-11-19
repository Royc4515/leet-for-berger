import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const data = read('content/israel-hiring.json');

/** Every company name used by the problem metadata and the company sets. */
function metaCompanies() {
  const names = new Set();
  const walk = (o) => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') {
      if (typeof o.name === 'string' && 'frequency' in o) names.add(o.name);
      Object.values(o).forEach(walk);
    }
  };
  walk(read('src/js/data/problem-meta.json'));
  for (const c of read('src/js/data/company-sets.json').companies) names.add(c.name);
  return names;
}

test('every company in the problem metadata has an entry', () => {
  const missing = [...metaCompanies()].filter((n) => !data.companies[n]);
  assert.deepEqual(missing, []);
});

test('values are in the allowed sets', () => {
  for (const [name, e] of Object.entries(data.companies)) {
    assert.ok(data.allowed.israel.includes(e.israel), `${name}: israel ${e.israel}`);
    assert.ok(data.allowed.tier.includes(e.tier), `${name}: tier ${e.tier}`);
    if (e.rankIL !== undefined) {
      assert.equal(e.israel, 'major', `${name}: rankIL only for major`);
      assert.ok(Number.isInteger(e.rankIL) && e.rankIL > 0, `${name}: rankIL`);
    }
    if (e.aliasOf !== undefined) assert.ok(data.companies[e.aliasOf], `${name}: aliasOf target exists`);
  }
});

test('every major and present entry has a source URL', () => {
  for (const [name, e] of Object.entries(data.companies)) {
    if (e.israel === 'none') continue;
    assert.match(e.source ?? '', /^https:\/\/\S+$/, `${name}: source`);
  }
});
