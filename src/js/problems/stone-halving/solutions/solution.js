/**
 * O(n + k log n) time - halving the current largest pile always removes the most stones.
 * JavaScript has no built-in heap, so this max-heap lives in a plain array.
 * @param {number[]} piles
 * @param {number} k
 * @return {number}
 */
function minStoneSum(piles, k) {
  const heap = [...piles];
  const siftDown = (i) => {
    for (;;) {
      let largest = i;
      const left = 2 * i + 1;
      const right = left + 1;
      if (left < heap.length && heap[left] > heap[largest]) largest = left;
      if (right < heap.length && heap[right] > heap[largest]) largest = right;
      if (largest === i) return;
      [heap[largest], heap[i]] = [heap[i], heap[largest]];
      i = largest;
    }
  };
  // Building the heap bottom-up is O(n), cheaper than n pushes.
  for (let i = (heap.length >> 1) - 1; i >= 0; i--) siftDown(i);
  for (let op = 0; op < k; op++) {
    // floor(p / 2) stones go; the smaller pile sinks back to its place and may still be on top.
    heap[0] -= Math.floor(heap[0] / 2);
    siftDown(0);
  }
  let total = 0;
  for (const p of heap) total += p;
  return total;
}
