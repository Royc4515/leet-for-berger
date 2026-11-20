public class Solution {
    // O(n + q log n) time: prefix sums once, then one binary search per draw.
    public int[] WeightedDrawLookup(int[] weights, int[] draws) {
        int[] prefix = new int[weights.Length];
        int total = 0; // at most 10^9, so an int does not overflow
        for (int i = 0; i < weights.Length; i++) {
            total += weights[i];
            prefix[i] = total;
        }
        int[] result = new int[draws.Length];
        for (int j = 0; j < draws.Length; j++) {
            int lo = 0;
            int hi = prefix.Length - 1;
            // Index i owns [prefix[i - 1], prefix[i]), so the answer is the first prefix strictly above d.
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (prefix[mid] > draws[j]) hi = mid;
                else lo = mid + 1;
            }
            result[j] = lo;
        }
        return result;
    }
}
