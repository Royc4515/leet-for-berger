// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0249.Group%20Shifted%20Strings/Solution.java
import java.util.*;

class Solution {
    // O(n * k) time: every word is normalized once, then grouped by that key.
    public List<List<String>> groupByShift(String[] words) {
        // LinkedHashMap keeps insertion order, which gives first-appearance group order.
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (String w : words) {
            char[] t = w.toCharArray();
            int diff = t[0] - 'a';
            for (int i = 0; i < t.length; ++i) {
                // Shift back so the word starts with 'a'; a letter that falls below 'a' wraps.
                t[i] = (char) (t[i] - diff);
                if (t[i] < 'a') {
                    t[i] += 26;
                }
            }
            groups.computeIfAbsent(new String(t), k -> new ArrayList<>()).add(w);
        }
        return new ArrayList<>(groups.values());
    }
}
