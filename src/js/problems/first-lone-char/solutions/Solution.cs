public class Solution {
    // O(n) time, O(1) space: tally all 26 lowercase letters, then return the first index with count 1.
    public int FirstLoneChar(string s) {
        int[] counts = new int[26];
        for (int i = 0; i < s.Length; i++) {
            counts[s[i] - 'a']++;
        }
        for (int i = 0; i < s.Length; i++) {
            if (counts[s[i] - 'a'] == 1) return i;
        }
        return -1;
    }
}
