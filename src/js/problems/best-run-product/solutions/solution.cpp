// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0152.Maximum%20Product%20Subarray/Solution.cpp
class Solution {
public:
    // O(n) time - a negative factor swaps the largest and smallest products, so keep both.
    long long maxProduct(vector<int>& nums) {
        // 64-bit: products reach 10^15. f: largest, g: smallest product of a run ending here.
        long long f = nums[0], g = nums[0], ans = nums[0];
        for (size_t i = 1; i < nums.size(); ++i) {
            // Use the old f and g for both updates; x alone covers starting a new run (after a 0).
            long long ff = f, gg = g, x = nums[i];
            f = max({x, ff * x, gg * x});
            g = min({x, ff * x, gg * x});
            ans = max(ans, f);
        }
        return ans;
    }
};
