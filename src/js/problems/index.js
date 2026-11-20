/**
 * Problem bank.
 *
 * Listing views read `catalog` (generated metadata, src/js/problems/catalog.js) and never import a
 * problem module: a problem module builds its 10 hidden tests when it is evaluated, which made
 * every page load run all of them (about 12 s; ADR 0008). A full problem loads on demand through
 * `loadProblem(id)`.
 *
 * `planned` entries are catalog metadata only, so the dashboard and learning path can show the
 * full curriculum shape before every problem is authored.
 * To add a problem: see docs/PROBLEM_FORMAT.md or run the /add-problem Claude Code command.
 */
import { CATALOG } from './catalog.js';

export const TOPICS = [
  { id: 'arrays-strings', label: 'Arrays / Strings' },
  { id: 'greedy', label: 'Greedy' },
  { id: 'dp', label: 'Dynamic Programming' },
  { id: 'graphs', label: 'Graphs' },
  { id: 'trees', label: 'Trees' },
  { id: 'sql', label: 'SQL' },
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/** @type {{id:string,title:string,difficulty:string,topics:string[]}[]} */
const planned = [
  { id: 'mirror-check', title: 'Mirror Check (Two Pointers)', difficulty: 'Easy', topics: ['arrays-strings'] },
  { id: 'tree-level-sums', title: 'Tree Level Sums', difficulty: 'Easy', topics: ['trees'] },
  { id: 'lowest-shared-ancestor', title: 'Lowest Shared Ancestor', difficulty: 'Medium', topics: ['trees'] },
  { id: 'k-closest-points', title: 'K Closest Points (Heap)', difficulty: 'Medium', topics: ['arrays-strings'] },
  { id: 'grid-min-path', title: 'Grid Minimum Path', difficulty: 'Medium', topics: ['dp'] },
];

const entries = new Map(CATALOG.map((e) => [e.id, e]));

/** Full catalog for listing UIs. */
export const catalog = [
  ...CATALOG.map((e) => ({ id: e.id, title: e.title, difficulty: e.difficulty, topics: e.topics, status: 'available' })),
  ...planned.map((p) => ({ ...p, status: 'planned' })),
];

/**
 * Listing metadata of a shipped problem, without loading it.
 * @param {string} id
 * @returns {{ id: string, title: string, difficulty: string, topics: string[], sql: boolean } | null}
 */
export function catalogEntry(id) {
  return entries.get(id) ?? null;
}

/** Catalog rows of every shipped problem, in listing order. */
export function shippedEntries() {
  return CATALOG;
}

const loaded = new Map();

/**
 * Loads and hydrates one problem. Memoised, so the hidden tests are built once per page.
 * Resolves to null for an id that is not shipped.
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export function loadProblem(id) {
  // don't touch / only catalog ids reach import(): the id comes from the URL hash.
  if (!entries.has(id)) return Promise.resolve(null);
  if (!loaded.has(id)) {
    const pending = Promise.all([import(`./${id}/problem.js`), import('./hydrate.js')])
      .then(([mod, { hydrate }]) => hydrate(mod.default))
      .catch((err) => {
        // A failed load (offline, deploy in progress) must not stick: the next open retries.
        loaded.delete(id);
        throw err;
      });
    loaded.set(id, pending);
  }
  return loaded.get(id);
}

/**
 * Loads every shipped problem, in catalog order. For tests, the verifier and scripts: the app
 * itself never needs all of them.
 * @returns {Promise<object[]>}
 */
export function loadAllProblems() {
  return Promise.all(CATALOG.map((e) => loadProblem(e.id)));
}
