// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2400-2499/2466.Count%20Ways%20To%20Build%20Good%20Strings/Solution.cpp
class Solution {
public:
    // O(high) time - different step sequences give different strings, so count sequences:
    // f[i] = f[i - zero] + f[i - one], the last step being a block of 0s or a block of 1s.
    int countGoodStrings(int low, int high, int zero, int one) {
        const int mod = 1e9 + 7;
        vector<int> f(high + 1, 0);
        f[0] = 1;
        long long ans = 0;
        for (int i = 1; i <= high; ++i) {
            // Two residues can sum past 2^31 - 1, so add in 64 bits before reducing.
            long long ways = 0;
            if (i >= zero) ways += f[i - zero];
            if (i >= one) ways += f[i - one];
            f[i] = ways % mod;
            if (i >= low) ans = (ans + f[i]) % mod;
        }
        return ans;
    }
};
