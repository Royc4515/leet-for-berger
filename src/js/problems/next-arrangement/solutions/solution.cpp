class Solution {
public:
    // O(n) time, O(1) extra space: pivot = rightmost position that can still grow, swap it with the
    // rightmost larger value, then reverse the suffix so it is as small as possible.
    vector<int> nextArrangement(vector<int>& nums) {
        int n = nums.size();
        int i = n - 2;
        // The suffix after the pivot is non-increasing; strict ">=" keeps equal values from counting as growable.
        while (i >= 0 && nums[i] >= nums[i + 1]) i--;
        if (i >= 0) {
            int j = n - 1;
            while (nums[j] <= nums[i]) j--;
            swap(nums[i], nums[j]);
        }
        // With no pivot (i = -1) this reverses the whole array: the last arrangement wraps to the first.
        reverse(nums.begin() + i + 1, nums.end());
        return nums;
    }
};
