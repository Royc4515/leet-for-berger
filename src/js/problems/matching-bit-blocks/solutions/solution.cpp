class Solution {
public:
    // O(n) time, O(1) space: every counted substring straddles one border between two runs, and
    // that border contributes min(left run, right run).
    int countMatchingBlocks(string s) {
        int prev = 0, cur = 1, total = 0;
        for (size_t i = 1; i < s.size(); i++) {
            if (s[i] == s[i - 1]) {
                cur++;
            } else {
                total += min(prev, cur);
                prev = cur;
                cur = 1;
            }
        }
        // The last run has no character after it to trigger the update above.
        return total + min(prev, cur);
    }
};
