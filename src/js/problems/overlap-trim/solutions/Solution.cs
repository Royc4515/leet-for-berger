public class Solution {
    // O(n log n) time - keeping the interval that ends first leaves the most room for the rest.
    public int EraseOverlapIntervals(int[][] intervals) {
        // CompareTo rather than subtraction, which is the habit that avoids overflow bugs.
        Array.Sort(intervals, (a, b) => a[1].CompareTo(b[1]));
        int ans = intervals.Length;
        // Below every allowed start, so the first interval is always kept.
        int lastEnd = int.MinValue;
        foreach (int[] e in intervals) {
            // '>=' because touching at an endpoint is not an overlap.
            if (e[0] >= lastEnd) {
                ans--;
                lastEnd = e[1];
            }
        }
        return ans;
    }
}
