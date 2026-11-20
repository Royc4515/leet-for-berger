/**
 * O(n) time: a stack of indexes with increasing heights. A bar that is not taller than the top
 * pops it, and then both limits of the popped bar are known.
 * @param {number[]} heights
 * @return {number}
 */
function largestBlock(heights) {
  const stack = [];
  let best = 0;
  const n = heights.length;
  for (let i = 0; i <= n; i++) {
    // A height-0 sentinel after the last bar pops everything still waiting.
    const h = i < n ? heights[i] : 0;
    while (stack.length && heights[stack[stack.length - 1]] >= h) {
      const height = heights[stack.pop()];
      // Everything between the new top (exclusive) and i (exclusive) is at least this tall.
      const left = stack.length ? stack[stack.length - 1] : -1;
      best = Math.max(best, height * (i - left - 1));
    }
    stack.push(i);
  }
  return best;
}
