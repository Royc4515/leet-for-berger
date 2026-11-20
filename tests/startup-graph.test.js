// First-load guard (ADR 0008): main.js must reach only the shell, state, auth and catalog modules
// through STATIC imports. Views, problem modules and the engine load on demand via import(), so a
// stray static import that drags them back into the startup graph fails here in milliseconds
// instead of showing up as a slow first load in the browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const SRC = new URL('../src/js/', import.meta.url).pathname;
const ENTRY = join(SRC, 'main.js');

// Dynamic import() is deliberately not matched: `from '...'` is required, and bare `import '...'`
// side-effect imports are matched by the second alternative only when followed by a quote.
const STATIC_IMPORT = /(?:^|[\n;])\s*(?:import|export)\s+(?:[^'"()]*?\sfrom\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;

/** Static relative-import closure of a module, as paths relative to src/js. */
function closure(entry) {
  const seen = new Set();
  const stack = [entry];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(STATIC_IMPORT)) stack.push(resolve(dirname(file), m[1]));
  }
  return [...seen].map((f) => relative(SRC, f)).sort();
}

const CAP = 16;
const files = closure(ENTRY);

test('the static startup graph from main.js stays out of views, problems and the engine', () => {
  const forbidden = files.filter((f) =>
    /^problems\/[^/]+\/problem\.js$/.test(f) ||
    f === 'problems/hydrate.js' ||
    f.startsWith('ui/views/') || // every view, the dashboard included, is a dynamic import() in main.js
    f === 'engine/codegen.js' ||
    f === 'engine/adapters.js' ||
    f === 'engine/harness.js' ||
    f.startsWith('engine/programs/') ||
    f.startsWith('engine/runners/'));
  assert.deepEqual(forbidden, [], 'these modules must load on demand, not at startup');
});

test('the static startup graph stays small', () => {
  // Measured at 14 modules when this guard was added; the cap leaves a little room for ordinary
  // growth. If it trips, check what main.js started importing statically before raising it.
  assert.ok(files.length <= CAP, `${files.length} startup modules (cap ${CAP}):\n${files.join('\n')}`);
});
