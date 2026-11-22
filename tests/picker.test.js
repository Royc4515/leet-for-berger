import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterPickerItems, moveRovingIndex } from '../src/js/ui/picker.js';

const companies = [
  { id: '', label: 'Any company', searchText: 'Any company', scope: 'any' },
  { id: 'nvidia', label: 'Nvidia', searchText: 'Nvidia', scope: 'major' },
  { id: 'wix', label: 'Wix', searchText: 'Wix', scope: 'major' },
  { id: 'google', label: 'Google', searchText: 'Google Alphabet', scope: 'major' },
  { id: 'stripe', label: 'Stripe', searchText: 'Stripe', scope: 'none' },
];

test('filterPickerItems: filters by trimmed case-insensitive query and custom predicate', () => {
  const onlyMajor = filterPickerItems(companies, {
    predicate: (c) => c.scope === 'major',
    alwaysIncludeIds: [''],
  });
  assert.deepEqual(
    onlyMajor.map((c) => c.id),
    ['', 'nvidia', 'wix', 'google'],
  );

  const goog = filterPickerItems(companies, {
    query: '  GOOG ',
    predicate: (c) => c.scope === 'major',
    alwaysIncludeIds: [''],
  });
  assert.deepEqual(
    goog.map((c) => c.id),
    ['', 'google'],
  );

  const alias = filterPickerItems(companies, { query: 'alphabet' });
  assert.deepEqual(
    alias.map((c) => c.id),
    ['google'],
  );
});

test('filterPickerItems: empty search match returns [] even when alwaysIncludeIds is set', () => {
  const none = filterPickerItems(companies, {
    query: 'zzzz-no-match',
    alwaysIncludeIds: [''],
    keepSelectedId: 'nvidia',
    keepSelectedOutsideFilter: true,
  });
  assert.deepEqual(none, []);
});

test('filterPickerItems: keeps selected option when scope changes if keepSelectedOutsideFilter is true', () => {
  const kept = filterPickerItems(companies, {
    predicate: (c) => c.scope === 'major',
    alwaysIncludeIds: [''],
    keepSelectedId: 'stripe',
    keepSelectedOutsideFilter: true,
  });
  assert.deepEqual(
    kept.map((c) => c.id),
    ['', 'stripe', 'nvidia', 'wix', 'google'],
  );

  // Searching narrows strictly to matches even when another item is already selected.
  const searched = filterPickerItems(companies, {
    query: 'goog',
    predicate: (c) => c.scope === 'major',
    alwaysIncludeIds: [''],
    keepSelectedId: 'nvidia',
    keepSelectedOutsideFilter: true,
  });
  assert.deepEqual(
    searched.map((c) => c.id),
    ['', 'google'],
  );

  // Without keepSelectedOutsideFilter (e.g. Battle difficulty filter), non-matching selection stays out.
  const strict = filterPickerItems(companies, {
    predicate: (c) => c.scope === 'major',
    keepSelectedId: 'stripe',
    keepSelectedOutsideFilter: false,
  });
  assert.deepEqual(
    strict.map((c) => c.id),
    ['nvidia', 'wix', 'google'],
  );
});

test('moveRovingIndex: moves across 1D lists and 2D grids with Home/End', () => {
  assert.equal(moveRovingIndex(0, 'ArrowDown', 4, 1), 1);
  assert.equal(moveRovingIndex(3, 'ArrowDown', 4, 1), 0);
  assert.equal(moveRovingIndex(0, 'ArrowUp', 4, 1), 3);
  assert.equal(moveRovingIndex(2, 'Home', 4, 1), 0);
  assert.equal(moveRovingIndex(1, 'End', 4, 1), 3);

  // 3-column grid with 7 items
  assert.equal(moveRovingIndex(0, 'ArrowRight', 7, 3), 1);
  assert.equal(moveRovingIndex(0, 'ArrowDown', 7, 3), 3);
  assert.equal(moveRovingIndex(4, 'ArrowDown', 7, 3), 6);
  assert.equal(moveRovingIndex(4, 'ArrowUp', 7, 3), 1);
  assert.equal(moveRovingIndex(0, 'ArrowLeft', 7, 3), 0);
  assert.equal(moveRovingIndex(6, 'ArrowRight', 7, 3), 6);
  assert.equal(moveRovingIndex(0, 'Tab', 7, 3), 0);
  assert.equal(moveRovingIndex(0, 'ArrowDown', 0, 1), -1);
});
