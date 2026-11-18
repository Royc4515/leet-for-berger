#!/usr/bin/env node
/**
 * Writes src/js/data/problem-meta.json (companies, best known complexity and family versions
 * for every shipped problem, see src/js/data/problem-meta.js) and src/js/data/company-sets.json
 * (practice by company, see src/js/data/company-sets.js).
 *
 * Usage: node scripts/content/build-meta.mjs   (after build-index.mjs and complexity.mjs)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProblemMeta } from '../../src/js/data/problem-meta.js';
import { buildCompanySets } from '../../src/js/data/company-sets.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const raw = read('content/index/problems.json');
const records = Array.isArray(raw) ? raw : raw.problems;
const meta = buildProblemMeta(records, read('content/families.json').families, read('content/index/complexity.json').problems, read('content/companies.json').israeli);
// One problem per line keeps diffs readable when one problem's tags change.
const body = Object.entries(meta).sort(([a], [b]) => a.localeCompare(b)).map(([id, m]) => `  ${JSON.stringify(id)}: ${JSON.stringify(m)}`).join(',\n');
writeFileSync(join(ROOT, 'src/js/data/problem-meta.json'), `{\n${body}\n}\n`);
console.log(`${Object.keys(meta).length} problems -> src/js/data/problem-meta.json`);

const sets = buildCompanySets(records, read('content/families.json').families, read('content/companies.json').israeli);
const setsBody = [
  '{',
  '"problems": [',
  sets.problems.map((p) => JSON.stringify(p)).join(',\n'),
  '],',
  '"companies": [',
  sets.companies.map((c) => JSON.stringify(c)).join(',\n'),
  ']',
  '}',
].join('\n');
writeFileSync(join(ROOT, 'src/js/data/company-sets.json'), setsBody + '\n');
console.log(`${sets.companies.length} companies, ${sets.problems.length} problems -> src/js/data/company-sets.json`);
