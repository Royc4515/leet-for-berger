// O(n log n) - sweep the edges left to right with a max-heap of the buildings already started,
// as [height, right]. Finished buildings are removed lazily, only when they reach the top: the
// top is all that matters, and searching the heap for them would be O(n).
function getSkyline(buildings: number[][]): number[][] {
  const lines = [...new Set(buildings.flatMap((b) => [b[0], b[1]]))].sort((a, b) => a - b);
  const heap: number[][] = [];
  const push = (item: number[]): void => {
    let i = heap.push(item) - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] >= item[0]) break;
      heap[i] = heap[p];
      i = p;
    }
    heap[i] = item;
  };
  const pop = (): void => {
    const last = heap.pop()!;
    if (!heap.length) return;
    let i = 0;
    while (true) {
      let c = 2 * i + 1;
      if (c >= heap.length) break;
      if (c + 1 < heap.length && heap[c + 1][0] > heap[c][0]) c++;
      if (heap[c][0] <= last[0]) break;
      heap[i] = heap[c];
      i = c;
    }
    heap[i] = last;
  };
  const skys: number[][] = [];
  let city = 0;
  for (const line of lines) {
    while (city < buildings.length && buildings[city][0] <= line) {
      push([buildings[city][2], buildings[city][1]]);
      city++;
    }
    while (heap.length && heap[0][1] <= line) pop();
    const high = heap.length ? heap[0][0] : 0;
    // Only a change of height is a key point.
    if (skys.length && skys[skys.length - 1][1] === high) continue;
    skys.push([line, high]);
  }
  return skys;
}
