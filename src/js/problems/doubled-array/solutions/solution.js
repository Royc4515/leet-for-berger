// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1929.Concatenation%20of%20Array/Solution.js
/**
 * O(n) - spreading twice builds a new array of length 2n and leaves nums untouched.
 * @param {number[]} nums
 * @return {number[]}
 */
function doubleArray(nums) {
  return [...nums, ...nums];
}
