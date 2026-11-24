// The CI verifier runs one job per language; a language missing from the matrix would ship
// unverified solutions while CI stays green.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LANGUAGES } from '../src/js/engine/codegen.js';

test('CI verify matrix covers every solution language plus SQL', () => {
  const yml = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const line = yml.match(/^\s+lang: \[(.*)\]$/m);
  assert.ok(line, 'matrix.lang not found in ci.yml');
  const matrix = line[1].split(',').map((s) => s.trim()).sort();
  assert.deepEqual(matrix, [...LANGUAGES.map((l) => l.id), 'sql'].sort());
});

test('Pages publishes every top-level HTML page', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const pages = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  const html = readdirSync(new URL('..', import.meta.url)).filter((f) => f.endsWith('.html'));
  for (const f of html) assert.match(pages, new RegExp(`cp [^\\n]*\\b${f.replace('.', '\\.')}\\b`), `${f} is not copied into the Pages site`);
});

test('CI skips the native program builder tests only when nothing they read changed', () => {
  const yml = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const pattern = yml.match(/has '([^']+)' solutions/)?.[1];
  assert.ok(pattern, 'solutions pattern not found in ci.yml');
  const re = new RegExp(pattern);
  // Every local module programs.test.js imports, and the test itself, must trigger it.
  const src = readFileSync(new URL('./programs.test.js', import.meta.url), 'utf8');
  const deps = [...src.matchAll(/from '\.\.\/([^']+)'/g)].map((m) => m[1]);
  assert.ok(deps.length > 3, 'expected programs.test.js imports');
  for (const path of [...deps, 'tests/programs.test.js', 'tests/solutions.test.js']) assert.match(path, re, `${path} would not run programs.test.js`);
  assert.match(yml, /if: needs\.changes\.outputs\.solutions == 'true'\n\s+run: node --test tests\/programs\.test\.js/);
});
