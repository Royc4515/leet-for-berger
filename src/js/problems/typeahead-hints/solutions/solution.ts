// O(n log n + L log n): sort once, then for each typed prefix the matching names form one block
// that starts at the first name that is not smaller than the prefix.
function suggestNames(products: string[], searchWord: string): string[][] {
  // Default sort compares UTF-16 code units, which is dictionary order for lowercase letters.
  const sorted = [...products].sort();
  const out: string[][] = [];
  let start = 0;
  for (let i = 1; i <= searchWord.length; i++) {
    const prefix = searchWord.slice(0, i);
    // A longer prefix keeps only a subset of the shorter one's matches, so the search can begin
    // where the previous one ended.
    let low = start;
    let high = sorted.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (sorted[mid] < prefix) low = mid + 1;
      else high = mid;
    }
    start = low;
    const row: string[] = [];
    for (let j = start; j < sorted.length && row.length < 3 && sorted[j].startsWith(prefix); j++) {
      row.push(sorted[j]);
    }
    out.push(row);
  }
  return out;
}
