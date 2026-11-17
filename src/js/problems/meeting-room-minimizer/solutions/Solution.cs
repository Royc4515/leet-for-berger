public class Solution {
    // O(n log n) time - only the order of start and end events matters, not which meeting owns them.
    public int MinMeetingRooms(int[][] intervals) {
        int n = intervals.Length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) {
            starts[i] = intervals[i][0];
            ends[i] = intervals[i][1];
        }
        Array.Sort(starts);
        Array.Sort(ends);
        int rooms = 0, e = 0;
        foreach (int s in starts) {
            // ends[e] is the earliest time a busy room frees up. `<` because a meeting ending at s
            // has already left its room, so the new meeting can take it.
            if (s < ends[e]) rooms++;
            else e++;
        }
        return rooms;
    }
}
