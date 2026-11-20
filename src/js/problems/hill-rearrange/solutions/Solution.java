import java.util.*;

class Solution {
    // O(n^2) worst case (a deeply nested hill re-slices and sorts at every level).
    // Cut into top-level hills, rearrange inside each, then place the pieces largest first.
    public String rearrangeHills(String s) {
        return solve(s, 0, s.length());
    }

    // Rearranges the hill s[lo, hi), which may be empty.
    private String solve(String s, int lo, int hi) {
        List<String> pieces = new ArrayList<>();
        int height = 0;
        int start = lo;
        for (int i = lo; i < hi; i++) {
            height += s.charAt(i) == '1' ? 1 : -1;
            if (height == 0) {
                // A piece is "1" + hill + "0": strip the outer pair before recursing, or the
                // recursion would never get smaller.
                pieces.add("1" + solve(s, start + 1, i) + "0");
                start = i + 1;
            }
        }
        // No piece is a prefix of another, so plain descending text order is the best concatenation.
        pieces.sort(Collections.reverseOrder());
        return String.join("", pieces);
    }
}
