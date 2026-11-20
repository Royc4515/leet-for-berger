/**
 * Fetches the essential path (src/js/data/essential-path.json) once per page. Its own module so the
 * dashboard can read it without importing the Learning Path view (ADR 0008); in ui/ because it
 * does I/O, and data/ holds pure modules.
 */

let pathPromise = null;

/**
 * The essential path, fetched once and shared by the path page and the dashboard.
 * @returns {Promise<import('../data/learning-path.js').PathTier[]|null>}
 */
export function loadPath() {
  pathPromise ??= fetch(new URL('../data/essential-path.json', import.meta.url))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return pathPromise;
}
