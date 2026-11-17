// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0152.Maximum%20Product%20Subarray/Solution.java
class Solution {
    // O(n) time - a negative factor swaps the largest and smallest products, so keep both.
    public long maxProduct(int[] nums) {
        // long, not int: products reach 10^15. f: largest, g: smallest product of a run ending here.
        long f = nums[0], g = nums[0], ans = nums[0];
        for (int i = 1; i < nums.length; ++i) {
            // Use the old f and g for both updates; nums[i] alone covers starting a new run (after a 0).
            long ff = f, gg = g, x = nums[i];
            f = Math.max(x, Math.max(ff * x, gg * x));
            g = Math.min(x, Math.min(ff * x, gg * x));
            ans = Math.max(ans, f);
        }
        return ans;
    }
}
