class Solution {
public:
    // O(n) time, O(1) space. Rearrangements have identical letter counts, so add for s and
    // subtract for t in one table and require all 26 counters to end at zero.
    bool sameLetters(string s, string t) {
        if (s.size() != t.size()) return false;
        int count[26] = {0};
        for (size_t i = 0; i < s.size(); i++) {
            count[s[i] - 'a']++;
            count[t[i] - 'a']--;
        }
        for (int c : count) {
            if (c != 0) return false;
        }
        return true;
    }
};
