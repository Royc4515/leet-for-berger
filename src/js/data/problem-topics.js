/**
 * Where every shipped problem sits in the learning network: its taxonomy topic, its subtopic
 * (concept) and whether it is one of the 131 essential path problems. The catalog only carries
 * the six coarse listing topics; the Problem Map needs the 26 taxonomy topics.
 *
 * Built at content time (scripts/content/build-meta.mjs) into src/js/data/problem-topics.json,
 * so the map never loads the 3,500-record index.
 *
 * Pure: no DOM, no I/O.
 */

/**
 * @typedef {{ topic: string, concept: string|null, essential: boolean }} ProblemTopic
 */

/**
 * @param {object[]} records index records (content/index/problems.json); only those with a contentId are used
 * @param {{ id: string }[]} topics taxonomy topics; a record in an unknown topic is a content bug
 * @returns {Record<string, ProblemTopic>} keyed by our problem id, sorted by id for stable diffs
 */
export function buildProblemTopics(records, topics) {
  const known = new Set(topics.map((t) => t.id));
  /** @type {[string, ProblemTopic][]} */
  const rows = [];
  const seen = new Set();
  for (const r of records) {
    if (!r.contentId || seen.has(r.contentId)) continue;
    if (!known.has(r.topic)) throw new Error(`${r.slug}: unknown topic ${r.topic}`);
    seen.add(r.contentId);
    rows.push([r.contentId, { topic: r.topic, concept: r.concept ?? null, essential: Boolean(r.essential) }]);
  }
  rows.sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(rows);
}
