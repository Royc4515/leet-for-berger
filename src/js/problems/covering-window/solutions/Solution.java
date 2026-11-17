// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0076.Minimum%20Window%20Substring/Solution.java
class Solution {
    // O(m + n) time - grow right until t is covered, then shrink left while it stays covered.
    public String minWindow(String s, String t) {
        int[] need = new int[128];
        int[] window = new int[128];
        for (char c : t.toCharArray()) {
            ++need[c];
        }
        int m = s.length(), n = t.length();
        // cnt counts window characters that fill a still-needed slot of t; cnt == n means covered.
        int k = -1, mi = m + 1, cnt = 0;
        for (int l = 0, r = 0; r < m; ++r) {
            char c = s.charAt(r);
            if (++window[c] <= need[c]) {
                ++cnt;
            }
            while (cnt == n) {
                // Strictly shorter only: the first window of the minimum length is the leftmost.
                if (r - l + 1 < mi) {
                    mi = r - l + 1;
                    k = l;
                }
                c = s.charAt(l);
                if (window[c] <= need[c]) {
                    --cnt;
                }
                --window[c];
                ++l;
            }
        }
        return k < 0 ? "" : s.substring(k, k + mi);
    }
}
