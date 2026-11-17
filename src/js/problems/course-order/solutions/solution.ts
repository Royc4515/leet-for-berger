// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0210.Course%20Schedule%20II/Solution.ts
// O((V + E) log V) time - Kahn's algorithm with a min-heap instead of a FIFO queue, so the
// smallest available course is always taken next. That greedy choice gives the
// lexicographically smallest order: taking a smaller course never blocks anything.
function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const g: number[][] = Array.from({ length: numCourses }, () => []);
  const indeg: number[] = Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) {
    g[b].push(a);
    indeg[a]++;
  }
  // JavaScript has no built-in priority queue, so this is a small binary heap.
  const heap: number[] = [];
  const push = (v: number): void => {
    heap.push(v);
    let i = heap.length - 1;
    while (i > 0 && heap[(i - 1) >> 1] > heap[i]) {
      const p = (i - 1) >> 1;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): number => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        let m = i;
        if (l < heap.length && heap[l] < heap[m]) m = l;
        if (l + 1 < heap.length && heap[l + 1] < heap[m]) m = l + 1;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) push(i);
  const ans: number[] = [];
  while (heap.length) {
    const i = pop();
    ans.push(i);
    for (const j of g[i]) if (--indeg[j] === 0) push(j);
  }
  // Courses on a cycle are never released, so a short order means no valid order exists.
  return ans.length === numCourses ? ans : [];
}
