// The CI verifier runs one job per language; a language missing from the matrix would ship
// unverified solutions while CI stays green.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LANGUAGES } from '../src/js/engine/codegen.js';
import { selectTests } from '../scripts/ci/deps.mjs';
import { repoFs } from '../scripts/ci/repo-fs.mjs';

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

test('Pages deploys in its own job after the build, and tries once more when Pages fails', () => {
  const yml = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  const job = (name) => yml.match(new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  \\S|(?![\\s\\S]))`, 'm'))?.[1] ?? '';
  const build = job('build');
  const deploy = job('deploy');
  // Deploying in the upload's own job failed with "No artifacts named github-pages were found".
  assert.match(build, /actions\/upload-pages-artifact@/, 'the build job uploads the site');
  assert.doesNotMatch(build, /actions\/deploy-pages@/, 'the build job must not deploy');
  assert.match(deploy, /^\s+needs: build$/m, 'the deploy job waits for the build job');
  // "Deployment failed, try again later" from Pages: the first try may fail, a second one runs.
  assert.equal(deploy.match(/actions\/deploy-pages@/g)?.length, 2, 'a first try and one retry');
  assert.match(deploy, /continue-on-error: true/);
  assert.match(deploy, /if: steps\.deployment\.outcome == 'failure'\n\s+uses: actions\/deploy-pages@/);
  assert.match(yml, /cancel-in-progress: false/, 'a newer push must not cancel a deploy halfway');
});

test('CI runs the native program builder tests when the selection picks them, and it picks them for all they import', () => {
  const yml = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(yml, /if: contains\(needs\.changes\.outputs\.tests, 'tests\/programs\.test\.js'\)\n\s+run: node --test tests\/programs\.test\.js/);
  // Every local module programs.test.js imports, and the test itself, must select it.
  const src = readFileSync(new URL('./programs.test.js', import.meta.url), 'utf8');
  const deps = [...src.matchAll(/from '\.\.\/([^']+)'/g)].map((m) => m[1]);
  assert.ok(deps.length > 3, 'expected programs.test.js imports');
  const fs = repoFs();
  for (const path of [...deps, 'tests/programs.test.js']) assert.deepEqual(selectTests({ tests: ['tests/programs.test.js'], changed: [path], fs }).tests, ['tests/programs.test.js'], `${path} would not run programs.test.js`);
});
