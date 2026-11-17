/**
 * O(M + R + K log K) time, O(M + K) space - index groups once.
 * @param {number[][]} users
 * @param {string[]} requests
 * @return {number[]}
 */
function notifyRecipients(users, requests) {
  const known = new Set();
  const members = new Map();
  for (const [id, ...groups] of users) {
    known.add(id);
    for (const g of groups) {
      if (!members.has(g)) members.set(g, []);
      members.get(g).push(id);
    }
  }
  const out = new Set();
  const expanded = new Set();
  for (const r of requests) {
    const [kind, raw] = r.split(':');
    const id = Number(raw);
    if (kind === 'user') {
      if (known.has(id)) out.add(id);
    } else if (!expanded.has(id)) {
      // Walk each group at most once: repeated group requests add nothing new.
      expanded.add(id);
      for (const u of members.get(id) ?? []) out.add(u);
    }
  }
  // Numeric comparator: the default sort compares ids as strings.
  return [...out].sort((a, b) => a - b);
}
