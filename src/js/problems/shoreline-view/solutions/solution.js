/**
 * O(n) time, O(n) space: a monotonic stack of indices whose heights strictly decrease.
 * @param {number[]} heights
 * @return {number[]}
 */
function shorelineView(heights) {
  const stack = [];
  for (let i = 0; i < heights.length; i++) {
    // A building at least as tall as the one on top blocks it for good (equal heights block too).
    while (stack.length && heights[stack[stack.length - 1]] <= heights[i]) stack.pop();
    stack.push(i);
  }
  // What is left sees the sea, already in increasing index order.
  return stack;
}
