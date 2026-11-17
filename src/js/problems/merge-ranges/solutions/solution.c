// O(n log n) time - after sorting by start, a range can only overlap the one being built.
static int byStart(const void* x, const void* y) {
    int a = (*(int* const*)x)[0], b = (*(int* const*)y)[0];
    // Comparisons instead of a - b, which is the habit that avoids overflow bugs.
    return (a > b) - (a < b);
}

int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {
    // Sort a copy of the row pointers: the caller's array is not ours to reorder.
    int** sorted = malloc(sizeof(int*) * intervalsSize);
    memcpy(sorted, intervals, sizeof(int*) * intervalsSize);
    qsort(sorted, intervalsSize, sizeof(int*), byStart);
    int** out = malloc(sizeof(int*) * intervalsSize);
    int count = 0;
    for (int i = 0; i < intervalsSize; i++) {
        int start = sorted[i][0], end = sorted[i][1];
        // `<=` because ranges are closed: [1, 4] and [4, 5] share the point 4.
        if (count > 0 && start <= out[count - 1][1]) {
            // max, not end: the current range may already reach past this one.
            if (end > out[count - 1][1]) out[count - 1][1] = end;
        } else {
            out[count] = malloc(sizeof(int) * 2);
            out[count][0] = start;
            out[count][1] = end;
            count++;
        }
    }
    free(sorted);
    *returnColumnSizes = malloc(sizeof(int) * (count ? count : 1));
    for (int i = 0; i < count; i++) (*returnColumnSizes)[i] = 2;
    *returnSize = count;
    return out;
}
