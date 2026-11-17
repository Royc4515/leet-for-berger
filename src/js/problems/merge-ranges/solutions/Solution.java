import java.util.*;

class Solution {
    // O(n log n) time - after sorting by start, a range can only overlap the one being built.
    public int[][] merge(int[][] intervals) {
        // Integer.compare rather than subtraction, which is the habit that avoids overflow bugs.
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] r : intervals) {
            int[] last = merged.isEmpty() ? null : merged.get(merged.size() - 1);
            // `<=` because ranges are closed: [1, 4] and [4, 5] share the point 4.
            if (last != null && r[0] <= last[1]) {
                // max, not r[1]: the current range may already reach past this one.
                last[1] = Math.max(last[1], r[1]);
            } else {
                merged.add(new int[] { r[0], r[1] });
            }
        }
        return merged.toArray(new int[0][]);
    }
}
