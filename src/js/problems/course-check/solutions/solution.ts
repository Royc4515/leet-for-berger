// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0207.Course%20Schedule/Solution.ts
// O(V + E) time - Kahn's algorithm. Iterative on purpose: chains of 10^5 courses would
// overflow the call stack in a recursive DFS.
function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const g: number[][] = Array.from({ length: numCourses }, () => []);
  const indeg: number[] = Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) {
    g[b].push(a);
    indeg[a]++;
  }
  const q: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
  // A moving head index instead of shift(), which is O(n) per call.
  for (let head = 0; head < q.length; head++) {
    for (const j of g[q[head]]) if (--indeg[j] === 0) q.push(j);
  }
  // Courses on a cycle never reach in-degree 0, so they are never queued.
  return q.length === numCourses;
}
