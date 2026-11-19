/**
 * Fetch loader for the essential path JSON. Lives outside the path view so the dashboard can
 * use it without pulling the whole view module (ADR 0008: views load per route).
 */

let pathPromise = null;

/**
 * The essential path, fetched once and shared by the path page and the dashboard.
 * @returns {Promise<import('./learning-path.js').PathTier[]|null>}
 */
export function loadPath() {
  pathPromise ??= fetch(new URL('./essential-path.json', import.meta.url))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return pathPromise;
}
