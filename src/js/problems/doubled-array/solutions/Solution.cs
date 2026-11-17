public class Solution {
    // O(n) - allocate 2n once; each value is written to i and i + n.
    public int[] DoubleArray(int[] nums) {
        int n = nums.Length;
        var ans = new int[2 * n];
        for (int i = 0; i < n; i++) {
            ans[i] = ans[i + n] = nums[i];
        }
        return ans;
    }
}
