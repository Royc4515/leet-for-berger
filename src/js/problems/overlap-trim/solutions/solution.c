// O(n log n) time - keeping the interval that ends first leaves the most room for the rest.
static int byEnd(const void* x, const void* y) {
    int a = (*(int* const*)x)[1], b = (*(int* const*)y)[1];
    // Comparisons instead of a - b, which is the habit that avoids overflow bugs.
    return (a > b) - (a < b);
}

int eraseOverlapIntervals(int** intervals, int intervalsSize, int* intervalsColSize) {
    // Sorting the row pointers is enough; the rows themselves stay put.
    qsort(intervals, intervalsSize, sizeof(int*), byEnd);
    int ans = intervalsSize;
    // Below every allowed start, so the first interval is always kept.
    int lastEnd = INT_MIN;
    for (int i = 0; i < intervalsSize; i++) {
        // '>=' because touching at an endpoint is not an overlap.
        if (intervals[i][0] >= lastEnd) {
            ans--;
            lastEnd = intervals[i][1];
        }
    }
    return ans;
}
