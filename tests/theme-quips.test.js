import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEME_QUIPS, themeQuip, pickLine } from '../src/js/data/theme-quips.js';
import { CODE_THEME_OPTIONS } from '../src/js/data/themes.js';

const all = [...THEME_QUIPS.toLight, ...THEME_QUIPS.toDark, ...THEME_QUIPS.system, ...Object.values(THEME_QUIPS.code).flat()];
const seq = (...xs) => () => xs.shift() ?? 0;

test('every line follows the voice: no em dashes, no exclamation marks, short enough for a toast', () => {
  for (const line of all) {
    assert.ok(!/[—–]/.test(line), `dash in "${line}"`);
    assert.ok(!line.includes('!'), `exclamation in "${line}"`);
    assert.ok(line.length <= 110, `too long (${line.length}): "${line}"`);
    assert.equal(line, line.trim());
  }
  assert.equal(new Set(all).size, all.length, 'no line appears twice');
});

test('the approved lines are in place', () => {
  assert.equal(THEME_QUIPS.toLight.length, 3);
  assert.equal(THEME_QUIPS.toDark.length, 3);
  assert.equal(THEME_QUIPS.code['shuvat-light-pink'].length, 3);
  assert.equal(THEME_QUIPS.code['berger-light'].length, 2);
  assert.equal(THEME_QUIPS.code['dark-berger'].length, 4);
  assert.match(THEME_QUIPS.code.terminal[0], /Hacking like a Berger/);
  assert.ok(THEME_QUIPS.code['shuvat-light-pink'].every((l) => /Grace Hopper|Margaret Hamilton|Ada Lovelace/.test(l)));
});

test('every code theme choice, Match site included, has a line', () => {
  for (const o of CODE_THEME_OPTIONS) assert.ok(THEME_QUIPS.code[o.value]?.length, o.value);
  assert.deepEqual(Object.keys(THEME_QUIPS.code).sort(), CODE_THEME_OPTIONS.map((o) => o.value).sort(), 'no line for a theme that does not exist');
});

test('dark to light teases and offers the way back; light to dark approves without one', () => {
  const light = themeQuip({ kind: 'site', from: 'dark', to: 'light' }, () => 0);
  assert.ok(THEME_QUIPS.toLight.includes(light.text));
  assert.deepEqual(light.undo, { label: 'Back to dark', value: 'dark' });
  const dark = themeQuip({ kind: 'site', from: 'light', to: 'dark' }, () => 0.99);
  assert.ok(THEME_QUIPS.toDark.includes(dark.text));
  assert.equal(dark.undo, undefined);
});

test('System gets its line; a choice that changes nothing on screen gets none', () => {
  assert.equal(themeQuip({ kind: 'site', from: 'dark', to: 'system' }, () => 0).text, THEME_QUIPS.system[0]);
  assert.equal(themeQuip({ kind: 'site', from: 'dark', to: 'dark' }, () => 0), null);
  assert.equal(themeQuip({ kind: 'code', from: 'terminal', to: 'terminal' }, () => 0), null);
  assert.equal(themeQuip({ kind: 'code', from: 'site', to: 'no-such-theme' }, () => 0), null);
});

test('code themes answer with their own line', () => {
  const pink = themeQuip({ kind: 'code', from: 'site', to: 'shuvat-light-pink' }, () => 0.5);
  assert.ok(THEME_QUIPS.code['shuvat-light-pink'].includes(pink.text));
  assert.equal(pink.undo, undefined);
  assert.equal(themeQuip({ kind: 'code', from: 'site', to: 'terminal' }, () => 0).text, THEME_QUIPS.code.terminal[0]);
});

test('lines rotate at random and never repeat back to back', () => {
  const lines = THEME_QUIPS.toLight;
  for (let i = 0; i < 50; i++) {
    const r = i / 50;
    for (const last of lines) assert.notEqual(pickLine(lines, () => r, last), last);
  }
  // Every line can come up.
  const seen = new Set([0, 0.34, 0.67, 0.99].map((r) => pickLine(lines, () => r)));
  assert.equal(seen.size, lines.length);
  // A list of one still answers, even after itself.
  assert.equal(pickLine(['only'], seq(0.9), 'only'), 'only');
  // random() at the edge never reads past the list.
  assert.ok(lines.includes(pickLine(lines, () => 0.9999999)));
});
