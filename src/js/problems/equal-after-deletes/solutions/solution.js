// O(n) time, O(n) space - a window that never shrinks; best is the highest count of one value seen.
function longestEqualSubarray(nums, k) {
  const count = new Array(nums.length + 1).fill(0);
  let best = 0;
  let left = 0;
  for (let right = 0; right < nums.length; right++) {
    best = Math.max(best, ++count[nums[right]]);
    // Too many deletions needed: slide instead of grow. A stale best only stops the window from
    // growing, and growing again needs a real new best.
    if (right - left + 1 - best > k) count[nums[left++]]--;
  }
  return best;
}
