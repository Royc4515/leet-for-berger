public class Solution {
    // O(n log n) time - in sorted order the closest value to any element is one of its neighbours.
    public int[][] MinimumAbsDifference(int[] arr) {
        int[] values = (int[])arr.Clone();
        Array.Sort(values);
        // int.MaxValue, not 10^6: two values at the ends of the range are 2 * 10^6 apart.
        int best = int.MaxValue;
        for (int i = 1; i < values.Length; i++) best = Math.Min(best, values[i] - values[i - 1]);
        // Scanning left to right yields the pairs already in ascending order.
        var pairs = new List<int[]>();
        for (int i = 1; i < values.Length; i++) {
            if (values[i] - values[i - 1] == best) pairs.Add(new[] { values[i - 1], values[i] });
        }
        return pairs.ToArray();
    }
}
