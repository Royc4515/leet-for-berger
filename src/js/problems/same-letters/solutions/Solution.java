class Solution {
    // O(n) time, O(1) space. Rearrangements have identical letter counts, so add for s and
    // subtract for t in one table and require all 26 counters to end at zero.
    public boolean sameLetters(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;
            count[t.charAt(i) - 'a']--;
        }
        for (int c : count) {
            if (c != 0) return false;
        }
        return true;
    }
}
