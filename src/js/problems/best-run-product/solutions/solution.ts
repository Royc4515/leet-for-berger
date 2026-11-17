// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0152.Maximum%20Product%20Subarray/Solution.ts
// O(n) time - a negative factor swaps the largest and smallest products, so keep both.
// Products stay within 10^15, below 2^53, so plain numbers are exact.
function maxProduct(nums: number[]): number {
  // f: largest, g: smallest product of a run ending here.
  let [f, g, ans] = [nums[0], nums[0], nums[0]];
  for (let i = 1; i < nums.length; ++i) {
    // Use the old f and g for both updates; nums[i] alone covers starting a new run (after a 0).
    const [ff, gg] = [f, g];
    f = Math.max(nums[i], ff * nums[i], gg * nums[i]);
    g = Math.min(nums[i], ff * nums[i], gg * nums[i]);
    ans = Math.max(ans, f);
  }
  return ans;
}
