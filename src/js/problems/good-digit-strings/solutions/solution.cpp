// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1922.Count%20Good%20Numbers/Solution.cpp
class Solution {
public:
    // O(log n) - positions are independent: (n + 1) / 2 even indices with 5 choices and n / 2
    // odd indices with 4.
    int countGoodStrings(long long n) {
        const long long MOD = 1e9 + 7;
        // long long throughout: two residues multiply to about 10^18.
        auto powMod = [&](long long x, long long e) -> long long {
            long long res = 1;
            while (e) {
                if (e & 1) res = res * x % MOD;
                x = x * x % MOD;
                e >>= 1;
            }
            return res;
        };
        return (int)(powMod(5, (n + 1) >> 1) * powMod(4, n >> 1) % MOD);
    }
};
