/**
 * Which unit tests a change can affect (owner's request: CI runs only what a change touches).
 *
 * A test depends on every file it can reach: its imports, the files it reads, and, through
 * each JavaScript file it reaches, everything that file reaches in turn. References are found
 * as quoted strings that resolve to a real path in the repository (relative to the file, or to
 * the repository root), so `import`, `new URL('../x.json', import.meta.url)`, `readFileSync('src/x')`
 * and `join(ROOT, 'content/y')` all count. A template string's `${...}` matches any name
 * (`problems/${id}/problem.js`), a folder means everything under it, a stylesheet's `url(...)`
 * counts. A file in a problem's folder counts only its imports (its test data is full of
 * path-like strings, as in Tidy Path). What no string says, a test declares in a comment: `ci-deps: *.html` (paths from
 * the repository root, `*` within one folder). When in doubt a path is a dependency: an extra
 * test run costs seconds, a missed one lets a break through.
 *
 * Pure: the file system comes in as `read(path)`, `kind(path)` ('file', 'dir' or null) and
 * `files()` (every file in the repository), so a folder or pattern can be followed into the
 * modules it holds (a test that loads every problem reaches what each problem imports).
 * Paths are repository-relative with forward slashes. Unit-tested in tests/ci-affected.test.js.
 */

