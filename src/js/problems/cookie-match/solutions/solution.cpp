// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0455.Assign%20Cookies/Solution.cpp
class Solution {
public:
    // O(n log n + m log m) time - a cookie too small for the least greedy child is useless to all.
    int findContentChildren(vector<int>& g, vector<int>& s) {
        sort(g.begin(), g.end());
        sort(s.begin(), s.end());
        int m = g.size(), n = s.size();
        for (int i = 0, j = 0; i < m; ++i) {
            // Skip cookies that cannot satisfy this child; they cannot satisfy anyone greedier either.
            while (j < n && s[j] < g[i]) {
                ++j;
            }
            if (j++ >= n) {
                return i;
            }
        }
        return m;
    }
};
