class Solution {
public:
    // O(n) time, O(1) extra space - compact the array in place, then return the kept prefix.
    vector<int> removeDuplicates(vector<int>& nums) {
        size_t write = 0;
        for (size_t read = 0; read < nums.size(); read++) {
            // Sorted input: the last kept value is the only one a new value can repeat.
            if (write == 0 || nums[read] != nums[write - 1]) nums[write++] = nums[read];
        }
        nums.resize(write);
        return nums;
    }
};
