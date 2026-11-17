/**
 * O(n) time, O(1) space - two pointers that always move the side with the lower wall.
 * @param {number[]} heights
 * @return {number}
 */
function trapRain(heights) {
  let lo = 0;
  let hi = heights.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  // Doubles hold integers exactly up to 2^53, far above the largest possible total.
  let water = 0;
  while (lo < hi) {
    // The lower end is bounded by its own side's maximum: the other side is at least as tall.
    if (heights[lo] <= heights[hi]) {
      leftMax = Math.max(leftMax, heights[lo]);
      water += leftMax - heights[lo];
      lo++;
    } else {
      rightMax = Math.max(rightMax, heights[hi]);
      water += rightMax - heights[hi];
      hi--;
    }
  }
  return water;
}
