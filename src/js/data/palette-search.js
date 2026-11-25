/**
 * Command palette search: ranks problems, topics, companies and pages against what was typed.
 * Subsequence matching with bonuses for word starts and contiguous runs, so "tps" finds
 * "Two Pointers" and "pst" finds "Pair Sum Target", the way editors' quick-open does.
 *
 * Pure: no DOM, deterministic order (score, then kind order, then label).
 */

/**
 * @typedef {{ kind: 'page'|'action'|'setting'|'link'|'problem'|'topic'|'company', id: string, label: string, hint?: string, href?: string, run?: () => void, keywords?: string }} PaletteItem
 */

const KIND_ORDER = { page: 0, problem: 1, topic: 2, company: 3, action: 4, setting: 4, link: 5 };

/**
 * Scores one label against a query, or returns -1 when the query is not a subsequence.
 * Higher is better. Case-insensitive.
 * @param {string} query
 * @param {string} label
 * @returns {number}
 */
export function matchScore(query, label) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const s = label.toLowerCase();
  if (s === q) return 1000;
  if (s.startsWith(q)) return 800 - s.length;
  // A substring counts only from a word start: "sum" finds "Pair Sum Target", "two" not "neTWOrks".
  const idx = s.search(new RegExp(`(^|[\\s\\-_/&.])${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  if (idx >= 0) return 600 - idx - s.length / 10;
  let score = 0;
  let pos = 0;
  let run = 0;
  let first = true;
  for (const ch of q) {
    if (ch === ' ') continue;
    const found = s.indexOf(ch, pos);
    if (found === -1) return -1;
    const wordStart = found === 0 || /[\s\-_/&.]/.test(s[found - 1]);
    // Scattered letters starting mid-word ("two" in "neTWOrks") are noise, not a match.
    if (first && !wordStart) return -1;
    first = false;
    run = found === pos ? run + 1 : 0;
    score += 10 + (wordStart ? 25 : 0) + run * 8 - Math.min(found - pos, 10);
    pos = found + 1;
  }
  return score;
}

/**
 * Best items for a query. An empty query returns the items as given (callers pass their
 * "suggested" order), capped at `limit`.
 * @param {PaletteItem[]} items
 * @param {string} query
 * @param {number} [limit]
 * @returns {PaletteItem[]}
 */
export function searchPalette(items, query, limit = 8) {
  if (!query.trim()) return items.slice(0, limit);
  return items
    .map((item, i) => {
      const main = matchScore(query, item.label);
      const extra = item.keywords ? matchScore(query, item.keywords) * 0.6 : -1;
      return { item, i, score: Math.max(main, extra) };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || KIND_ORDER[a.item.kind] - KIND_ORDER[b.item.kind] || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map((x) => x.item);
}
