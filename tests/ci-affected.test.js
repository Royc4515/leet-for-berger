// Affected-test selection (owner's request: CI runs only what a change touches). The rules are
// pure (scripts/ci/deps.mjs); a missed dependency would let a break through, so the cases below
// pin each way a test reaches a file, and the last tests check the real repository.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { extractRefs, resolveRef, reach, selectTests, normalise, touches } from '../scripts/ci/deps.mjs';

/** An in-memory repository: path -> source. Folders are implied by the paths. */
function memoryFs(files) {
  const paths = Object.keys(files);
  return {
    read: (p) => files[p] ?? null,
    kind: (p) => (p in files ? 'file' : paths.some((f) => f.startsWith(`${p}/`)) ? 'dir' : null),
    files: () => paths,
  };
}

const REPO = {
  'src/js/engine/rng.js': 'export const rng = 1;',
  'src/js/engine/harness.js': "import { rng } from './rng.js';\nexport const h = rng;",
  'src/js/data/map-world.js': "const W = new URL('./world.json', import.meta.url);",
  'src/js/data/world.json': '{}',
  'src/js/problems/index.js': 'export const load = (id) => import(`./${id}/problem.js`);',
  'src/js/problems/tidy-path/problem.js': "import { rng } from '../../engine/rng.js';\nexport const cases = ['../src/js', '/a/../b'];",
  'src/js/problems/two-sum/problem.js': "import { h } from '../../engine/harness.js';",
  'src/css/app.css': "@font-face { src: url('../fonts/inter.woff2'); }",
  'src/fonts/inter.woff2': 'x',
  'content/quiz/oop.json': '{}',
  'docs/DESIGN.md': '# Design',
  'index.html': '<html></html>',
  'tests/harness.test.js': "import { h } from '../src/js/engine/harness.js';",
  'tests/problems.test.js': "import { load } from '../src/js/problems/index.js';",
  'tests/world.test.js': "import '../src/js/data/map-world.js';\nconst css = readFileSync(new URL('../src/css/app.css', import.meta.url));",
  'tests/quiz.test.js': "const ROOT = new URL('..', import.meta.url);\nconst bank = join(ROOT, 'content/quiz');\nconst one = `../${p}`;",
  'tests/pages.test.js': '// ci-deps: *.html\nconst x = 1;',
};
const fs = memoryFs(REPO);
const TESTS = Object.keys(REPO).filter((p) => p.endsWith('.test.js'));
const pick = (...changed) => selectTests({ tests: TESTS, changed, fs }).tests;

test('paths normalise: slashes, dots, parents', () => {
  assert.equal(normalise('tests/../src/./js//a.js'), 'src/js/a.js');
  assert.equal(normalise('a\\b'), 'a/b');
});

test('references: imports (static, dynamic, template), URLs, repo paths, stylesheet url(); not anchors or web addresses', () => {
  const refs = extractRefs("import a from './a.js'; import('./b.js'); import(`./${x}/c.js`); new URL('../d.json', import.meta.url); join(ROOT, 'content/e.json'); fetch('https://x.org/f.js'); new URL('..', import.meta.url); s.split('/');", 'src/m.js').map((r) => r.text);
  for (const t of ['./a.js', './b.js', './${x}/c.js', '../d.json', 'content/e.json']) assert.ok(refs.includes(t), t);
  for (const t of ['https://x.org/f.js', '..', '/']) assert.ok(!refs.includes(t), t);
  assert.deepEqual(extractRefs("a { background: url('../img/a.png'); }", 'src/css/app.css').map((r) => r.text), ['../img/a.png']);
});

test("a problem's own files count only imports (their test data looks like paths)", () => {
  const refs = extractRefs(REPO['src/js/problems/tidy-path/problem.js'], 'src/js/problems/tidy-path/problem.js');
  assert.deepEqual(refs.map((r) => r.text), ['../../engine/rng.js']);
});

