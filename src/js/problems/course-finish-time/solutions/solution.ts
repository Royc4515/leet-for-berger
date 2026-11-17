// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2000-2099/2050.Parallel%20Courses%20III/Solution.ts
// O(n + m) - Kahn's topological order. f[i] is the month course i finishes: its own time plus
// the latest finish among its prerequisites, final once all of them are processed.
function minimumTime(n: number, relations: number[][], time: number[]): number {
  const g: number[][] = Array.from({ length: n }, () => []);
  const indeg: number[] = new Array(n).fill(0);
  for (const [a, b] of relations) {
    g[a - 1].push(b - 1);
    ++indeg[b - 1];
  }
  const q: number[] = [];
  const f: number[] = new Array(n).fill(0);
  let ans = 0;
  for (let i = 0; i < n; ++i) {
    if (indeg[i] === 0) {
      q.push(i);
      f[i] = time[i];
      ans = Math.max(ans, f[i]);
    }
  }
  // A moving head index instead of shift(), which is O(n) per call on a large array.
  for (let head = 0; head < q.length; ++head) {
    const i = q[head];
    for (const j of g[i]) {
      f[j] = Math.max(f[j], f[i] + time[j]);
      ans = Math.max(ans, f[j]);
      if (--indeg[j] === 0) {
        q.push(j);
      }
    }
  }
  return ans;
}
