// O(n log n) time - C has no hash set, so sort and scan; duplicates neither extend nor break a run.
static int cmpInt(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}

int longestStreak(int* nums, int numsSize) {
    if (numsSize == 0) return 0;
    qsort(nums, numsSize, sizeof(int), cmpInt);
    int best = 1, length = 1;
    for (int i = 1; i < numsSize; i++) {
        if (nums[i] == nums[i - 1]) continue;
        // Compare by adding 1 to the smaller value instead of subtracting, so the check stays
        // overflow-free even if the value limits grow.
        if ((long long)nums[i - 1] + 1 == nums[i]) length++;
        else length = 1;
        if (length > best) best = length;
    }
    return best;
}
