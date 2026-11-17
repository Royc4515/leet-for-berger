// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0068.Text%20Justification/Solution.java
import java.util.*;

class Solution {
    // O(total output) - greedy packing, then spacing rules per line.
    public List<String> justifyText(String[] words, int maxWidth) {
        List<String> ans = new ArrayList<>();
        for (int i = 0, n = words.length; i < n;) {
            // cnt is the line's width with single gaps; take words while that still fits.
            List<String> t = new ArrayList<>();
            t.add(words[i]);
            int cnt = words[i].length();
            ++i;
            while (i < n && cnt + 1 + words[i].length() <= maxWidth) {
                cnt += 1 + words[i].length();
                t.add(words[i++]);
            }
            // The last line and one-word lines are left-aligned (a one-word line has no gap to widen).
            if (i == n || t.size() == 1) {
                String left = String.join(" ", t);
                ans.add(left + " ".repeat(maxWidth - left.length()));
                continue;
            }
            int gaps = t.size() - 1;
            int spaceWidth = maxWidth - (cnt - gaps);
            // Leftmost gaps take the remainder, one extra space each.
            int w = spaceWidth / gaps;
            int m = spaceWidth % gaps;
            StringBuilder row = new StringBuilder();
            for (int j = 0; j < gaps; ++j) {
                row.append(t.get(j));
                row.append(" ".repeat(w + (j < m ? 1 : 0)));
            }
            row.append(t.get(gaps));
            ans.add(row.toString());
        }
        return ans;
    }
}
