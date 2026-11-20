/**
 * Reference solution files ("Reveal Solution"). Separate from problems/index.js because it needs
 * the language table from engine/codegen.js, which listing views should not load (ADR 0008).
 */
import { LANGUAGES } from '../engine/codegen.js';
import { SQL_LANGUAGE } from '../engine/sql.js';

/**
 * URL of a problem's solution file for a language.
 * @param {string} problemId
 * @param {string} lang
 */
export function solutionUrl(problemId, lang) {
  const file = [...LANGUAGES, SQL_LANGUAGE].find((l) => l.id === lang)?.file;
  if (!file) throw new Error(`Unknown language "${lang}"`);
  return new URL(`./${problemId}/solutions/${file}`, import.meta.url).href;
}

/**
 * Fetches the reference solution for "Reveal Solution". Solutions are separate files (not
 * bundled into the module) so every language is a real, compilable file the verifier checks.
 * @param {string} problemId
 * @param {string} lang
 * @returns {Promise<string>}
 */
export async function loadSolution(problemId, lang) {
  const res = await fetch(solutionUrl(problemId, lang));
  if (!res.ok) throw new Error(`No ${lang} solution for ${problemId} (${res.status})`);
  return res.text();
}
