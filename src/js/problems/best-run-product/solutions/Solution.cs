// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0152.Maximum%20Product%20Subarray/Solution.cs
public class Solution {
    // O(n) time - a negative factor swaps the largest and smallest products, so keep both.
    public long MaxProduct(int[] nums) {
        // long, not int: products reach 10^15. f: largest, g: smallest product of a run ending here.
        long f = nums[0], g = nums[0], ans = nums[0];
        for (int i = 1; i < nums.Length; ++i) {
            // Use the old f and g for both updates; x alone covers starting a new run (after a 0).
            long ff = f, gg = g, x = nums[i];
            f = Math.Max(x, Math.Max(ff * x, gg * x));
            g = Math.Min(x, Math.Min(ff * x, gg * x));
            ans = Math.Max(ans, f);
        }
        return ans;
    }
}
