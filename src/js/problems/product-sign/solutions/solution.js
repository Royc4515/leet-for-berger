// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1800-1899/1822.Sign%20of%20the%20Product%20of%20an%20Array/Solution.js
/**
 * O(n) time, O(1) space - track only the sign. Multiplying would overflow to Infinity, and
 * Infinity * 0 is NaN.
 * @param {number[]} nums
 * @return {number}
 */
function productSign(nums) {
  let ans = 1;
  for (const v of nums) {
    // A zero decides the answer wherever it appears.
    if (v === 0) return 0;
    if (v < 0) ans = -ans;
  }
  return ans;
}
