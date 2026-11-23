// O(n log n) time - in sorted order the closest value to any element is one of its neighbours.
static int ascending(const void* x, const void* y) {
    int a = *(const int*)x, b = *(const int*)y;
    // Comparisons instead of a - b, which is the habit that avoids overflow bugs.
    return (a > b) - (a < b);
}

int** minimumAbsDifference(int* arr, int arrSize, int* returnSize, int** returnColumnSizes) {
    // Sort a copy: the caller's array is not ours to reorder.
    int* values = malloc(sizeof(int) * arrSize);
    memcpy(values, arr, sizeof(int) * arrSize);
    qsort(values, arrSize, sizeof(int), ascending);
    // INT_MAX, not 10^6: two values at the ends of the range are 2 * 10^6 apart.
    int best = INT_MAX;
    for (int i = 1; i < arrSize; i++) {
        if (values[i] - values[i - 1] < best) best = values[i] - values[i - 1];
    }
    int count = 0;
    for (int i = 1; i < arrSize; i++) count += values[i] - values[i - 1] == best;
    int** pairs = malloc(sizeof(int*) * count);
    *returnColumnSizes = malloc(sizeof(int) * count);
    // Scanning left to right yields the pairs already in ascending order.
    int k = 0;
    for (int i = 1; i < arrSize; i++) {
        if (values[i] - values[i - 1] != best) continue;
        pairs[k] = malloc(sizeof(int) * 2);
        pairs[k][0] = values[i - 1];
        pairs[k][1] = values[i];
        (*returnColumnSizes)[k++] = 2;
    }
    free(values);
    *returnSize = count;
    return pairs;
}
