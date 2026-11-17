public class Solution {
    // O(m * n) time, O(n) space: one DP row over prefixes of word2 per letter of word1.
    public int MinDistance(string word1, string word2) {
        int m = word1.Length, n = word2.Length;
        var prev = new int[n + 1];
        var cur = new int[n + 1];
        for (int j = 0; j <= n; j++) prev[j] = j;
        for (int i = 1; i <= m; i++) {
            cur[0] = i;
            for (int j = 1; j <= n; j++) {
                // Replace, delete from word1, insert into word1.
                cur[j] = word1[i - 1] == word2[j - 1] ? prev[j - 1] : Math.Min(prev[j - 1], Math.Min(prev[j], cur[j - 1])) + 1;
            }
            (prev, cur) = (cur, prev);
        }
        return prev[n];
    }
}
