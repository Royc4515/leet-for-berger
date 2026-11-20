class Solution {
    // O(n) time, O(1) space: every counted substring straddles one border between two runs, and
    // that border contributes min(left run, right run).
    public int countMatchingBlocks(String s) {
        int prev = 0, cur = 1, total = 0;
        for (int i = 1; i < s.length(); i++) {
            if (s.charAt(i) == s.charAt(i - 1)) {
                cur++;
            } else {
                total += Math.min(prev, cur);
                prev = cur;
                cur = 1;
            }
        }
        // The last run has no character after it to trigger the update above.
        return total + Math.min(prev, cur);
    }
}
