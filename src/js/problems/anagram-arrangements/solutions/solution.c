// O(n + log MOD) - the answer is the product over words of len! / (c_a! * c_b! * ...). Both
// products are built letter by letter: the i-th letter of a word multiplies the numerator by i,
// and the k-th copy of a letter multiplies the denominator by k.
static const long long MOD = 1000000007LL;

static long long powMod(long long x, long long n) {
    long long res = 1;
    for (; n > 0; n >>= 1) {
        if (n & 1) res = res * x % MOD;
        x = x * x % MOD;
    }
    return res;
}

int countArrangements(char* s) {
    long long ans = 1, mul = 1;
    int cnt[26] = {0};
    int pos = 0;
    for (char* p = s;; p++) {
        // A space or the end of the string closes the current word.
        if (*p == ' ' || *p == 0) {
            memset(cnt, 0, sizeof(cnt));
            pos = 0;
            if (*p == 0) break;
            continue;
        }
        ans = ans * (++pos) % MOD;
        mul = mul * (++cnt[*p - 'a']) % MOD;
    }
    // MOD is prime, so dividing is multiplying by the inverse (Fermat: x^(MOD-2)); one inverse
    // at the end suffices.
    return (int)(ans * powMod(mul, MOD - 2) % MOD);
}
