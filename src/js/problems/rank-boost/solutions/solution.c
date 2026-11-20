// Compare instead of subtracting: a difference of two values near 10^9 can overflow an int.
static int cmpInt(const void* a, const void* b) {
    int x = *(const int*)a;
    int y = *(const int*)b;
    return (x > y) - (x < y);
}

// O(n log n) time. Sorted, the cheapest win for the smallest unbeaten value is the next larger
// one, so one forward pointer finds every match.
int rankBoost(int* nums, int numsSize) {
    qsort(nums, numsSize, sizeof(int), cmpInt);
    int j = 0;
    // j never passes the current index, so nums[j] is always a value already seen or equal to nums[i].
    for (int i = 0; i < numsSize; i++) {
        if (nums[i] > nums[j]) j++;
    }
    return j;
}
