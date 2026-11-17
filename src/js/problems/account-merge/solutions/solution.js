// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0721.Accounts%20Merge/Solution.ts
/**
 * O(E log E) for E emails - union-find over account indexes: each email links its account
 * to the first account seen with it, which merges transitively connected accounts.
 * @param {string[][]} accounts
 * @return {string[][]}
 */
function accountsMerge(accounts) {
  const n = accounts.length;
  const p = Array.from({ length: n }, (_, i) => i);
  const size = Array(n).fill(1);
  const find = (x) => {
    while (p[x] !== x) {
      p[x] = p[p[x]];
      x = p[x];
    }
    return x;
  };
  const union = (a, b) => {
    let pa = find(a);
    let pb = find(b);
    if (pa === pb) return;
    // Union by size keeps the trees shallow.
    if (size[pa] < size[pb]) [pa, pb] = [pb, pa];
    p[pb] = pa;
    size[pa] += size[pb];
  };
  const owner = new Map();
  accounts.forEach((acc, i) => {
    for (const email of acc.slice(1)) {
      const j = owner.get(email);
      if (j === undefined) owner.set(email, i);
      else union(i, j);
    }
  });
  // Iterating the owner map visits each distinct email once, so no duplicates survive.
  const groups = new Map();
  for (const [email, i] of owner) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(email);
  }
  // Explicit code-unit comparison; localeCompare would order "Mcafee" before "McDonald".
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const ans = [];
  for (const [root, emails] of groups) ans.push([accounts[root][0], ...emails.sort(cmp)]);
  return ans.sort((a, b) => cmp(a[0], b[0]) || cmp(a[1], b[1]));
}
