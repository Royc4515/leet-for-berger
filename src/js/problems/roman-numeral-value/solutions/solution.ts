const VALUES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

// O(n) time - each symbol only needs its right neighbour to know its sign.
function romanToInt(s: string): number {
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const v = VALUES[s[i]];
    // A smaller symbol before a larger one is the left half of a subtractive pair (IV, CM).
    total += i + 1 < s.length && v < VALUES[s[i + 1]] ? -v : v;
  }
  return total;
}
