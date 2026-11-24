// The quiz feedback scroll (data/scroll-reveal.js): after an answer on a phone, the explanation and
// Next come into view without the reader scrolling, never under the sticky header or bottom bar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { revealDelta } from '../src/js/data/scroll-reveal.js';

const band = { viewTop: 165, viewBottom: 830 };

test('a block already in view stays put', () => {
  assert.equal(revealDelta({ top: 300, bottom: 700, ...band }), 0);
  assert.equal(revealDelta({ top: 300, bottom: 830, ...band }), 0);
});

test('a block that fits scrolls just enough to show its bottom', () => {
  assert.equal(revealDelta({ top: 600, bottom: 900, ...band }), 70);
});

test('a block taller than the band scrolls its top to just under the sticky header, no further', () => {
  assert.equal(revealDelta({ top: 600, bottom: 1600, ...band }), 435);
});

test('never scrolls up, even when the block starts above the band', () => {
  assert.equal(revealDelta({ top: 100, bottom: 1600, ...band }), 0);
});
