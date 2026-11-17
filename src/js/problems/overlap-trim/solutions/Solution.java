// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0435.Non-overlapping%20Intervals/Solution.java
import java.util.*;

class Solution {
    // O(n log n) time - keeping the interval that ends first leaves the most room for the rest.
    public int eraseOverlapIntervals(int[][] intervals) {
        // Integer.compare rather than subtraction, which is the habit that avoids overflow bugs.
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
        int ans = intervals.length;
        // Below every allowed start, so the first interval is always kept.
        int lastEnd = Integer.MIN_VALUE;
        for (int[] e : intervals) {
            // '>=' because touching at an endpoint is not an overlap.
            if (e[0] >= lastEnd) {
                --ans;
                lastEnd = e[1];
            }
        }
        return ans;
    }
}
