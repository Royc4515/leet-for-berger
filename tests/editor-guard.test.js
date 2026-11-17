import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMonacoCancellation } from '../src/js/ui/editor.js';

test('only Monaco\'s exact cancellation error is treated as harmless', () => {
  const canceled = new Error('Canceled');
  canceled.name = 'Canceled';
  assert.equal(isMonacoCancellation(canceled), true);
  // Anything else must still surface as a console error.
  assert.equal(isMonacoCancellation(new Error('Canceled')), false);
  const renamed = new Error('Canceled by user');
  renamed.name = 'Canceled';
  assert.equal(isMonacoCancellation(renamed), false);
  assert.equal(isMonacoCancellation({ name: 'Canceled', message: 'Canceled' }), false);
  assert.equal(isMonacoCancellation('Canceled'), false);
  assert.equal(isMonacoCancellation(undefined), false);
});
