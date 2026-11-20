/**
 * Turns a problem module into the object the workspace and the verifier use. Kept apart from
 * problems/index.js so listing views (dashboard, path, companies) never load the code generators:
 * index.js imports this module only inside loadProblem (ADR 0008).
 */
import { LANGUAGES, LANGUAGE_IDS, entryName, starterCode } from '../engine/codegen.js';
import { adapterFor } from '../engine/adapters.js';
import { SQL_LANGUAGE, isSql, sqlSetup, sqlStarter, comparatorFor, tablesInputExample } from '../engine/sql.js';

/**
 * Adds everything derived from a problem's neutral signature: per-language entry names and
 * starter code. Solutions are files in <id>/solutions and load on demand (see problems/solutions.js).
 * @param {object} problem a problem module's default export
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
