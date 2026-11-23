class Solution {
public:
    // O(n) average time, O(n) space: reserve once to avoid rehashes and stop on the first duplicate.
    bool hasRepeat(vector<int>& nums) {
        unordered_set<int> seen;
        seen.reserve(nums.size() * 2);
        for (int v : nums) {
            if (!seen.insert(v).second) return true;
        }
        return false;
    }
};
