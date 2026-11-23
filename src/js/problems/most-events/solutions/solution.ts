// O(n log n + D) time - each day, attend the available event that ends soonest.
// TypeScript has no built-in heap, so this min-heap of end days lives in a plain array.
function maxEvents(events: number[][]): number {
  const sorted = [...events].sort((a, b) => a[0] - b[0]);
  const heap: number[] = [];
  const push = (v: number): void => {
    let i = heap.push(v) - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent] <= heap[i]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const pop = (): number => {
    const top = heap[0];
    const last = heap.pop() as number;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let smallest = i;
        const left = 2 * i + 1;
        const right = left + 1;
        if (left < heap.length && heap[left] < heap[smallest]) smallest = left;
        if (right < heap.length && heap[right] < heap[smallest]) smallest = right;
        if (smallest === i) break;
        [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
        i = smallest;
      }
    }
    return top;
  };
  let attended = 0;
  let i = 0;
  let day = 0;
  while (i < sorted.length || heap.length > 0) {
    // Nothing available: jump to the next start day instead of walking empty days.
    if (heap.length === 0) day = Math.max(day, sorted[i][0]);
    while (i < sorted.length && sorted[i][0] === day) push(sorted[i++][1]);
    // Events that ended before today can no longer be attended.
    while (heap.length > 0 && heap[0] < day) pop();
    if (heap.length > 0) {
      pop();
      attended++;
    }
    day++;
  }
  return attended;
}
