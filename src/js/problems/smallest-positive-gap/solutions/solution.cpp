class Solution {
public:
    // O(n) time, O(1) extra space: cyclic placement of each value v in 1..n into index v - 1.
    int smallestPositiveGap(vector<int>& nums) {
        int n = static_cast<int>(nums.size());
        for (int i = 0; i < n; i++) {
            // Check bounds before computing nums[i] - 1 so INT_MIN never overflows.
            while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
                int target = nums[i] - 1;
                swap(nums[i], nums[target]);
            }
        }
        for (int i = 0; i < n; i++) {
            if (nums[i] != i + 1) return i + 1;
        }
        return n + 1;
    }
};
