public class Solution {
    // O(n log n) - sort by end time; best[i] is the top profit using the first i jobs, either
    // skipping job i or taking it on top of the best schedule that ends by its start.
    public int MaxJobProfit(int[] startTime, int[] endTime, int[] profit) {
        int n = startTime.Length;
        // Sort job indexes by end time: Array.Sort(keys, items) keeps the two arrays aligned.
        var ends = (int[])endTime.Clone();
        var order = new int[n];
        for (int i = 0; i < n; i++) order[i] = i;
        Array.Sort(ends, order);
        var best = new int[n + 1];
        for (int i = 0; i < n; i++) {
            int job = order[i];
            // Count the jobs with end <= start (`<=`: a job may begin exactly when another ends).
            // They all sort before job i because start < end.
            int lo = 0, hi = i;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (ends[mid] <= startTime[job]) lo = mid + 1;
                else hi = mid;
            }
            best[i + 1] = Math.Max(best[i], best[lo] + profit[job]);
        }
        return best[n];
    }
}
