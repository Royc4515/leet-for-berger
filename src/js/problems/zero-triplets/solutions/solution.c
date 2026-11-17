// O(n^2) time - sort, fix the smallest value, then two pointers on the rest.
static int cmpInt(const void* x, const void* y) {
    int a = *(const int*)x, b = *(const int*)y;
    // Not a - b: the subtraction can overflow for values far apart.
    return (a > b) - (a < b);
}

int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    int* a = malloc(sizeof(int) * numsSize);
    memcpy(a, nums, sizeof(int) * numsSize);
    qsort(a, numsSize, sizeof(int), cmpInt);
    // The number of triplets is not known up front, so the result grows by doubling.
    int cap = 16, count = 0;
    int** out = malloc(sizeof(int*) * cap);
    for (int i = 0; i < numsSize - 2; i++) {
        // Sorted: once the smallest value is positive, no triplet can reach zero.
        if (a[i] > 0) break;
        // Equal neighbours would produce the same triplets again.
        if (i > 0 && a[i] == a[i - 1]) continue;
        int lo = i + 1, hi = numsSize - 1;
        while (lo < hi) {
            int sum = a[i] + a[lo] + a[hi];
            if (sum < 0) lo++;
            else if (sum > 0) hi--;
            else {
                if (count == cap) {
                    cap *= 2;
                    out = realloc(out, sizeof(int*) * cap);
                }
                out[count] = malloc(sizeof(int) * 3);
                out[count][0] = a[i];
                out[count][1] = a[lo];
                out[count][2] = a[hi];
                count++;
                lo++;
                hi--;
                // Step past repeats of the pair just used, so it is reported once.
                while (lo < hi && a[lo] == a[lo - 1]) lo++;
                while (lo < hi && a[hi] == a[hi + 1]) hi--;
            }
        }
    }
    free(a);
    *returnColumnSizes = malloc(sizeof(int) * (count ? count : 1));
    for (int k = 0; k < count; k++) (*returnColumnSizes)[k] = 3;
    *returnSize = count;
    return out;
}
