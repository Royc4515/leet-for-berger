class Solution {
public:
    // O(n) time, O(1) extra space: reverse everything, then fix the two blocks separately.
    vector<int> ringShift(vector<int>& nums, int k) {
        int n = nums.size();
        // Shifting by n puts every value back where it was, so only k mod n matters (k can be 10^9).
        k %= n;
        // The whole reversal brings the last k values to the front, but backwards; so are the rest.
        reverse(nums.begin(), nums.end());
        reverse(nums.begin(), nums.begin() + k);
        reverse(nums.begin() + k, nums.end());
        return nums;
    }
};
