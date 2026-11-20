class Solution {
public:
    // O(n) time, O(1) extra space, one pass. [0, lo) holds 0s, [lo, mid) holds 1s, (hi, end] holds
    // 2s, and [mid, hi] is still unknown.
    vector<int> flagSort(vector<int>& nums) {
        int lo = 0, mid = 0, hi = (int)nums.size() - 1;
        while (mid <= hi) {
            if (nums[mid] == 0) {
                swap(nums[lo++], nums[mid++]);
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                // mid stays: the value that just arrived from the right end has not been inspected.
                swap(nums[mid], nums[hi--]);
            }
        }
        return nums;
    }
};