/** A change to one of these can change every test's outcome: run them all. */
export const RUN_ALL = [/^package(-lock)?\.json$/, /^\.github\/workflows\/ci\.yml$/, /^scripts\/ci\//];

const QUOTED = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
const IMPORT_FROM = /\b(?:import|export)\s[^'"`;]*?from\s*(['"])([^'"]+)\1|\bimport\s*\(\s*(['"`])([^'"`]+)\3\s*\)|\bimport\s*(['"])([^'"]+)\5/g;
const PROBLEM_FILE = /^src\/js\/problems\/[^/]+\//;
const CODE = /\.(m?js)$/;
const DECLARED = /ci-deps:\s*([^\n]*)/g;

/**
 * Normalises a path: forward slashes, no `.` parts, `..` applied.
 * @param {string} p
 * @returns {string}
 */
export function normalise(p) {
  const out = [];
  for (const part of p.replace(/\\/g, '/').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

const dirOf = (file) => file.split('/').slice(0, -1).join('/');

/**
 * Every quoted string in a source file that could be a path, plus a stylesheet's url(...).
 * @param {string} source
 * @param {string} file the file it came from (decides how it is scanned)
 * @returns {{ text: string, imported: boolean }[]} `imported` marks a module specifier
 */
export function extractRefs(source, file) {
  const refs = [];
  if (file.endsWith('.css')) {
    for (const m of source.matchAll(CSS_URL)) refs.push({ text: m[2], imported: false });
    return refs;
  }
  const imported = new Set();
  for (const m of source.matchAll(IMPORT_FROM)) imported.add(m[2] ?? m[4] ?? m[6]);
  for (const m of source.matchAll(DECLARED)) for (const text of m[1].trim().split(/\s+/).filter(Boolean)) refs.push({ text, imported: false, declared: true });
  if (PROBLEM_FILE.test(file)) return [...refs, ...[...imported].map((text) => ({ text, imported: true }))];
  for (const m of source.matchAll(QUOTED)) {
    const text = m[2];
    if (!text || text.length > 300 || /\s/.test(text) || /^[a-z][a-z0-9+.-]*:/i.test(text)) continue;
    if (!text.includes('/') && !/\.[a-z0-9]{1,5}$/i.test(text)) continue;
    // `'/'`, `'./'`, `'..'`: a base other paths are joined to, not a path of its own.
    if (/^[./]*$/.test(text)) continue;
    refs.push({ text, imported: imported.has(text) });
  }
  for (const text of imported) if (!refs.some((r) => r.text === text)) refs.push({ text, imported: true });
  return refs;
}

/**
 * What a reference points at: a file, a folder (everything under it) or a pattern; null when it
 * is not a path in the repository. A module specifier that is missing is kept as a file (a test
 * that still imports a deleted file must run, and fail).
 * @param {{ text: string, imported: boolean, declared?: boolean }} ref
 * @param {string} from the file holding the reference
 * @param {(path: string) => 'file'|'dir'|null} kind
 * @returns {{ type: 'file'|'dir', path: string }|{ type: 'glob', re: RegExp, path: string }|null}
 */
export function resolveRef(ref, from, kind) {
  const text = ref.text;
  if (ref.declared) {
    const re = new RegExp(`^${text.split('*').map((s) => s.replace(/[.*+?^()|[\]\\{}$]/g, '\\$&')).join('[^/]*')}$`);
    return { type: 'glob', re, path: text };
  }
  if (ref.imported && !/^\.{1,2}\//.test(text) && !text.startsWith('/')) return null; // a package
  const bases = /^\.{1,2}(\/|$)/.test(text) ? [dirOf(from)] : [dirOf(from), ''];
  for (const base of bases) {
    const path = normalise(`${base}/${text}`);
    // The repository root itself is an anchor (`new URL('..', import.meta.url)`), not a dependency:
    // the paths joined to it are found on their own.
    if (!path) continue;
    if (text.includes('${')) {
      const stat = path.split('${')[0];
      const prefix = stat.slice(0, stat.lastIndexOf('/') + 1);
      // No fixed folder (`${p}` alone): the paths it is filled with are found as strings.
      if (!prefix || !kind(prefix.replace(/\/$/, ''))) continue;
      const re = new RegExp(`^${path.split(/\$\{[^}]*\}/).map((s) => s.replace(/[.*+?^()|[\]\\{}]/g, '\\$&')).join('[^/]*(?:/[^/]*)*?')}(?:/.*)?$`);
      return { type: 'glob', re, path };
    }
    const k = kind(path);
    if (k === 'file' || k === 'dir') return { type: k, path };
  }
  if (ref.imported) return { type: 'file', path: normalise(`${dirOf(from)}/${text}`) };
  return null;
}

/**
 * Everything a file reaches, following JavaScript and stylesheets, including those under a
 * folder or matched by a pattern it references.
 * @param {string} start
 * @param {{ read: (path: string) => string|null, kind: (path: string) => 'file'|'dir'|null, files: () => string[] }} fs
 * @param {Map<string, object[]>} [cache] direct references per file, shared across calls
 * @returns {object[]} the resolved references (files, folders, patterns), start included
 */
export function reach(start, fs, cache = new Map()) {
  const seen = new Set([start]);
  const deps = [{ type: 'file', path: start }];
  const queue = [start];
  while (queue.length) {
    const file = queue.shift();
    if (!cache.has(file)) {
      const source = fs.read(file);
      cache.set(file, source === null ? [] : extractRefs(source, file).map((r) => resolveRef(r, file, fs.kind)).filter(Boolean));
    }
    for (const dep of cache.get(file)) {
      deps.push(dep);
      const next = dep.type === 'file' ? [dep.path] : fs.files().filter((f) => touches(dep, f));
      for (const f of next) {
        if (seen.has(f) || !(CODE.test(f) || f.endsWith('.css'))) continue;
        seen.add(f);
        queue.push(f);
      }
    }
  }
  return deps;
}

/**
 * Whether a changed path falls under a dependency.
 * @param {object} dep
 * @param {string} changed
 * @returns {boolean}
 */
export function touches(dep, changed) {
  if (dep.type === 'file') return dep.path === changed;
  if (dep.type === 'dir') return changed.startsWith(`${dep.path}/`);
  return dep.re.test(changed);
}

/**
 * The tests to run for a change.
 * @param {{ tests: string[], changed: string[], fs: { read: Function, kind: Function, files: Function } }} input
 * @returns {{ all: boolean, tests: string[], reasons: Record<string, string> }} a reason per test: the changed file that selected it
 */
export function selectTests({ tests, changed, fs }) {
  const files = changed.map(normalise).filter(Boolean);
  const trigger = files.find((f) => RUN_ALL.some((re) => re.test(f)));
  if (trigger) return { all: true, tests: [...tests], reasons: Object.fromEntries(tests.map((t) => [t, trigger])) };
  const cache = new Map();
  const reasons = {};
  for (const test of tests) {
    const deps = reach(test, fs, cache);
    const hit = files.find((f) => deps.some((d) => touches(d, f)));
    if (hit) reasons[test] = hit;
  }
  return { all: false, tests: tests.filter((t) => reasons[t]), reasons };
}
