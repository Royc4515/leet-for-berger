class Solution {
    long long atMost(const vector<int>& nums, int limit) {
        if (limit < 0) return 0;
        int left = 0;
        int window = 0;
        long long total = 0;
        for (int right = 0; right < static_cast<int>(nums.size()); right++) {
            window += nums[right];
            while (window > limit) {
                window -= nums[left];
                left++;
            }
            total += right - left + 1;
        }
        return total;
    }

public:
    // O(n) time, O(1) extra space: exact sum == goal equals atMost(goal) - atMost(goal - 1).
    long long countBitSubarrays(vector<int>& nums, int goal) {
        return atMost(nums, goal) - atMost(nums, goal - 1);
    }
};
