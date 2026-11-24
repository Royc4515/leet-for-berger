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

// It lists the top-level pages itself, so the affected-test selection (scripts/ci/deps.mjs) is
// told: ci-deps: *.html
test('Pages publishes every top-level HTML page', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const pages = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  const html = readdirSync(new URL('..', import.meta.url)).filter((f) => f.endsWith('.html'));
  for (const f of html) assert.match(pages, new RegExp(`cp [^\\n]*\\b${f.replace('.', '\\.')}\\b`), `${f} is not copied into the Pages site`);
});
