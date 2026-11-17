// O(n log n) time, O(n) space - C has no hash map, so sort indices by value and close in
// from both ends.
static int* sortKeys;

static int cmpByValue(const void* a, const void* b) {
    int x = sortKeys[*(const int*)a], y = sortKeys[*(const int*)b];
    return (x > y) - (x < y);
}

int* pairSum(int* nums, int numsSize, int target, int* returnSize) {
    int* order = malloc(sizeof(int) * numsSize);
    for (int i = 0; i < numsSize; i++) order[i] = i;
    sortKeys = nums;
    qsort(order, numsSize, sizeof(int), cmpByValue);
    int lo = 0, hi = numsSize - 1;
    int* result = malloc(sizeof(int) * 2);
    *returnSize = 0;
    while (lo < hi) {
        // 64-bit sum: two values near 10^9 overflow a 32-bit int.
        long long sum = (long long)nums[order[lo]] + nums[order[hi]];
        if (sum == target) {
            int a = order[lo], b = order[hi];
            result[0] = a < b ? a : b;
            result[1] = a < b ? b : a;
            *returnSize = 2;
            break;
        }
        if (sum < target) lo++; else hi--;
    }
    free(order);
    return result;
}
