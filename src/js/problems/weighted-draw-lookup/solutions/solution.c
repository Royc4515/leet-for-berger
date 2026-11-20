// O(n + q log n) time: prefix sums once, then one binary search per draw.
int* weightedDrawLookup(int* weights, int weightsSize, int* draws, int drawsSize, int* returnSize) {
    int* prefix = malloc(sizeof(int) * weightsSize);
    int total = 0; // at most 10^9, so an int does not overflow
    for (int i = 0; i < weightsSize; i++) {
        total += weights[i];
        prefix[i] = total;
    }
    int* result = malloc(sizeof(int) * drawsSize);
    for (int j = 0; j < drawsSize; j++) {
        int lo = 0;
        int hi = weightsSize - 1;
        // Index i owns [prefix[i - 1], prefix[i]), so the answer is the first prefix strictly above d.
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (prefix[mid] > draws[j]) hi = mid;
            else lo = mid + 1;
        }
        result[j] = lo;
    }
    free(prefix);
    *returnSize = drawsSize;
    return result;
}
