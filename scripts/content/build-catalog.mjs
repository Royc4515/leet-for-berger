#!/usr/bin/env node
/**
 * Writes src/js/problems/catalog.js from the problem modules (see scripts/content/catalog.mjs).
 * Run after adding, removing or renaming a problem, or changing its title, difficulty or topics.
 *
 * Usage: node scripts/content/build-catalog.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildCatalog, renderCatalog } from './catalog.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROBLEMS = join(ROOT, 'src/js/problems');
const OUT = join(PROBLEMS, 'catalog.js');

const current = existsSync(OUT) ? (await import(pathToFileURL(OUT).href)).CATALOG.map((r) => r.id) : [];
const rows = await buildCatalog(PROBLEMS, current);
writeFileSync(OUT, renderCatalog(rows));
console.log(`${rows.length} problems -> src/js/problems/catalog.js`);
