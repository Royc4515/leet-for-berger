// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1500-1599/1584.Min%20Cost%20to%20Connect%20All%20Points/Solution.ts
// O(n^2) - Prim's algorithm on the complete graph without building it: dist[k] is the cheapest
// wire from outside point k into the tree, computed on the fly.
function minCostConnectPoints(points: number[][]): number {
  const n = points.length;
  const dist: number[] = new Array(n).fill(Infinity);
  const vis: boolean[] = new Array(n).fill(false);
  dist[0] = 0;
  let ans = 0;
  for (let i = 0; i < n; ++i) {
    let j = -1;
    for (let k = 0; k < n; ++k) {
      if (!vis[k] && (j === -1 || dist[k] < dist[j])) {
        j = k;
      }
    }
    vis[j] = true;
    ans += dist[j];
    const [x, y] = points[j];
    for (let k = 0; k < n; ++k) {
      if (!vis[k]) {
        dist[k] = Math.min(dist[k], Math.abs(points[k][0] - x) + Math.abs(points[k][1] - y));
      }
    }
  }
  return ans;
}
