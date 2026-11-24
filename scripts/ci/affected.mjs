#!/usr/bin/env node
/**
 * Prints what CI should run for a change (owner's request: only what the change affects).
 *
 *   git diff --name-only BASE HEAD | node scripts/ci/affected.mjs
 *
 * Writes to stdout (and to $GITHUB_OUTPUT when set):
 *   tests=<space-separated unit test files>   (empty: no unit test depends on the change)
 *   e2e=true|false                            (anything the site loads, or the smoke test itself)
 * and to stderr, why each test was picked. The rules are in scripts/ci/deps.mjs.
 */
import { readFileSync, readdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectTests } from './deps.mjs';
import { repoFs } from './repo-fs.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const fs = repoFs(ROOT);

const changed = readFileSync(0, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
const tests = readdirSync(join(ROOT, 'tests')).filter((f) => f.endsWith('.test.js')).map((f) => `tests/${f}`).sort();
const picked = selectTests({ tests, changed, fs });

// The browser smoke test loads the whole site: any file it can serve, or the test itself.
const E2E = /^(src\/|e2e\/|index\.html$|privacy\.html$|package(-lock)?\.json$|\.github\/workflows\/ci\.yml$|scripts\/ci\/)/;
const e2e = changed.some((f) => E2E.test(f));

for (const t of picked.tests) console.error(`${t}  <- ${picked.reasons[t]}`);
console.error(picked.all ? `all ${tests.length} unit tests (a change to ${picked.reasons[tests[0]]})` : `${picked.tests.length} of ${tests.length} unit tests; e2e: ${e2e}`);

const out = `tests=${picked.tests.join(' ')}\ne2e=${e2e}\n`;
process.stdout.write(out);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, out);
