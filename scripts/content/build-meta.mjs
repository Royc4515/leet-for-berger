#!/usr/bin/env node
/**
 * Writes src/js/data/problem-meta.json (companies, best known complexity and family versions
 * for every shipped problem, see src/js/data/problem-meta.js) and src/js/data/company-sets.json
 * (practice by company, with Israel hiring fields merged in from content/israel-hiring.json,
 * see src/js/data/company-sets.js and scripts/content/israel-companies.mjs) and src/js/data/essential-path.json (the
 * learning path, see src/js/data/learning-path.js) and src/js/data/problem-topics.json (taxonomy topic
 * per shipped problem for the Problem Map, see src/js/data/problem-topics.js). Each company in the
 * sets carries its careers page from content/company-careers.json (scripts/content/check-careers.mjs),
 * and src/js/data/company-pages.json lists which companies have a page, by slug and alias, so a
 * problem's company chips can link to it without loading the sets.
 *
 * Usage: node scripts/content/build-meta.mjs   (after build-index.mjs and complexity.mjs)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProblemMeta } from '../../src/js/data/problem-meta.js';
import { buildCompanySets } from '../../src/js/data/company-sets.js';
import { applyIsrael } from './israel-companies.mjs';
import { applyCareers } from './careers-pick.mjs';
import { buildPath } from '../../src/js/data/learning-path.js';
import { TOPICS } from '../../src/js/data/taxonomy.js';
import { buildProblemTopics } from '../../src/js/data/problem-topics.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const raw = read('content/index/problems.json');
const records = Array.isArray(raw) ? raw : raw.problems;
const meta = buildProblemMeta(records, read('content/families.json').families, read('content/index/complexity.json').problems, read('content/companies.json').israeli);
// One problem per line keeps diffs readable when one problem's tags change.
const body = Object.entries(meta).sort(([a], [b]) => a.localeCompare(b)).map(([id, m]) => `  ${JSON.stringify(id)}: ${JSON.stringify(m)}`).join(',\n');
writeFileSync(join(ROOT, 'src/js/data/problem-meta.json'), `{\n${body}\n}\n`);
console.log(`${Object.keys(meta).length} problems -> src/js/data/problem-meta.json`);

const sets = applyCareers(applyIsrael(buildCompanySets(records, read('content/families.json').families, read('content/companies.json').israeli), read('content/israel-hiring.json')), read('content/company-careers.json'));
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

// Small on purpose (about 3 KB): the problem page loads it beside problem-meta.json.
const pages = {
  slugs: sets.companies.map((c) => c.slug).sort(),
  aliases: Object.fromEntries(sets.companies.flatMap((c) => c.aliases.map((a) => [a.slug, c.slug])).sort(([a], [b]) => a.localeCompare(b))),
};
writeFileSync(join(ROOT, 'src/js/data/company-pages.json'), JSON.stringify(pages) + '\n');
console.log(`${pages.slugs.length} company pages -> src/js/data/company-pages.json`);

const topicsOf = buildProblemTopics(records, TOPICS);
const topicsBody = Object.entries(topicsOf).map(([id, t]) => `  ${JSON.stringify(id)}: ${JSON.stringify(t)}`).join(',\n');
writeFileSync(join(ROOT, 'src/js/data/problem-topics.json'), `{\n${topicsBody}\n}\n`);
console.log(`${Object.keys(topicsOf).length} problems -> src/js/data/problem-topics.json`);

const path = buildPath(records, TOPICS);
writeFileSync(join(ROOT, 'src/js/data/essential-path.json'), JSON.stringify(path, null, 1) + '\n');
console.log(`${path.reduce((n, t) => n + t.topics.reduce((m, tp) => m + tp.problems.length, 0), 0)} essential problems in ${path.length} tiers -> src/js/data/essential-path.json`);
