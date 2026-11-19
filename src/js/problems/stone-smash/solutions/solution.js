/**
 * O(n log n) time, O(n) space: a binary max-heap hands over the heaviest stone and accepts the
 * difference. JavaScript has no built-in heap, so this one is stored in a plain array.
 * @param {number[]} stones
 * @return {number}
 */
function lastStoneWeight(stones) {
  const heap = [];

  const push = (value) => {
    let i = heap.push(value) - 1;
    // Sift up while the parent is lighter.
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent] >= heap[i]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };

  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      // Sift down toward the heavier child.
      for (;;) {
        let heaviest = i;
        const left = 2 * i + 1;
        const right = left + 1;
        if (left < heap.length && heap[left] > heap[heaviest]) heaviest = left;
        if (right < heap.length && heap[right] > heap[heaviest]) heaviest = right;
        if (heaviest === i) break;
        [heap[heaviest], heap[i]] = [heap[i], heap[heaviest]];
        i = heaviest;
      }
    }
    return top;
  };

  for (const w of stones) push(w);
  while (heap.length > 1) {
    const diff = pop() - pop();
    // Equal stones vanish; otherwise the difference goes back into the pile.
    if (diff > 0) push(diff);
  }
  return heap.length > 0 ? heap[0] : 0;
}
