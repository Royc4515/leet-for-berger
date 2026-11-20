public class Solution {
    // O(n) time: walk from the right end so the words come out already in reverse order. Skipping
    // every space before a word drops leading, trailing and repeated spaces in one move.
    public string FlipWordOrder(string s) {
        // StringBuilder appends in amortized O(1); string concatenation would copy the answer per word.
        var sb = new System.Text.StringBuilder();
        int i = s.Length - 1;
        while (i >= 0) {
            while (i >= 0 && s[i] == ' ') i--;
            if (i < 0) break;
            int end = i;
            while (i >= 0 && s[i] != ' ') i--;
            if (sb.Length > 0) sb.Append(' ');
            sb.Append(s, i + 1, end - i);
        }
        return sb.ToString();
    }
}
