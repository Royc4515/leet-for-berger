/**
 * O(n) time, O(n) space - one pass, value -> index.
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function pairSum(nums, target) {
  const seen = new Map();
  for (let j = 0; j < nums.length; j++) {
    // Look before storing nums[j], so a position is never paired with itself.
    const i = seen.get(target - nums[j]);
    if (i !== undefined) return [i, j];
    seen.set(nums[j], j);
  }
  return [];
}
