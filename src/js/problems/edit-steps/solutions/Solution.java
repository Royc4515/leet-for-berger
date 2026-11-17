// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0072.Edit%20Distance/Solution.java
class Solution {
    // O(m * n) time, O(n) space: one DP row over prefixes of word2 per letter of word1.
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[] prev = new int[n + 1];
        int[] cur = new int[n + 1];
        for (int j = 0; j <= n; ++j) prev[j] = j;
        for (int i = 1; i <= m; ++i) {
            cur[0] = i;
            for (int j = 1; j <= n; ++j) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    cur[j] = prev[j - 1];
                } else {
                    // Replace, delete from word1, insert into word1.
                    cur[j] = Math.min(prev[j - 1], Math.min(prev[j], cur[j - 1])) + 1;
                }
            }
            int[] t = prev;
            prev = cur;
            cur = t;
        }
        return prev[n];
    }
}
