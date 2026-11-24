// The phone problem list pages (data/list-page.js): a page of rows, then "Show more" adds the next.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listPage } from '../src/js/data/list-page.js';

test('the first page, and what the button adds', () => {
  assert.deepEqual(listPage({ total: 225, shown: 30, size: 30 }), { visible: 30, left: 195, next: 30 });
  assert.deepEqual(listPage({ total: 225, shown: 210, size: 30 }), { visible: 210, left: 15, next: 15 });
});

test('a short list shows whole, with nothing left', () => {
  assert.deepEqual(listPage({ total: 12, shown: 30, size: 30 }), { visible: 12, left: 0, next: 0 });
  assert.deepEqual(listPage({ total: 0, shown: 30, size: 30 }), { visible: 0, left: 0, next: 0 });
});

test('asking past the end shows everything; a page is the least ever shown', () => {
  assert.deepEqual(listPage({ total: 225, shown: 240, size: 30 }), { visible: 225, left: 0, next: 0 });
  assert.deepEqual(listPage({ total: 225, shown: 0, size: 30 }), { visible: 30, left: 195, next: 30 });
});
