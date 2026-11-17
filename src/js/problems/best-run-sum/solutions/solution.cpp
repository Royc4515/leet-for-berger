// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0053.Maximum%20Subarray/Solution.cpp
class Solution {
public:
    // O(n) time - the best run ending at i either extends the one ending at i - 1 or starts at i.
    int maxSubArray(vector<int>& nums) {
        // Start from nums[0], not 0: the run must be non-empty, so all-negative input stays negative.
        int ans = nums[0], run = nums[0];
        for (size_t i = 1; i < nums.size(); ++i) {
            // A negative running sum only drags the next element down, so drop it.
            run = max(run, 0) + nums[i];
            ans = max(ans, run);
        }
        return ans;
    }
};
