public class Solution {
    // O(n log n) time - after sorting by start, a range can only overlap the one being built.
    public int[][] Merge(int[][] intervals) {
        // CompareTo rather than subtraction, which is the habit that avoids overflow bugs.
        Array.Sort(intervals, (a, b) => a[0].CompareTo(b[0]));
        var merged = new List<int[]>();
        foreach (int[] r in intervals) {
            // `<=` because ranges are closed: [1, 4] and [4, 5] share the point 4.
            if (merged.Count > 0 && r[0] <= merged[^1][1]) {
                // Math.Max, not r[1]: the current range may already reach past this one.
                merged[^1][1] = Math.Max(merged[^1][1], r[1]);
            } else {
                merged.Add(new[] { r[0], r[1] });
            }
        }
        return merged.ToArray();
    }
}
