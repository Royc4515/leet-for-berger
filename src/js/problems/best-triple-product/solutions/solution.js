/**
 * O(n) time, O(1) space: track the three largest and two smallest numbers in one pass.
 * Two negatives times the largest positive can beat the top three positives.
 * @param {number[]} nums
 * @return {number}
 */
var maxTripleProduct = function (nums) {
  let max1 = -1001;
  let max2 = -1001;
  let max3 = -1001;
  let min1 = 1001;
  let min2 = 1001;
  for (let i = 0; i < nums.length; i++) {
    const v = nums[i];
    if (v >= max1) {
      max3 = max2;
      max2 = max1;
      max1 = v;
    } else if (v >= max2) {
      max3 = max2;
      max2 = v;
    } else if (v > max3) {
      max3 = v;
    }
    if (v <= min1) {
      min2 = min1;
      min1 = v;
    } else if (v < min2) {
      min2 = v;
    }
  }
  const a = max1 * max2 * max3;
  const b = min1 * min2 * max1;
  return a > b ? a : b;
};
