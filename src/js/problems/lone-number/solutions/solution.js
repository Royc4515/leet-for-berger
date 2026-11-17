/**
 * O(n) time, O(1) space - x ^ x === 0 and XOR is order independent, so every pair cancels and
 * only the lone value survives the fold.
 * @param {number[]} nums
 * @return {number}
 */
function singleNumber(nums) {
  let x = 0;
  for (const v of nums) x ^= v;
  return x;
}
