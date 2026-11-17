// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0053.Maximum%20Subarray/Solution.java
class Solution {
    // O(n) time - the best run ending at i either extends the one ending at i - 1 or starts at i.
    public int maxSubArray(int[] nums) {
        // Start from nums[0], not 0: the run must be non-empty, so all-negative input stays negative.
        int ans = nums[0];
        for (int i = 1, run = nums[0]; i < nums.length; ++i) {
            // A negative running sum only drags the next element down, so drop it.
            run = Math.max(run, 0) + nums[i];
            ans = Math.max(ans, run);
        }
        return ans;
    }
}
