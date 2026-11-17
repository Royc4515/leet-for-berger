// Binary exponentiation; long long throughout because two residues multiply to about 10^18.
static long long powMod(long long x, long long e) {
    const long long MOD = 1000000007LL;
    long long res = 1;
    while (e) {
        if (e & 1) res = res * x % MOD;
        x = x * x % MOD;
        e >>= 1;
    }
    return res;
}

// O(log n) - positions are independent: (n + 1) / 2 even indices with 5 choices and n / 2 odd
// indices with 4.
int countGoodStrings(long long n) {
    return (int)(powMod(5, (n + 1) >> 1) * powMod(4, n >> 1) % 1000000007LL);
}
