// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2200-2299/2223.Sum%20of%20Scores%20of%20Built%20Strings/Solution.cpp
class Solution {
public:
    // O(n) - the Z-function. z[i] is the score of the suffix at i; [l, r] is the rightmost
    // segment known to equal a prefix, and inside it z values are copied instead of recomputed.
    long long prefixScoreSum(string s) {
        int n = s.size();
        vector<int> z(n);
        for (int i = 1, l = 0, r = 0; i < n; ++i) {
            // s[i..r] equals s[i-l..r-l], so z[i - l] applies, capped at the known segment.
            if (i <= r) z[i] = min(r - i + 1, z[i - l]);
            while (i + z[i] < n && s[z[i]] == s[i + z[i]]) ++z[i];
            if (i + z[i] - 1 > r) {
                l = i;
                r = i + z[i] - 1;
            }
        }
        // long long: for n = 10^5 the total is about 5 * 10^9.
        long long ans = n;
        for (int x : z) ans += x;
        return ans;
    }
};
