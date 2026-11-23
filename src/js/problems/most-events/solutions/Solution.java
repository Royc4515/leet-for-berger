import java.util.*;

class Solution {
    // O(n log n + D) time - each day, attend the available event that ends soonest.
    public int maxEvents(int[][] events) {
        int[][] sorted = events.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[0], b[0]));
        PriorityQueue<Integer> ends = new PriorityQueue<>();
        int attended = 0, i = 0, day = 0, n = sorted.length;
        while (i < n || !ends.isEmpty()) {
            // Nothing available: jump to the next start day instead of walking empty days.
            if (ends.isEmpty()) day = Math.max(day, sorted[i][0]);
            while (i < n && sorted[i][0] == day) ends.add(sorted[i++][1]);
            // Events that ended before today can no longer be attended.
            while (!ends.isEmpty() && ends.peek() < day) ends.poll();
            if (!ends.isEmpty()) {
                ends.poll();
                attended++;
            }
            day++;
        }
        return attended;
    }
}
