// O(n + 26 * maxFreq) = O(n) time: fix shared frequency k and multiply (1 + C(f, k)) per letter.
static long long modPow(long long base, long long exp, long long mod) {
    long long res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) res = res * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return res;
}

int countBalancedSubsequences(char* s) {
    const long long MOD = 1000000007LL;
    int counts[26] = {0};
    int maxFreq = 0;
    for (int i = 0; s[i] != '\0'; i++) {
        int f = ++counts[s[i] - 'a'];
        if (f > maxFreq) maxFreq = f;
    }
    int freqs[26];
    int m = 0;
    for (int i = 0; i < 26; i++) {
        if (counts[i] > 0) freqs[m++] = counts[i];
    }

    long long* fact = malloc((size_t)(maxFreq + 1) * sizeof(long long));
    long long* invFact = malloc((size_t)(maxFreq + 1) * sizeof(long long));
    fact[0] = 1;
    for (int i = 1; i <= maxFreq; i++) fact[i] = fact[i - 1] * i % MOD;
    invFact[maxFreq] = modPow(fact[maxFreq], MOD - 2, MOD);
    for (int i = maxFreq; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;

    long long total = 0;
    for (int k = 1; k <= maxFreq; k++) {
        long long ways = 1;
        long long invK = invFact[k];
        for (int i = 0; i < m; i++) {
            int f = freqs[i];
            if (f >= k) {
                long long comb = fact[f] * invK % MOD * invFact[f - k] % MOD;
                ways = ways * (1 + comb) % MOD;
            }
        }
        total = (total + ways - 1 + MOD) % MOD;
    }

    free(fact);
    free(invFact);
    return (int)total;
}
