import java.util.*;

class Solution {
    // O(n) time - each run is walked once, from its first number only.
    public int longestStreak(int[] nums) {
        Set<Integer> values = new HashSet<>();
        for (int x : nums) values.add(x);
        int best = 0;
        for (int x : values) {
            if (values.contains(x - 1)) continue; // not a run start: counted from its first number
            int length = 1;
            while (values.contains(x + length)) length++;
            best = Math.max(best, length);
        }
        return best;
    }
}
