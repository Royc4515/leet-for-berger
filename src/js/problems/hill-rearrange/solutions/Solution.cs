public class Solution {
    // O(n^2) worst case (a deeply nested hill re-slices and sorts at every level).
    // Cut into top-level hills, rearrange inside each, then place the pieces largest first.
    public string RearrangeHills(string s) {
        return Solve(s, 0, s.Length);
    }

    // Rearranges the hill s[lo, hi), which may be empty.
    private string Solve(string s, int lo, int hi) {
        var pieces = new List<string>();
        int height = 0;
        int start = lo;
        for (int i = lo; i < hi; i++) {
            height += s[i] == '1' ? 1 : -1;
            if (height == 0) {
                // A piece is "1" + hill + "0": strip the outer pair before recursing, or the
                // recursion would never get smaller.
                pieces.Add("1" + Solve(s, start + 1, i) + "0");
                start = i + 1;
            }
        }
        // No piece is a prefix of another, so plain descending text order is the best
        // concatenation. Ordinal comparison, not the culture's.
        pieces.Sort((a, b) => string.CompareOrdinal(b, a));
        return string.Concat(pieces);
    }
}
