class Solution {
public:
    // O(n) time, O(n) space - one pass, value -> index.
    vector<int> pairSum(vector<int>& nums, int target) {
        unordered_map<long long, int> seen;
        seen.reserve(nums.size() * 2);
        for (int j = 0; j < (int)nums.size(); j++) {
            // 64-bit arithmetic: target - nums[j] can leave the 32-bit range.
            auto it = seen.find((long long)target - nums[j]);
            if (it != seen.end()) return {it->second, j};
            seen[nums[j]] = j;
        }
        return {};
    }
};
