public class Solution {
    // O(n log n + D) time - each day, attend the available event that ends soonest.
    public int MaxEvents(int[][] events) {
        int[][] sorted = (int[][])events.Clone();
        Array.Sort(sorted, (a, b) => a[0].CompareTo(b[0]));
        var ends = new PriorityQueue<int, int>();
        int attended = 0, i = 0, day = 0, n = sorted.Length;
        while (i < n || ends.Count > 0) {
            // Nothing available: jump to the next start day instead of walking empty days.
            if (ends.Count == 0) day = Math.Max(day, sorted[i][0]);
            while (i < n && sorted[i][0] == day) {
                ends.Enqueue(sorted[i][1], sorted[i][1]);
                i++;
            }
            // Events that ended before today can no longer be attended.
            while (ends.Count > 0 && ends.Peek() < day) ends.Dequeue();
            if (ends.Count > 0) {
                ends.Dequeue();
                attended++;
            }
            day++;
        }
        return attended;
    }
}
