// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0392.Is%20Subsequence/Solution.java
class Solution {
    // O(|s| + |t|) time, O(1) space. Matching each letter of s at its earliest spot in t
    // leaves the most room for the rest, so the greedy scan never needs to backtrack.
    public boolean isSubsequence(String s, String t) {
        int m = s.length(), n = t.length();
        int i = 0;
        for (int j = 0; i < m && j < n; j++) {
            if (s.charAt(i) == t.charAt(j)) i++;
        }
        return i == m;
    }
}
