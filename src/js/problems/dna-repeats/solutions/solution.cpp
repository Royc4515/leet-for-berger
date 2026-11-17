// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0187.Repeated%20DNA%20Sequences/Solution.cpp
class Solution {
public:
    // O(n) windows (each substring is 10 characters), then a sort of the repeated ones.
    vector<string> repeatedWindows(string s) {
        unordered_map<string, int> cnt;
        vector<string> ans;
        // Signed arithmetic: s.size() - 10 would wrap around for strings shorter than 10.
        for (int i = 0, n = (int)s.size() - 10 + 1; i < n; ++i) {
            auto t = s.substr(i, 10);
            // Report on the second sighting only, so a window seen three times is listed once.
            if (++cnt[t] == 2) {
                ans.emplace_back(t);
            }
        }
        sort(ans.begin(), ans.end());
        return ans;
    }
};
