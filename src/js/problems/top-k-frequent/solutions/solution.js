/**
 * O(n + d log d) time - count once, then order the d distinct values by the rule.
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
function topKFrequent(nums, k) {
  const count = new Map();
  for (const x of nums) count.set(x, (count.get(x) || 0) + 1);
  // Sort the distinct values, not the whole array: d can be far smaller than n.
  return [...count.keys()].sort((a, b) => count.get(b) - count.get(a) || a - b).slice(0, k);
}
