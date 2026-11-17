// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0785.Is%20Graph%20Bipartite/Solution.ts
/**
 * O(V + E) time - color each component by BFS with alternating colors (1 and -1). BFS, not
 * recursive DFS: a 10^5-node path would overflow the call stack.
 * @param {number[][]} graph
 * @return {boolean}
 */
function isBipartite(graph) {
  const n = graph.length;
  const color = Array(n).fill(0);
  // Every node is a possible start: the graph may be disconnected.
  for (let i = 0; i < n; i++) {
    if (color[i]) continue;
    color[i] = 1;
    const q = [i];
    for (let head = 0; head < q.length; head++) {
      const a = q[head];
      for (const b of graph[a]) {
        if (color[b] === color[a]) return false;
        if (!color[b]) {
          color[b] = -color[a];
          q.push(b);
        }
      }
    }
  }
  return true;
}
