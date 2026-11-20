// O(n log n) - sort by end time; best[i] is the top profit using the first i jobs, either
// skipping job i or taking it on top of the best schedule that ends by its start.
typedef struct {
    int start, end, profit;
} Job;

static int byEnd(const void* x, const void* y) {
    int a = ((const Job*)x)->end, b = ((const Job*)y)->end;
    // Comparisons instead of a - b, which is the habit that avoids overflow bugs.
    return (a > b) - (a < b);
}

int maxJobProfit(int* startTime, int startTimeSize, int* endTime, int endTimeSize, int* profit, int profitSize) {
    int n = startTimeSize;
    // One struct per job so the three values move together when sorting.
    Job* jobs = malloc(sizeof(Job) * n);
    for (int i = 0; i < n; i++) {
        jobs[i].start = startTime[i];
        jobs[i].end = endTime[i];
        jobs[i].profit = profit[i];
    }
    qsort(jobs, n, sizeof(Job), byEnd);
    int* best = calloc(n + 1, sizeof(int));
    for (int i = 0; i < n; i++) {
        // Count the jobs with end <= start (`<=`: a job may begin exactly when another ends).
        // They all sort before job i because start < end.
        int lo = 0, hi = i;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (jobs[mid].end <= jobs[i].start) lo = mid + 1;
            else hi = mid;
        }
        int take = best[lo] + jobs[i].profit;
        best[i + 1] = take > best[i] ? take : best[i];
    }
    int result = best[n];
    free(jobs);
    free(best);
    return result;
}
