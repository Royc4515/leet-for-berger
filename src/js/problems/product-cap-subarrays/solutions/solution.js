/**
 * O(n) time - all values are >= 1, so a longer window never has a smaller product and the
 * leftmost valid start only moves forward.
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function countProductBelow(nums, k) {
  // With k <= 1 no product qualifies, and the shrink loop would run past the window.
  if (k <= 1) return 0;
  // The product stays below k * 10^4 < 10^13, exact in a double (safe up to 2^53).
  let product = 1;
  let left = 0;
  let count = 0;
  for (let right = 0; right < nums.length; right++) {
    product *= nums[right];
    while (product >= k) product /= nums[left++];
    // Every window that ends at right and starts in [left, right] fits.
    count += right - left + 1;
  }
  return count;
}
