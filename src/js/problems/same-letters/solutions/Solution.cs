public class Solution {
    // O(n) time, O(1) space. Rearrangements have identical letter counts, so add for s and
    // subtract for t in one table and require all 26 counters to end at zero.
    public bool SameLetters(string s, string t) {
        if (s.Length != t.Length) return false;
        int[] count = new int[26];
        for (int i = 0; i < s.Length; i++) {
            count[s[i] - 'a']++;
            count[t[i] - 'a']--;
        }
        foreach (int c in count) {
            if (c != 0) return false;
        }
        return true;
    }
}
