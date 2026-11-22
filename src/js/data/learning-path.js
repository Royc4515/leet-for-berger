/**
 * Essential learning path: the 131 essential problems (one per subtopic) arranged by the
 * learning network in taxonomy.js: tiers in prerequisite order, topics inside a tier in
 * taxonomy order, problems inside a topic easy to hard, and by concept order (first-seen to
 * last-seen) within one difficulty.
 *
 * Built at content time (scripts/content/build-meta.mjs) into src/js/data/essential-path.json.
 * Progress is always derived from solve data, never stored twice.
 *
 * Pure: no DOM, no I/O.
 */

const DIFFICULTY_RANK = { Easy: 0, Medium: 1, Hard: 2 };

/** Tier names, matching the section comments in taxonomy.js. */
export const TIER_TITLES = ['Vocabulary', 'First patterns', 'Patterns built on patterns', 'Core data structures', 'Structures on structures', 'Advanced'];

/** What finishing each tier means, one line each, in TIER_TITLES order. */
export const TIER_SUMMARIES = [
  'You can store, count and look things up in one pass, and read a basic SQL query.',
  'You know the first named patterns: two pointers, stacks, prefix sums, sorting, bits and recursion.',
  'You can build on those patterns: sliding windows, binary search, linked list surgery and greedy choices.',
  'You can work with trees, search with backtracking and write 1D dynamic programming.',
  'You can use heaps and tries, traverse graphs and write 2D dynamic programming.',
  'You have the advanced tools: union find, advanced graph algorithms and range queries.',
];

/**
 * Whether a topic starts expanded: the one holding "Next up", and any topic part-way done.
 * Untouched and finished topics start collapsed so the page stays scannable.
 * @param {{ done: number, total: number, holdsNext: boolean }} t
 * @returns {boolean}
 */
export function topicStartsOpen({ done, total, holdsNext }) {
  return holdsNext || (done > 0 && done < total);
}

/**
 * @typedef {{ id: string, concept: string, difficulty: string }} PathProblem  id = our problem id
 * @typedef {{ id: string, title: string, prereqs: string[], problems: PathProblem[] }} PathTopic
 * @typedef {{ tier: number, title: string, topics: PathTopic[] }} PathTier
 */

/**
 * @param {object[]} records index records; only `essential` ones with a contentId are used
 * @param {import('./taxonomy.js').Topic[]} topics
 * @returns {PathTier[]}
 */
export function buildPath(records, topics) {
  const topicIndex = new Map(topics.map((t, i) => [t.id, i]));
  const byTopic = new Map();
  for (const r of records) {
    if (!r.essential || !r.contentId) continue;
    if (!topicIndex.has(r.topic)) throw new Error(`${r.slug}: essential problem in unknown topic ${r.topic}`);
    if (!byTopic.has(r.topic)) byTopic.set(r.topic, []);
    byTopic.get(r.topic).push(r);
  }
  const tiers = [];
  for (const t of topics) {
    const rs = byTopic.get(t.id);
    if (!rs) continue;
    const conceptRank = (c) => {
      const i = t.concepts.indexOf(c);
      return i === -1 ? t.concepts.length : i;
    };
    // Difficulty first: a learner should never open a topic on its Medium while an Easy waits.
    rs.sort((a, b) => (DIFFICULTY_RANK[a.difficulty] ?? 3) - (DIFFICULTY_RANK[b.difficulty] ?? 3) || conceptRank(a.concept) - conceptRank(b.concept) || a.essential.order - b.essential.order || a.slug.localeCompare(b.slug));
    let tier = tiers.find((x) => x.tier === t.tier);
    if (!tier) {
      tier = { tier: t.tier, title: TIER_TITLES[t.tier] ?? `Tier ${t.tier}`, topics: [] };
      tiers.push(tier);
    }
    tier.topics.push({ id: t.id, title: t.title, prereqs: t.prereqs, problems: rs.map((r) => ({ id: r.contentId, concept: r.concept, difficulty: r.difficulty })) });
  }
  return tiers.sort((a, b) => a.tier - b.tier);
}

/**
 * Every problem in path order.
 * @param {PathTier[]} path
 * @returns {PathProblem[]}
 */
export function pathOrder(path) {
  return path.flatMap((t) => t.topics.flatMap((tp) => tp.problems));
}

/**
 * @param {PathTier[]} path
 * @param {(id: string) => boolean} isSolved
 * @returns {{ total: number, solved: number, next: PathProblem|null }} next = first unsolved in path order
 */
export function pathProgress(path, isSolved) {
  const all = pathOrder(path);
  const solved = all.filter((p) => isSolved(p.id)).length;
  return { total: all.length, solved, next: all.find((p) => !isSolved(p.id)) ?? null };
}

/**
 * "sliding-window-max" -> "Sliding window max". Concept ids are written to read well this way.
 * @param {string} concept
 * @returns {string}
 */
export function conceptLabel(concept) {
  const s = (concept ?? '').replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
