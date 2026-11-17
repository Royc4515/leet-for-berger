class Solution {
public:
    // O(n) time, O(1) extra space - write pointer for the next non-zero slot, read pointer scans.
    vector<int> moveZeroes(vector<int>& nums) {
        size_t write = 0;
        for (size_t read = 0; read < nums.size(); read++) {
            // Swapping (not copying) leaves the zeros behind, so no second fill pass is needed.
            if (nums[read] != 0) swap(nums[write++], nums[read]);
        }
        return nums;
    }
};
