// O(n log n) - ranges that overlap through a chain must share a group, so they form blocks
// (the merged intervals) and each block independently picks group 1 or 2: 2^blocks ways.
static int byStart(const void* x, const void* y) {
    int a = (*(int* const*)x)[0], b = (*(int* const*)y)[0];
    // Comparisons instead of a - b, which is the habit that avoids overflow bugs.
    return (a > b) - (a < b);
}

int countSplits(int** ranges, int rangesSize, int* rangesColSize) {
    const long long MOD = 1000000007LL;
    // Sort a copy of the row pointers: the caller's array is not ours to reorder.
    int** sorted = malloc(sizeof(int*) * rangesSize);
    memcpy(sorted, ranges, sizeof(int*) * rangesSize);
    qsort(sorted, rangesSize, sizeof(int*), byStart);
    int blocks = 0;
    int reach = -1;  // furthest end seen so far
    for (int i = 0; i < rangesSize; i++) {
        // `>` and not `>=`: ranges are closed, so a range starting at `reach` still shares it.
        if (sorted[i][0] > reach) blocks++;
        // max, not sorted[i][1]: a nested range must not shorten the reach of the one around it.
        if (sorted[i][1] > reach) reach = sorted[i][1];
    }
    free(sorted);
    // The modulus is applied while doubling: the power is far beyond any fixed-width integer.
    long long ways = 1;
    for (int i = 0; i < blocks; i++) ways = ways * 2 % MOD;
    return (int)ways;
}
