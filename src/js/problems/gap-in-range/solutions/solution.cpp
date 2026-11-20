class Solution {
public:
    // O(n) time, O(1) space - xor every index 0..n with every value; present numbers cancel in pairs.
    int missingNumber(vector<int>& nums) {
        // Start from n: the loop below only visits the indices 0..n-1.
        int result = (int)nums.size();
        for (int i = 0; i < (int)nums.size(); i++) result ^= i ^ nums[i];
        return result;
    }
};