test('resolving: relative or from the root, folders, patterns with a fixed folder, kept missing imports, no packages', () => {
  assert.deepEqual(resolveRef({ text: '../src/js/engine/rng.js', imported: true }, 'tests/x.test.js', fs.kind), { type: 'file', path: 'src/js/engine/rng.js' });
  assert.deepEqual(resolveRef({ text: 'content/quiz', imported: false }, 'tests/x.test.js', fs.kind), { type: 'dir', path: 'content/quiz' });
  const glob = resolveRef({ text: './${id}/problem.js', imported: true }, 'src/js/problems/index.js', fs.kind);
  assert.equal(glob.type, 'glob');
  assert.ok(touches(glob, 'src/js/problems/two-sum/problem.js'));
  assert.ok(!touches(glob, 'src/js/engine/rng.js'));
  assert.equal(resolveRef({ text: '../${p}', imported: false }, 'tests/x.test.js', fs.kind), null);
  assert.deepEqual(resolveRef({ text: './gone.js', imported: true }, 'tests/x.test.js', fs.kind), { type: 'file', path: 'tests/gone.js' });
  assert.equal(resolveRef({ text: 'node:test', imported: true }, 'tests/x.test.js', fs.kind), null);
  assert.equal(resolveRef({ text: 'playwright', imported: true }, 'tests/x.test.js', fs.kind), null);
  assert.equal(resolveRef({ text: 'not/a/path.js', imported: false }, 'tests/x.test.js', fs.kind), null);
});

test('reach follows modules through imports and into the files a pattern matches', () => {
  const deps = reach('tests/problems.test.js', fs);
  for (const f of ['src/js/problems/index.js', 'src/js/problems/two-sum/problem.js', 'src/js/engine/harness.js', 'src/js/engine/rng.js']) assert.ok(deps.some((d) => touches(d, f)), f);
  const css = reach('tests/world.test.js', fs);
  assert.ok(css.some((d) => touches(d, 'src/fonts/inter.woff2')), 'a stylesheet reaches its fonts');
});

test('selection: each change picks the tests that reach it, and only those', () => {
  assert.deepEqual(pick('src/js/engine/rng.js'), ['tests/harness.test.js', 'tests/problems.test.js']);
  assert.deepEqual(pick('src/js/problems/two-sum/problem.js'), ['tests/problems.test.js']);
  assert.deepEqual(pick('src/js/data/world.json'), ['tests/world.test.js']);
  assert.deepEqual(pick('content/quiz/oop.json'), ['tests/quiz.test.js']);
  assert.deepEqual(pick('index.html'), ['tests/pages.test.js']);
  assert.deepEqual(pick('docs/DESIGN.md'), []);
  // A changed test runs itself; a deleted file still selects what imports it.
  assert.deepEqual(pick('tests/quiz.test.js'), ['tests/quiz.test.js']);
  assert.deepEqual(pick('src/js/engine/harness.js', 'docs/DESIGN.md'), ['tests/harness.test.js', 'tests/problems.test.js']);
});

test('a change to the dependencies, the workflow or the selector itself runs every test', () => {
  for (const f of ['package.json', 'package-lock.json', '.github/workflows/ci.yml', 'scripts/ci/deps.mjs']) {
    const r = selectTests({ tests: TESTS, changed: [f], fs });
    assert.ok(r.all, f);
    assert.deepEqual(r.tests, TESTS, f);
  }
});

/* ---------- The real repository ---------- */

const ROOT = new URL('..', import.meta.url).pathname;
const realFs = {
  read: (p) => {
    try {
      return readFileSync(join(ROOT, p), 'utf8');
    } catch {
      return null;
    }
  },
  kind: (p) => {
    try {
      return statSync(join(ROOT, p)).isDirectory() ? 'dir' : 'file';
    } catch {
      return null;
    }
  },
  files: (() => {
    let all = null;
    return () => (all ??= execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean));
  })(),
};
const realTests = readdirSync(join(ROOT, 'tests')).filter((f) => f.endsWith('.test.js')).map((f) => `tests/${f}`);
const realPick = (f) => selectTests({ tests: realTests, changed: [f], fs: realFs }).tests;

test('in this repository: known pairs are picked', () => {
  const cases = {
    'src/js/data/map-world.js': 'tests/map-world.test.js',
    'src/css/app.css': 'tests/design-tokens.test.js',
    'src/js/engine/harness.js': 'tests/engine.test.js',
    'src/js/problems/pair-sum-target/problem.js': 'tests/solutions.test.js',
    'content/company-careers.json': 'tests/company-links.test.js',
    'index.html': 'tests/ci.test.js',
    'scripts/content/careers-pick.mjs': 'tests/company-links.test.js',
  };
  for (const [file, t] of Object.entries(cases)) assert.ok(realPick(file).includes(t), `${file} -> ${t}`);
  // Built from parts: written whole, the path would make this very test depend on it.
  assert.deepEqual(realPick(['docs', 'ROADMAP.md'].join('/')), []);
});
