import java.util.*;

class Solution {
    // O(n log n) time - in sorted order the closest value to any element is one of its neighbours.
    public int[][] minimumAbsDifference(int[] arr) {
        int[] values = arr.clone();
        Arrays.sort(values);
        // Integer.MAX_VALUE, not 10^6: two values at the ends of the range are 2 * 10^6 apart.
        int best = Integer.MAX_VALUE;
        for (int i = 1; i < values.length; i++) best = Math.min(best, values[i] - values[i - 1]);
        // Scanning left to right yields the pairs already in ascending order.
        List<int[]> pairs = new ArrayList<>();
        for (int i = 1; i < values.length; i++) {
            if (values[i] - values[i - 1] == best) pairs.add(new int[] {values[i - 1], values[i]});
        }
        return pairs.toArray(new int[0][]);
    }
}
