// O(n log(sum)) time: if a limit works, every larger limit works, so binary search the smallest
// limit whose greedy pass needs at most `days` days.
static bool fits(const int* weights, int n, int days, int limit) {
    int used = 1;
    int load = 0;
    for (int i = 0; i < n; i++) {
        // A load equal to the limit is allowed, so a new day starts only when it would be passed.
        if (load + weights[i] > limit) {
            used++;
            load = 0;
        }
        load += weights[i];
    }
    return used <= days;
}

int minDailyLimit(int* weights, int weightsSize, int days) {
    // Every package must fit on a day by itself, and one day carries everything at the total.
    int lo = 0;
    int hi = 0; // at most 10^9, so an int does not overflow
    for (int i = 0; i < weightsSize; i++) {
        if (weights[i] > lo) lo = weights[i];
        hi += weights[i];
    }
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (fits(weights, weightsSize, days, mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
