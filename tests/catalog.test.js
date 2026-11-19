// The catalog (src/js/problems/catalog.js) is generated, and the listing views trust it instead of
// loading problem modules (docs/adr/0008-lazy-problem-modules.md). These tests fail when someone
// adds or edits a problem and forgets `node scripts/content/build-catalog.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { catalog, catalogEntry, availableEntries, loadProblem, loadAllProblems, TOPICS, DIFFICULTIES } from '../src/js/problems/index.js';
import { catalogFields } from '../src/js/problems/hydrate.js';

const ROOT = new URL('..', import.meta.url).pathname;
const PROBLEMS = join(ROOT, 'src/js/problems');
const dirs = readdirSync(PROBLEMS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(PROBLEMS, d.name, 'problem.js')))
  .map((d) => d.name)
  .sort();
const REGEN = 'run: node scripts/content/build-catalog.mjs';

test('the catalog lists every problem directory once, and nothing else as available', () => {
  const ids = availableEntries().map((e) => e.id);
  assert.equal(new Set(catalog.map((e) => e.id)).size, catalog.length, 'duplicate ids');
  assert.deepEqual([...ids].sort(), dirs, REGEN);
});

test('loadAllProblems loads exactly the problem directories, in catalog order', async () => {
  const problems = await loadAllProblems();
  assert.equal(problems.length, dirs.length, REGEN);
  assert.deepEqual(problems.map((p) => p.id), availableEntries().map((e) => e.id));
});

test('every catalog entry matches its module (title, difficulty, topics, kind, browser languages)', async () => {
  const stale = [];
  for (const p of await loadAllProblems()) {
    const fields = catalogFields(p);
    if (JSON.stringify(catalogEntry(p.id)) !== JSON.stringify(fields)) stale.push(p.id);
  }
  assert.deepEqual(stale, [], REGEN);
});

test('planned entries have listing fields and no module', () => {
  const planned = catalog.filter((e) => e.status === 'planned');
  for (const e of planned) {
    assert.ok(!dirs.includes(e.id), `${e.id} is implemented; ${REGEN}`);
    assert.ok(e.title && DIFFICULTIES.includes(e.difficulty), e.id);
    assert.equal(catalogEntry(e.id), null, 'planned problems are not published');
  }
  for (const e of catalog) for (const t of e.topics) assert.ok(TOPICS.some((x) => x.id === t), `${e.id}: unknown topic ${t}`);
});

test('loadProblem is memoised and rejects unknown and planned ids without importing', async () => {
  const id = availableEntries()[0].id;
  assert.equal(await loadProblem(id), await loadProblem(id));
  await assert.rejects(loadProblem('no-such-problem'), /Unknown problem/);
  await assert.rejects(loadProblem('../index'), /Unknown problem/);
  const planned = catalog.find((e) => e.status === 'planned');
  if (planned) await assert.rejects(loadProblem(planned.id), /Unknown problem/);
});

test('the listing modules never import a problem module or codegen', () => {
  // The dashboard's whole speed-up depends on these staying catalog-only.
  const read = (p) => readFileSync(join(ROOT, p), 'utf8');
  const index = read('src/js/problems/index.js');
  assert.doesNotMatch(index, /^import .*(problem\.js|codegen|adapters|engine\/sql)/m);
  for (const f of ['src/js/ui/views/dashboard.js', 'src/js/ui/views/path.js', 'src/js/ui/views/companies.js', 'src/js/data/recommend.js']) {
    assert.doesNotMatch(read(f), /problems\/[\w-]+\/problem\.js|loadAllProblems/, f);
  }
});
