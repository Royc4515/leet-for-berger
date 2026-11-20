/**
 * O(n) time, O(1) space: after k steps the total is start + prefix[k], so the tightest moment is
 * the lowest prefix sum. The lowest starts at 0 ("no steps yet") so the answer is at least 1.
 * @param {number[]} nums
 * @return {number}
 */
var minStartValue = function (nums) {
  let total = 0;
  let lowest = 0;
  for (let i = 0; i < nums.length; i++) {
    total += nums[i];
    if (total < lowest) lowest = total;
  }
  return 1 - lowest;
};
