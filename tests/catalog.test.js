/**
 * The generated problem catalog and lazy problem loading (ADR 0008).
 *
 * Guards: the catalog matches the problem modules (run `node scripts/content/build-catalog.mjs`
 * when this fails), every problem folder is listed (so the verifier, which loads the catalog,
 * can never silently skip one), and the first page load imports no problem module and no engine.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog, renderCatalog, problemDirs, orderIds, toCatalogEntry } from '../scripts/content/catalog.mjs';
import { CATALOG } from '../src/js/problems/catalog.js';
import { catalog, catalogEntry, shippedEntries, loadProblem, loadAllProblems } from '../src/js/problems/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROBLEMS = join(ROOT, 'src/js/problems');

test('catalog.js is current: run node scripts/content/build-catalog.mjs', async () => {
  const rows = await buildCatalog(PROBLEMS, CATALOG.map((r) => r.id));
  assert.equal(readFileSync(join(PROBLEMS, 'catalog.js'), 'utf8'), renderCatalog(rows));
});

test('every problem folder is in the catalog exactly once', () => {
  const ids = CATALOG.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate catalog id');
  assert.deepEqual([...ids].sort(), problemDirs(PROBLEMS));
});

test('loadAllProblems returns every catalog problem, hydrated, in catalog order', async () => {
  const problems = await loadAllProblems();
  assert.deepEqual(problems.map((p) => p.id), CATALOG.map((r) => r.id));
  for (const p of problems) {
    assert.deepEqual(toCatalogEntry(p), catalogEntry(p.id), p.id);
    assert.ok(p.starterCode && p.languages?.length, `${p.id} is not hydrated`);
  }
});

test('loadProblem: memoised per id, null for ids outside the catalog', async () => {
  assert.equal(loadProblem('pair-sum-target'), loadProblem('pair-sum-target'));
  assert.equal(await loadProblem('no-such-problem'), null);
  assert.equal(await loadProblem('../catalog'), null);
  assert.equal(await loadProblem('__proto__'), null);
});

test('listing helpers expose only catalog metadata', () => {
  assert.equal(shippedEntries(), CATALOG);
  assert.equal(catalog.filter((p) => p.status === 'available').length, CATALOG.length);
  assert.equal(catalogEntry('no-such-problem'), null);
  assert.equal(catalogEntry('pair-sum-target').title, 'Pair Sum Target');
});

test('orderIds keeps the shipped order, appends new ids sorted, drops removed ones', () => {
  assert.deepEqual(orderIds(['b', 'a', 'gone'], ['a', 'b', 'd', 'c']), ['b', 'a', 'c', 'd']);
  assert.deepEqual(orderIds([], ['b', 'a']), ['a', 'b']);
});

/** Relative static imports of a module, resolved to absolute paths. Dynamic import() is not followed. */
function staticImports(file) {
  const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const specs = [...src.matchAll(/^\s*(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]+)['"]/gm), ...src.matchAll(/^\s*import\s*['"](\.[^'"]+)['"]/gm)].map((m) => m[1]);
  return specs.map((s) => resolve(dirname(file), s));
}

function staticClosure(entry) {
  const seen = new Set();
  const stack = [entry];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    stack.push(...staticImports(f));
  }
  return [...seen].map((f) => f.slice(ROOT.length + 1).replaceAll('\\', '/'));
}

test('first page load: no problem module, no view other than the dashboard, no engine', () => {
  const loaded = staticClosure(join(ROOT, 'src/js/main.js'));
  const forbidden = loaded.filter(
    (f) =>
      /^src\/js\/problems\/[^/]+\/problem\.js$/.test(f) ||
      /^src\/js\/ui\/views\/(workspace|path|companies|modes)\.js$/.test(f) ||
      /^src\/js\/engine\/(codegen|adapters|harness|programs\/|runners\/)/.test(f) ||
      f === 'src/js/problems/hydrate.js',
  );
  assert.deepEqual(forbidden, []);
  assert.ok(loaded.includes('src/js/problems/catalog.js'));
  assert.ok(loaded.length < 40, `startup graph grew to ${loaded.length} modules`);
});
