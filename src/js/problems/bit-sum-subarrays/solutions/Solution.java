class Solution {
    // O(n) time, O(1) extra space: exact sum == goal equals atMost(goal) - atMost(goal - 1).
    public long countBitSubarrays(int[] nums, int goal) {
        return atMost(nums, goal) - atMost(nums, goal - 1);
    }

    private long atMost(int[] nums, int limit) {
        if (limit < 0) return 0;
        int left = 0;
        int window = 0;
        long total = 0;
        for (int right = 0; right < nums.length; right++) {
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
