#!/usr/bin/env node
/**
 * Suite snapshot: SHA-256 of every problem's 15 cases (visible + hidden args and expected), so a
 * refactor of how problems load can prove it did not change a single test. The committed hashes
 * live in tests/fixtures/suite-hashes.json and tests/suite-snapshot.test.js compares against them.
 *
 * Usage:
 *   node scripts/content/suite-hashes.mjs          compare with the fixture, exit 1 on a difference
 *   node scripts/content/suite-hashes.mjs --write  rewrite the fixture (after a deliberate test change)
 */

import { createHash } from 'node:crypto';
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSuite } from '../../src/js/engine/harness.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROBLEMS_DIR = join(ROOT, 'src/js/problems');
export const FIXTURE = join(ROOT, 'tests/fixtures/suite-hashes.json');

/**
 * JSON with object keys sorted, so the hash depends on values, not on key order. Tagged types
 * JSON would flatten (undefined, NaN, Infinity, -0, BigInt) keep a distinct spelling.
 * @param {unknown} v
 * @returns {string}
 */
export function canonicalJson(v) {
  // Normalize first, then one native stringify without a replacer: a replacer (or a hand-rolled
  // serializer) is called per number and took 10-16 s on the 10^5-element suites.
  return JSON.stringify(normalize(v));
}

/** A copy only where JSON would lose information or depend on key order; plain data comes back as is. */
function normalize(x) {
  if (x === undefined) return { $undefined: true };
  if (typeof x === 'bigint') return { $bigint: String(x) };
  if (typeof x === 'number') return Object.is(x, -0) || !Number.isFinite(x) ? { $num: Object.is(x, -0) ? '-0' : String(x) } : x;
  if (x === null || typeof x !== 'object') return x;
  if (typeof x.toJSON === 'function') return normalize(x.toJSON());
  if (Array.isArray(x)) {
    let out = x;
    for (let i = 0; i < x.length; i++) {
      const n = normalize(x[i]);
      if (n !== x[i]) {
        if (out === x) out = x.slice();
        out[i] = n;
      }
    }
    return out;
  }
  const sorted = {};
  for (const k of Object.keys(x).sort()) sorted[k] = normalize(x[k]);
  return sorted;
}

/**
 * Ids of every problem directory, read from disk rather than from problems/index.js so the
 * snapshot does not depend on the loading code it guards.
 * @returns {string[]}
 */
export function problemIds() {
  return readdirSync(PROBLEMS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(PROBLEMS_DIR, d.name, 'problem.js')))
    .map((d) => d.name)
    .sort();
}

/**
 * SHA-256 of one problem's canonical 15-case suite.
 * @param {object} problem a problem module's default export
 * @returns {string} hex digest
 */
export function suiteHash(problem) {
  const cases = buildSuite(problem).map(({ id, visible, args, expected }) => ({ id, visible, args, expected }));
  return createHash('sha256').update(canonicalJson(cases)).digest('hex');
}

/**
 * Hash of every problem on disk, keyed by id in sorted order.
 * @returns {Promise<Record<string, string>>}
 */
export async function computeSuiteHashes() {
  const out = {};
  for (const id of problemIds()) {
    const mod = await import(pathToFileURL(join(PROBLEMS_DIR, id, 'problem.js')).href);
    out[id] = suiteHash(mod.default);
  }
  return out;
}

/** @returns {Record<string, string>} */
export function readFixture() {
  return JSON.parse(readFileSync(FIXTURE, 'utf8'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const hashes = await computeSuiteHashes();
  if (process.argv.includes('--write')) {
    writeFileSync(FIXTURE, JSON.stringify(hashes, null, 1) + '\n');
    console.log(`${Object.keys(hashes).length} suites -> tests/fixtures/suite-hashes.json`);
  } else {
    const saved = existsSync(FIXTURE) ? readFixture() : {};
    const ids = [...new Set([...Object.keys(saved), ...Object.keys(hashes)])].sort();
    const diff = ids.filter((id) => saved[id] !== hashes[id]);
    for (const id of diff) console.log(`${id}: ${saved[id] ? (hashes[id] ? 'changed' : 'removed') : 'new'}`);
    console.log(diff.length ? `${diff.length} suites differ from the fixture.` : `${ids.length} suites match the fixture.`);
    process.exitCode = diff.length ? 1 : 0;
  }
}
