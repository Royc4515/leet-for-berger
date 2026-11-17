// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2500-2599/2514.Count%20Anagrams/Solution.cpp
class Solution {
public:
    // O(n + log MOD) - the answer is the product over words of len! / (c_a! * c_b! * ...). Both
    // products are built letter by letter: the i-th letter of a word multiplies the numerator by
    // i, and the k-th copy of a letter multiplies the denominator by k.
    int countArrangements(string s) {
        stringstream ss(s);
        string w;
        // long long, not long: long is 32 bits on some platforms and the products need 64.
        long long ans = 1, mul = 1;
        while (ss >> w) {
            int cnt[26] = {0};
            for (int i = 1; i <= (int)w.size(); ++i) {
                int c = w[i - 1] - 'a';
                ++cnt[c];
                ans = ans * i % MOD;
                mul = mul * cnt[c] % MOD;
            }
        }
        // MOD is prime, so dividing is multiplying by the inverse (Fermat: x^(MOD-2)); one
        // inverse at the end suffices.
        return ans * powMod(mul, MOD - 2) % MOD;
    }

private:
    static constexpr long long MOD = 1e9 + 7;

    long long powMod(long long x, long long n) {
        long long res = 1;
        for (; n; n >>= 1) {
            if (n & 1) res = res * x % MOD;
            x = x * x % MOD;
        }
        return res;
    }
};
