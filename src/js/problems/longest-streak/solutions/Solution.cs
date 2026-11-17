public class Solution {
    // O(n) time - each run is walked once, from its first number only.
    public int LongestStreak(int[] nums) {
        var values = new HashSet<long>();
        foreach (var x in nums) values.Add(x);
        int best = 0;
        foreach (var x in values) {
            if (values.Contains(x - 1)) continue; // not a run start: counted from its first number
            int length = 1;
            while (values.Contains(x + length)) length++;
            best = Math.Max(best, length);
        }
        return best;
    }
}
