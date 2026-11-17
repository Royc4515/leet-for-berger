// O(n log n) time - tails[k] is the smallest last value of any increasing run of length k + 1.
int lengthOfLis(int* nums, int numsSize) {
    int* tails = malloc(sizeof(int) * numsSize);
    int len = 0;
    for (int i = 0; i < numsSize; i++) {
        int x = nums[i];
        // First tail >= x, not > x: an equal value must not extend a run.
        int lo = 0, hi = len;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (tails[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        // Appends when lo == len; otherwise a smaller ending for the same length.
        tails[lo] = x;
        if (lo == len) len++;
    }
    free(tails);
    return len;
}
