// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0187.Repeated%20DNA%20Sequences/Solution.java
import java.util.*;

class Solution {
    // O(n) windows (each substring is 10 characters), then a sort of the repeated ones.
    public List<String> repeatedWindows(String s) {
        Map<String, Integer> cnt = new HashMap<>();
        List<String> ans = new ArrayList<>();
        for (int i = 0; i + 10 <= s.length(); ++i) {
            String t = s.substring(i, i + 10);
            // Report on the second sighting only, so a window seen three times is listed once.
            if (cnt.merge(t, 1, Integer::sum) == 2) {
                ans.add(t);
            }
        }
        // String.compareTo compares UTF-16 units, so this is plain alphabetical order.
        Collections.sort(ans);
        return ans;
    }
}
