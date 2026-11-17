class Solution {
public:
    // O(n) time - each run is walked once, from its first number only.
    int longestStreak(vector<int>& nums) {
        unordered_set<long long> values(nums.begin(), nums.end());
        int best = 0;
        for (long long x : values) {
            if (values.count(x - 1)) continue; // not a run start: counted from its first number
            int length = 1;
            while (values.count(x + length)) length++;
            best = max(best, length);
        }
        return best;
    }
};
