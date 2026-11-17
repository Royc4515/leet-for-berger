// O(high) time - different step sequences give different strings, so count sequences:
// f[i] = f[i - zero] + f[i - one], the last step being a block of 0s or a block of 1s.
int countGoodStrings(int low, int high, int zero, int one) {
    const int mod = 1000000007;
    int* f = calloc(high + 1, sizeof(int));
    f[0] = 1;
    long long ans = 0;
    for (int i = 1; i <= high; i++) {
        // Two residues can sum past 2^31 - 1, so add in 64 bits before reducing.
        long long ways = 0;
        if (i >= zero) ways += f[i - zero];
        if (i >= one) ways += f[i - one];
        f[i] = (int)(ways % mod);
        if (i >= low) ans = (ans + f[i]) % mod;
    }
    free(f);
    return (int)ans;
}
