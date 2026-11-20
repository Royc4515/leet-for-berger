class Solution {
public:
    // O(n log n) - sort by end time; best[i] is the top profit using the first i jobs, either
    // skipping job i or taking it on top of the best schedule that ends by its start.
    int maxJobProfit(vector<int>& startTime, vector<int>& endTime, vector<int>& profit) {
        int n = startTime.size();
        // Sort job indexes, not three arrays: the three arrays must stay aligned.
        vector<int> order(n);
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return endTime[a] < endTime[b]; });
        vector<int> ends(n);
        for (int i = 0; i < n; i++) ends[i] = endTime[order[i]];
        vector<int> best(n + 1, 0);
        for (int i = 0; i < n; i++) {
            int job = order[i];
            // upper_bound counts the jobs with end <= start (a job may begin exactly when another
            // ends). They all sort before job i because start < end.
            int compatible = upper_bound(ends.begin(), ends.end(), startTime[job]) - ends.begin();
            best[i + 1] = max(best[i], best[compatible] + profit[job]);
        }
        return best[n];
    }
};
