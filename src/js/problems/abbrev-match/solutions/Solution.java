class Solution {
    // O(n + m) time, O(1) space: two pointers, and a number moves the word pointer without reading
    // the letters it skips (a number can be 10^9, so never expand it).
    public boolean matchesAbbreviation(String word, String abbr) {
        int i = 0, j = 0;
        int n = word.length(), m = abbr.length();
        while (i < n && j < m) {
            char c = abbr.charAt(j);
            if (c >= '0' && c <= '9') {
                // A number may not start with 0, which also rules out the number 0.
                if (c == '0') return false;
                int num = 0; // at most 9 digits, so it fits an int
                while (j < m && abbr.charAt(j) >= '0' && abbr.charAt(j) <= '9') {
                    num = num * 10 + (abbr.charAt(j) - '0');
                    j++;
                }
                i += num; // at most 10^5 + 10^9, still below 2^31
            } else {
                if (word.charAt(i) != c) return false;
                i++;
                j++;
            }
        }
        // Both strings must end together. A skip that overshoots leaves i past the end of word.
        return i == n && j == m;
    }
}
