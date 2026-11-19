/**
 * Turns a problem module into what the workspace runs: per-language entry names, starter code and
 * adapters, all derived from the neutral signature. Split from problems/index.js so the listing
 * views never import codegen, adapters or the SQL engine (docs/adr/0008-lazy-problem-modules.md);
 * index.js loads this module on demand together with the first problem.
 */
import { LANGUAGES, LANGUAGE_IDS, entryName, starterCode, isClass } from '../engine/codegen.js';
import { adapterFor } from '../engine/adapters.js';
import { SQL_LANGUAGE, isSql, sqlSetup, sqlStarter, comparatorFor, tablesInputExample } from '../engine/sql.js';

/**
 * Adds everything derived from a problem's neutral signature: per-language entry names and
 * starter code. Solutions are files in <id>/solutions and load on demand (see loadSolution).
 * @param {object} problem a problem module's default export
 * @returns {object} the hydrated problem
 */
export function hydrate(problem) {
  if (isSql(problem.signature)) return hydrateSql(problem);
  return {
    ...problem,
    languages: LANGUAGES,
    signatures: Object.fromEntries(LANGUAGE_IDS.map((l) => [l, { entry: entryName(l, problem.signature.name) }])),
    starterCode: Object.fromEntries(LANGUAGE_IDS.map((l) => [l, starterCode(l, problem.signature)])),
    // Browser-executable languages get a JSON <-> objects adapter when the signature needs one.
    // TypeScript runs as transpiled JavaScript (engine/typescript.js), so it takes the JavaScript one.
    adapters: { javascript: adapterFor('javascript', problem.signature), typescript: adapterFor('javascript', problem.signature), python: adapterFor('python', problem.signature) },
  };
}

/**
 * A SQL problem has one language and no function to call: the tables are the interface.
 * The worker gets the schema as its adapter, and judging compares result sets (engine/sql.js).
 * @param {object} problem
 */
function hydrateSql(problem) {
  const sig = problem.signature;
  return {
    ...problem,
    argNames: sig.tables.map((t) => t.name),
    languages: [SQL_LANGUAGE],
    signatures: { sql: { entry: 'query' } },
    starterCode: { sql: sqlStarter(sig) },
    adapters: { sql: sqlSetup(sig) },
    compare: comparatorFor(sig),
    customInputExample: tablesInputExample(sig, problem.visibleTests[0].args),
  };
}

/**
 * @typedef {Object} CatalogEntry
 * @property {string} id
 * @property {string} title
 * @property {'Easy'|'Medium'|'Hard'} difficulty
 * @property {string[]} topics
 * @property {'available'|'planned'} status
 * @property {'function'|'class'|'sql'} [kind]  available problems only
 * @property {string[]} [executable]            languages that run in the browser; available problems only
 */

/**
 * The catalog entry of a hydrated problem: what the listing views, the learning path and the
 * mode setups read without loading the module. scripts/content/build-catalog.mjs writes these
 * into catalog.js and tests/catalog.test.js checks them against the modules.
 * @param {object} problem hydrated problem
 * @returns {CatalogEntry}
 */
export function catalogFields(problem) {
  const sig = problem.signature;
  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
    status: 'available',
    kind: isSql(sig) ? 'sql' : isClass(sig) ? 'class' : 'function',
    executable: problem.languages.filter((l) => l.executable).map((l) => l.id),
  };
}

/**
 * URL of a problem's solution file for a language.
 * @param {string} problemId
 * @param {string} lang
 * @returns {string}
 */
export function solutionUrl(problemId, lang) {
  const file = [...LANGUAGES, SQL_LANGUAGE].find((l) => l.id === lang)?.file;
  if (!file) throw new Error(`Unknown language "${lang}"`);
  return new URL(`./${problemId}/solutions/${file}`, import.meta.url).href;
}
