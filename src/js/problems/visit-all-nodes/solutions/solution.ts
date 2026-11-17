// O(2^n * n^2) - BFS over states (node, set of visited nodes as a bitmask). A walk may revisit
// nodes, so the node alone is not a state. All n single-node states start at distance 0, which
// tries every starting node in one search.
function shortestPathLength(n: number, edges: number[][]): number {
  const graph: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }
  const full = (1 << n) - 1;
  // A state is packed as mask * n + node, which also indexes the visited table.
  const vis = new Uint8Array(n << n);
  let q: number[] = [];
  for (let i = 0; i < n; i++) {
    vis[(1 << i) * n + i] = 1;
    q.push((1 << i) * n + i);
  }
  for (let ans = 0; ; ans++) {
    // One BFS layer per step, so ans is the walk length of every state in it.
    const next: number[] = [];
    for (const state of q) {
      const i = state % n;
      const st = (state - i) / n;
      if (st === full) return ans;
      for (const j of graph[i]) {
        const code = (st | (1 << j)) * n + j;
        if (!vis[code]) {
          vis[code] = 1;
          next.push(code);
        }
      }
    }
    q = next;
  }
}
