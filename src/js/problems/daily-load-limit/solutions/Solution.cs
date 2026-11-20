public class Solution {
    // O(n log(sum)) time: if a limit works, every larger limit works, so binary search the smallest
    // limit whose greedy pass needs at most `days` days.
    public int MinDailyLimit(int[] weights, int days) {
        // Every package must fit on a day by itself, and one day carries everything at the total.
        int lo = 0;
        int hi = 0; // at most 10^9, so an int does not overflow
        foreach (int w in weights) {
            lo = Math.Max(lo, w);
            hi += w;
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (Fits(weights, days, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private bool Fits(int[] weights, int days, int limit) {
        int used = 1;
        int load = 0;
        foreach (int w in weights) {
            // A load equal to the limit is allowed, so a new day starts only when it would be passed.
            if (load + w > limit) {
                used++;
                load = 0;
            }
            load += w;
        }
        return used <= days;
    }
}
