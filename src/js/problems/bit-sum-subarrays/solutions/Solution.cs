public class Solution {
    // O(n) time, O(1) extra space: exact sum == goal equals atMost(goal) - atMost(goal - 1).
    public long CountBitSubarrays(int[] nums, int goal) {
        return AtMost(nums, goal) - AtMost(nums, goal - 1);
    }

    private static long AtMost(int[] nums, int limit) {
        if (limit < 0) return 0;
        int left = 0;
        int window = 0;
        long total = 0;
        for (int right = 0; right < nums.Length; right++) {
            window += nums[right];
            while (window > limit) {
                window -= nums[left];
                left++;
            }
            total += right - left + 1;
        }
        return total;
    }
}
