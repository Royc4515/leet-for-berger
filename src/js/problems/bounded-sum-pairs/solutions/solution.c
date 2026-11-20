// O(n log n) time: positions do not matter, so sort a copy and count pairs with a sum of at most x
// using two pointers. The window [lower, upper] is count(upper) - count(lower - 1).
static int cmpInt(const void* x, const void* y) {
    int a = *(const int*)x;
    int b = *(const int*)y;
    return (a > b) - (a < b); // not a - b: the difference of two ints can overflow
}

// A sum of two values is within +-2 * 10^9, which fits in an int; the count does not.
static long long atMost(const int* a, int n, int limit) {
    long long count = 0;
    int lo = 0;
    int hi = n - 1;
    while (lo < hi) {
        if (a[lo] + a[hi] <= limit) {
            // a[lo] pairs with every index in (lo, hi]: all of them are at most a[hi].
            count += hi - lo;
            lo++;
        } else {
            hi--;
        }
    }
    return count;
}

long long countBoundedPairs(int* nums, int numsSize, int lower, int upper) {
    int* a = malloc(sizeof(int) * numsSize);
    memcpy(a, nums, sizeof(int) * numsSize);
    qsort(a, numsSize, sizeof(int), cmpInt);
    long long result = atMost(a, numsSize, upper) - atMost(a, numsSize, lower - 1);
    free(a);
    return result;
}
