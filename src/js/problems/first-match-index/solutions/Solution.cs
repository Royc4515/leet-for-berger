public class Solution {
    // O(n + m) - Knuth-Morris-Pratt. fail[i] is the length of the longest proper prefix of
    // needle[0..i] that is also its suffix: after a mismatch, that much is already matched.
    public int FirstMatchIndex(string haystack, string needle) {
        int n = haystack.Length, m = needle.Length;
        var fail = new int[m];
        for (int i = 1, k = 0; i < m; i++) {
            while (k > 0 && needle[i] != needle[k]) k = fail[k - 1];
            if (needle[i] == needle[k]) k++;
            fail[i] = k;
        }
        // k counts needle characters matched so far; the text pointer never moves back.
        for (int i = 0, k = 0; i < n; i++) {
            while (k > 0 && haystack[i] != needle[k]) k = fail[k - 1];
            if (haystack[i] == needle[k]) k++;
            if (k == m) return i - m + 1;
        }
        return -1;
    }
}
