/**
 * Battle problem picker: pure filtering and the random pick over catalog entries.
 * No DOM, no clock; the random number is a parameter.
 */

/**
 * @param {{ id: string, title: string, difficulty: string, topics: string[] }[]} entries
 * @param {{ query?: string, difficulty?: string, topic?: string }} [opts] 'all' disables a filter
 * @returns {typeof entries}
 */
export function filterProblems(entries, { query = '', difficulty = 'all', topic = 'all' } = {}) {
  const q = query.trim().toLowerCase();
  return entries.filter(
    (p) => (difficulty === 'all' || p.difficulty === difficulty) && (topic === 'all' || p.topics.includes(topic)) && (!q || p.title.toLowerCase().includes(q)),
  );
}

/**
 * Topics that at least one entry has, in the order of `topics`.
 * @param {{ topics: string[] }[]} entries
 * @param {{ id: string, label: string }[]} topics all known topics
 * @returns {{ id: string, label: string }[]}
 */
export function usedTopics(entries, topics) {
  const used = new Set(entries.flatMap((p) => p.topics));
  return topics.filter((t) => used.has(t.id));
}

/**
 * A random entry of the list.
 * @template {{ id: string }} T
 * @param {T[]} list
 * @param {number} r a number in [0, 1)
 * @returns {T|null} null for an empty list
 */
export function pickRandom(list, r) {
  if (!list.length) return null;
  return list[Math.min(list.length - 1, Math.floor(r * list.length))];
}
