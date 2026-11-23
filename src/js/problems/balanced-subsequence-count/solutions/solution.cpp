class Solution {
    static constexpr long long MOD = 1000000007LL;

    long long modPow(long long base, long long exp) {
        long long res = 1;
        base %= MOD;
        while (exp > 0) {
            if (exp & 1) res = res * base % MOD;
            base = base * base % MOD;
            exp >>= 1;
        }
        return res;
    }

public:
    // O(n + 26 * maxFreq) = O(n) time: fix shared frequency k and multiply (1 + C(f, k)) per letter.
    int countBalancedSubsequences(string s) {
        int counts[26] = {0};
        int maxFreq = 0;
        for (char c : s) {
            int f = ++counts[c - 'a'];
            if (f > maxFreq) maxFreq = f;
        }
        vector<int> freqs;
        for (int c : counts) {
            if (c > 0) freqs.push_back(c);
        }

        vector<long long> fact(maxFreq + 1), invFact(maxFreq + 1);
        fact[0] = 1;
        for (int i = 1; i <= maxFreq; i++) fact[i] = fact[i - 1] * i % MOD;
        invFact[maxFreq] = modPow(fact[maxFreq], MOD - 2);
        for (int i = maxFreq; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;

        long long total = 0;
        for (int k = 1; k <= maxFreq; k++) {
            long long ways = 1;
            long long invK = invFact[k];
            for (int f : freqs) {
                if (f >= k) {
                    long long comb = fact[f] * invK % MOD * invFact[f - k] % MOD;
                    ways = ways * (1 + comb) % MOD;
                }
            }
            total = (total + ways - 1 + MOD) % MOD;
        }
        return (int)total;
    }
};
