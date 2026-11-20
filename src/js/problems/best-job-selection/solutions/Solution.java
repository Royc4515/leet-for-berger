import java.util.*;

class Solution {
    // O(n log n) - sort by end time; best[i] is the top profit using the first i jobs, either
    // skipping job i or taking it on top of the best schedule that ends by its start.
    public int maxJobProfit(int[] startTime, int[] endTime, int[] profit) {
        int n = startTime.length;
        // Sort job indexes by end time without boxing: pack (end, index) into one long. An end is
        // below 2^30 and an index below 2^17, so the key keeps both and orders by end first.
        long[] keys = new long[n];
        for (int i = 0; i < n; i++) keys[i] = ((long) endTime[i] << 17) | i;
        Arrays.sort(keys);
        int[] order = new int[n];
        int[] ends = new int[n];
        for (int i = 0; i < n; i++) {
            order[i] = (int) (keys[i] & ((1 << 17) - 1));
            ends[i] = endTime[order[i]];
        }
        int[] best = new int[n + 1];
        for (int i = 0; i < n; i++) {
            int job = order[i];
            // Count the jobs with end <= start (`<=`: a job may begin exactly when another ends).
            // They all sort before job i because start < end.
            int lo = 0, hi = i;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (ends[mid] <= startTime[job]) lo = mid + 1;
                else hi = mid;
            }
            best[i + 1] = Math.max(best[i], best[lo] + profit[job]);
        }
        return best[n];
    }
}
