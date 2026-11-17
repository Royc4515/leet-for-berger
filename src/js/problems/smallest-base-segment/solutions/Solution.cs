public class Solution {
    // O(n) time, O(n) space - KMP prefix function.
    public string SmallestBaseSegment(string s) {
        int n = s.Length;
        var pi = new int[n];
        for (int i = 1; i < n; i++) {
            int k = pi[i - 1];
            // Fall back through shorter borders until the next char can extend one.
            while (k > 0 && s[i] != s[k]) k = pi[k - 1];
            if (s[i] == s[k]) k++;
            pi[i] = k;
        }
        int period = n - pi[n - 1];
        // A period only builds s from whole copies when it divides n ("ababa" -> itself).
        return n % period == 0 ? s.Substring(0, period) : s;
    }
}
