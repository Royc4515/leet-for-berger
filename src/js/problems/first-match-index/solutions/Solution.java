class Solution {
    // O(n + m) - Knuth-Morris-Pratt. fail[i] is the length of the longest proper prefix of
    // needle[0..i] that is also its suffix: after a mismatch, that much is already matched.
    // (String.indexOf is a plain scan, quadratic on inputs like "aaaa" searched for "aab".)
    public int firstMatchIndex(String haystack, String needle) {
        char[] t = haystack.toCharArray(), p = needle.toCharArray();
        int m = p.length;
        int[] fail = new int[m];
        for (int i = 1, k = 0; i < m; i++) {
            while (k > 0 && p[i] != p[k]) k = fail[k - 1];
            if (p[i] == p[k]) k++;
            fail[i] = k;
        }
        // k counts needle characters matched so far; the text pointer never moves back.
        for (int i = 0, k = 0; i < t.length; i++) {
            while (k > 0 && t[i] != p[k]) k = fail[k - 1];
            if (t[i] == p[k]) k++;
            if (k == m) return i - m + 1;
        }
        return -1;
    }
}
