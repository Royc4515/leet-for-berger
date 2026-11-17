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
