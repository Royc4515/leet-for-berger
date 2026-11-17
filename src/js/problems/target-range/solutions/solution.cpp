// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0034.Find%20First%20and%20Last%20Position%20of%20Element%20in%20Sorted%20Array/Solution.cpp
class Solution {
public:
    // O(log n) time - two lower bounds: the first index >= target and the first index >= target + 1.
    vector<int> searchRange(vector<int>& nums, int target) {
        // target + 1 cannot overflow: |target| <= 10^9.
        int l = lower_bound(nums.begin(), nums.end(), target) - nums.begin();
        int r = lower_bound(nums.begin(), nums.end(), target + 1) - nums.begin();
        // An empty run [l, r) means the target is absent.
        if (l == r) {
            return {-1, -1};
        }
        return {l, r - 1};
    }
};
