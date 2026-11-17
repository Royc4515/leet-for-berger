// O(n) time - a negative factor swaps the largest and smallest products, so keep both.
static long long max3(long long a, long long b, long long c) {
    long long m = a > b ? a : b;
    return m > c ? m : c;
}

static long long min3(long long a, long long b, long long c) {
    long long m = a < b ? a : b;
    return m < c ? m : c;
}

long long maxProduct(int* nums, int numsSize) {
    // 64-bit: products reach 10^15. f: largest, g: smallest product of a run ending here.
    long long f = nums[0], g = nums[0], ans = nums[0];
    for (int i = 1; i < numsSize; i++) {
        // Use the old f and g for both updates; x alone covers starting a new run (after a 0).
        long long x = nums[i], ff = f, gg = g;
        f = max3(x, ff * x, gg * x);
        g = min3(x, ff * x, gg * x);
        if (f > ans) ans = f;
    }
    return ans;
}
