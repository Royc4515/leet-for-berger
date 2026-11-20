class Solution {
    // O(n + max(nums)) - taking a value takes all its copies, so each value is worth
    // v * count[v], and it conflicts only with v - 1 and v + 1: house robber on the value line.
    public int maxPoints(int[] nums) {
        int max = 0;
        for (int v : nums) max = Math.max(max, v);
        int[] total = new int[max + 1];
        for (int v : nums) total[v] += v;
        int skip = 0; // best score using values up to v - 2
        int best = 0; // best score using values up to v - 1
        for (int v = 1; v <= max; v++) {
            // Absent values have total 0, so a gap in the values lets both neighbours be taken.
            int take = skip + total[v];
            skip = best;
            best = Math.max(best, take);
        }
        return best;
    }
}
