/**
 * O(E log E + Q log Q) - answer the queries offline in increasing limit. The usable edge set
 * only grows with the limit, so one union-find, fed edges in increasing length, serves every
 * query.
 * @param {number} n
 * @param {number[][]} edgeList
 * @param {number[][]} queries
 * @return {boolean[]}
 */
function distanceLimitedPathsExist(n, edgeList, queries) {
  const p = Array.from({ length: n }, (_, i) => i);
  const size = Array(n).fill(1);
  // Iterative with path halving: a recursive find can go 10^5 deep on a path graph.
  const find = (x) => {
    while (p[x] !== x) {
      p[x] = p[p[x]];
      x = p[x];
    }
    return x;
  };
  const edges = [...edgeList].sort((a, b) => a[2] - b[2]);
  // Sorting indexes, not the queries, keeps track of where each answer belongs.
  const order = queries.map((_, i) => i).sort((a, b) => queries[a][2] - queries[b][2]);
  const ans = Array(queries.length).fill(false);
  let j = 0;
  for (const i of order) {
    const [a, b, limit] = queries[i];
    // Strictly shorter: an edge equal to the limit stays out.
    while (j < edges.length && edges[j][2] < limit) {
      let u = find(edges[j][0]);
      let v = find(edges[j][1]);
      if (u !== v) {
        if (size[u] < size[v]) [u, v] = [v, u];
        p[v] = u;
        size[u] += size[v];
      }
      j++;
    }
    ans[i] = find(a) === find(b);
  }
  return ans;
}
