// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0033.Search%20in%20Rotated%20Sorted%20Array/Solution.js
/**
 * O(log n) time - at least one half of a rotated array is sorted; range-check the target there.
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  const n = nums.length;
  let left = 0;
  let right = n - 1;
  // Narrow to one index that holds the target if it exists anywhere.
  while (left < right) {
    const mid = (left + right) >> 1;
    if (nums[0] <= nums[mid]) {
      // nums[0..mid] is sorted.
      if (nums[0] <= target && target <= nums[mid]) right = mid;
      else left = mid + 1;
    } else {
      // nums[mid..n-1] is sorted.
      if (nums[mid] < target && target <= nums[n - 1]) left = mid + 1;
      else right = mid;
    }
  }
  return nums[left] === target ? left : -1;
}
