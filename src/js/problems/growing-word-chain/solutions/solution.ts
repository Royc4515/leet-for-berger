// O(n * L^2) time, O(n * L) space. Short words first, so every predecessor (one letter
// shorter) already holds its final chain length when a word looks it up.
function longestChain(words: string[]): number {
  const sorted = [...words].sort((a, b) => a.length - b.length);
  const best = new Map<string, number>();
  let answer = 0;
  for (const w of sorted) {
    // Deleting one letter lists every word that can grow into w: at most L lookups, no pair scan.
    let here = 1;
    for (let i = 0; i < w.length; i++) {
      here = Math.max(here, (best.get(w.slice(0, i) + w.slice(i + 1)) ?? 0) + 1);
    }
    best.set(w, here);
    answer = Math.max(answer, here);
  }
  return answer;
}
