// Invariant 8: every CDN dependency names an exact version, so a release upstream never changes
// the site without an e2e run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(js|html)$/.test(f) ? [p] : [];
  });
}

test('CDN URLs pin exact versions', () => {
  const sources = [...files('src/js'), 'index.html'].map((f) => [f, readFileSync(f, 'utf8')]);
  const loose = [];
  for (const [f, text] of sources) {
    for (const url of text.match(/https:\/\/cdn\.jsdelivr\.net\/(?:npm|pyodide)\/[^'"`\s]+/g) ?? []) {
      // Exact x.y.z (a template like ${MONACO_VERSION} is checked below).
      if (!/@\d+\.\d+\.\d+\/|\/v\d+\.\d+\.\d+\/|\$\{[A-Z_]+\}/.test(url)) loose.push(`${f}: ${url}`);
    }
  }
  assert.deepEqual(loose, []);
  const monaco = sources.map(([, t]) => t.match(/MONACO_VERSION\s*=\s*'([^']+)'/)?.[1]).find(Boolean);
  assert.equal(monaco, '0.52.2');
});
