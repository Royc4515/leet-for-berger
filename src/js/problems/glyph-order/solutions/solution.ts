// O(C + 26^2): neighbors give one "x before y" edge at their first difference, then Kahn's
// algorithm always takes the smallest free letter, which yields the alphabetically first order.
function glyphOrder(words: string[]): string {
  const A = 97;
  const present: boolean[] = new Array(26).fill(false);
  for (const w of words) for (let i = 0; i < w.length; i++) present[w.charCodeAt(i) - A] = true;
  const edge: boolean[][] = Array.from({ length: 26 }, () => new Array(26).fill(false));
  const indeg: number[] = new Array(26).fill(0);
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i];
    const b = words[i + 1];
    const m = Math.min(a.length, b.length);
    let j = 0;
    while (j < m && a[j] === b[j]) j++;
    if (j === m) {
      // A word directly above its own proper prefix fits no order at all.
      if (a.length > b.length) return '';
      continue;
    }
    const u = a.charCodeAt(j) - A;
    const v = b.charCodeAt(j) - A;
    // Count a repeated fact once, or its indegree never drops to zero.
    if (!edge[u][v]) {
      edge[u][v] = true;
      indeg[v]++;
    }
  }
  const total = present.filter(Boolean).length;
  const used: boolean[] = new Array(26).fill(false);
  let out = '';
  while (out.length < total) {
    let pick = -1;
    for (let c = 0; c < 26 && pick === -1; c++) if (present[c] && !used[c] && indeg[c] === 0) pick = c;
    // Letters remain but none is free: they lie on a cycle.
    if (pick === -1) return '';
    used[pick] = true;
    out += String.fromCharCode(A + pick);
    for (let v = 0; v < 26; v++) if (edge[pick][v]) indeg[v]--;
  }
  return out;
}
