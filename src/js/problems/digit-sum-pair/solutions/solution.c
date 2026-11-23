// O(n) time - only the two largest numbers of a digit-sum group can form its best pair, so
// remembering the largest number seen per digit sum (at most 81 sums) is enough.
int maximumSum(int* nums, int numsSize) {
    int largest[82] = {0};
    int best = -1;
    for (int i = 0; i < numsSize; i++) {
        int v = nums[i], s = 0;
        for (int x = v; x > 0; x /= 10) s += x % 10;
        // 0 means "nothing seen yet": every number is at least 1. The sum is at most 2 * 10^9,
        // which still fits in an int.
        if (largest[s] > 0 && largest[s] + v > best) best = largest[s] + v;
        if (v > largest[s]) largest[s] = v;
    }
    return best;
}
