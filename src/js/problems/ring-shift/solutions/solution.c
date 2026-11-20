// O(n) time, O(1) extra space: reverse everything, then fix the two blocks separately.
static void reverseRange(int* a, int lo, int hi) {
    while (lo < hi) {
        int t = a[lo];
        a[lo++] = a[hi];
        a[hi--] = t;
    }
}

int* ringShift(int* nums, int numsSize, int k, int* returnSize) {
    int n = numsSize;
    // Shifting by n puts every value back where it was, so only k mod n matters (k can be 10^9).
    k %= n;
    // The whole reversal brings the last k values to the front, but backwards; so are the rest.
    reverseRange(nums, 0, n - 1);
    reverseRange(nums, 0, k - 1);
    reverseRange(nums, k, n - 1);
    // The input array was rewritten in place and is the answer; only its size is reported.
    *returnSize = n;
    return nums;
}
