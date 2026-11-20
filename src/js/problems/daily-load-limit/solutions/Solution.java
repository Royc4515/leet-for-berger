class Solution {
    // O(n log(sum)) time: if a limit works, every larger limit works, so binary search the smallest
    // limit whose greedy pass needs at most `days` days.
    public int minDailyLimit(int[] weights, int days) {
        // Every package must fit on a day by itself, and one day carries everything at the total.
        int lo = 0;
        int hi = 0; // at most 10^9, so an int does not overflow
        for (int w : weights) {
            lo = Math.max(lo, w);
            hi += w;
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (fits(weights, days, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private boolean fits(int[] weights, int days, int limit) {
        int used = 1;
        int load = 0;
        for (int w : weights) {
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
