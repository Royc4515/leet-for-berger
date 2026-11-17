import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateFamilies, pickVersion, frequencyLookup } from '../src/js/data/families.js';

const { families } = JSON.parse(readFileSync(new URL('../content/families.json', import.meta.url), 'utf8'));
const { problems } = JSON.parse(readFileSync(new URL('../content/index/problems.json', import.meta.url), 'utf8'));
const bySlug = new Map(problems.map((p) => [p.slug, p]));

const fam = {
  id: 'f',
  title: 'F',
  members: [
    { slug: 'a', twist: 'canonical' },
    { slug: 'b', twist: 'variant b' },
    { slug: 'c', twist: 'variant c' },
  ],
};
const freq = { 'a|X': 10, 'b|X': 80, 'c|X': 80, 'a|Y': 50 };
const lookup = (slug, company) => freq[`${slug}|${company}`] ?? 0;

test('families.json is valid against the index', () => {
  assert.deepEqual(validateFamilies(families, bySlug), []);
});

test('every family member record points back at its family', () => {
  for (const f of families) for (const m of f.members) assert.equal(bySlug.get(m.slug).family, f.id, m.slug);
});

test('pickVersion returns the version a company asks most, ties to the earlier member', () => {
  assert.equal(pickVersion(fam, 'X', lookup), 'b');
});

test('pickVersion falls back to canonical without a company or a signal', () => {
  assert.equal(pickVersion(fam, null, lookup), 'a');
  assert.equal(pickVersion(fam, 'Z', lookup), 'a');
  assert.equal(pickVersion(fam, 'Y', lookup), 'a');
});

test('pickVersion only offers available versions', () => {
  assert.equal(pickVersion(fam, 'X', lookup, (s) => s !== 'b'), 'c');
  assert.equal(pickVersion(fam, 'X', lookup, (s) => s === 'a'), 'a');
});

test('validateFamilies catches shared members, missing slugs and lone members', () => {
  const index = new Map([['a', { wave: 1 }], ['b', { wave: null }]]);
  const errors = validateFamilies(
    [
      { id: 'one', title: 'One', members: [{ slug: 'a', twist: 'x' }, { slug: 'b', twist: 'y' }] },
      { id: 'two', title: 'Two', members: [{ slug: 'b', twist: 'x' }, { slug: 'ghost', twist: 'y' }] },
      { id: 'three', title: 'Three', members: [{ slug: 'a', twist: 'x' }] },
    ],
    index,
  );
  assert.ok(errors.some((e) => e.includes('already belongs to one')));
  assert.ok(errors.some((e) => e.includes('ghost is not in the index')));
  assert.ok(errors.some((e) => e.includes('at least 2 members')));
  assert.ok(errors.some((e) => e.includes('two: canonical b is not in the core bank')));
});

test('companies get their own version from real data', () => {
  const lca = families.find((f) => f.id === 'lowest-common-ancestor');
  const lookup = frequencyLookup(problems);
  // Meta is known for the parent-pointer variant; Google asks the canonical one.
  assert.equal(pickVersion(lca, 'Meta', lookup), 'lowest-common-ancestor-of-a-binary-tree-iii');
  assert.equal(pickVersion(lca, 'Google', lookup), lca.members[0].slug);
});

test('every version a top company is shown is in the core bank', () => {
  const lookup = frequencyLookup(problems);
  for (const company of ['Google', 'Amazon', 'Meta', 'Microsoft', 'Bloomberg']) {
    for (const f of families) assert.notEqual(bySlug.get(pickVersion(f, company, lookup)).wave, null, `${f.id} for ${company}`);
  }
});
