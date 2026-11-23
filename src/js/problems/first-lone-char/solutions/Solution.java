class Solution {
    // O(n) time, O(1) space: tally all 26 lowercase letters, then return the first index with count 1.
    public int firstLoneChar(String s) {
        int[] counts = new int[26];
        int n = s.length();
        for (int i = 0; i < n; i++) {
            counts[s.charAt(i) - 'a']++;
        }
        for (int i = 0; i < n; i++) {
            if (counts[s.charAt(i) - 'a'] == 1) return i;
        }
        return -1;
    }
}
