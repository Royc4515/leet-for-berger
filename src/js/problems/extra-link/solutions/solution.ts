// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0684.Redundant%20Connection/Solution.ts
// O(n alpha(n)) time - union-find in input order; the first link whose ends are already
// connected closes the cycle, and every other cycle link came before it.
function findRedundantConnection(edges: number[][]): number[] {
  const n = edges.length;
  const p: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  const size: number[] = Array(n + 1).fill(1);
  // Iterative with path halving: a recursive find can go 10^5 deep before compressing.
  const find = (x: number): number => {
    while (p[x] !== x) {
      p[x] = p[p[x]];
      x = p[x];
    }
    return x;
  };
  for (const [a, b] of edges) {
    let pa = find(a);
    let pb = find(b);
    if (pa === pb) return [a, b];
    // Union by size keeps every tree shallow.
    if (size[pa] < size[pb]) [pa, pb] = [pb, pa];
    p[pb] = pa;
    size[pa] += size[pb];
  }
  return [];
}
