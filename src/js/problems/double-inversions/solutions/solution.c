// O(n log n) - bottom-up merge sort. Before merging two sorted runs, one forward sweep counts,
// for each right-run value, the left-run values above twice it.
long long reversePairs(int* nums, int numsSize) {
    int n = numsSize;
    int* a = malloc(sizeof(int) * (n + 1));
    int* buf = malloc(sizeof(int) * (n + 1));
    memcpy(a, nums, sizeof(int) * n);
    // The count can pass 2^31 (up to about 5 * 10^9 pairs), hence long long.
    long long count = 0;
    for (int width = 1; width < n; width *= 2) {
        for (int lo = 0; lo < n; lo += 2 * width) {
            int mid = lo + width < n ? lo + width : n;
            int hi = lo + 2 * width < n ? lo + 2 * width : n;
            // As the right value grows, the first left value above twice it only moves right.
            int i = lo;
            for (int j = mid; j < hi; j++) {
                // 2LL widens before doubling: 2 * a[j] overflows int near +-2^31.
                while (i < mid && a[i] <= 2LL * a[j]) i++;
                count += mid - i;
            }
            int p = lo, q = mid;
            for (int k = lo; k < hi; k++) buf[k] = (q >= hi || (p < mid && a[p] <= a[q])) ? a[p++] : a[q++];
        }
        int* tmp = a;
        a = buf;
        buf = tmp;
    }
    free(a);
    free(buf);
    return count;
}
