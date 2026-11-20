/**
 * O(n) time, O(1) space: the answer is the longest window that holds at most k zeros. The left
 * edge only moves forward, so each element enters and leaves the window once.
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var longestRunWithFlips = function (nums, k) {
  let left = 0;
  let zeros = 0;
  let best = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeros++;
    // One new zero may be paid for by dropping many ones first, so this is a loop.
    while (zeros > k) {
      if (nums[left] === 0) zeros--;
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
};
