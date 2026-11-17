class Solution {
    // O(n) - Manacher's algorithm. d1[i] is the radius of the longest odd palindrome centered at
    // i, d2[i] that of the longest even one whose right middle is i. Inside the rightmost
    // palindrome found so far [l, r], the mirror position gives a radius for free.
    public String widestPalindrome(String s) {
        int n = s.length();
        // Locals, not fields: nothing may carry over between calls on the same instance.
        int bestLen = 0, bestStart = 0;

        int[] d1 = new int[n];
        for (int i = 0, l = 0, r = -1; i < n; i++) {
            int k = i > r ? 1 : Math.min(d1[l + r - i], r - i + 1);
            while (i - k >= 0 && i + k < n && s.charAt(i - k) == s.charAt(i + k)) k++;
            d1[i] = k;
            if (i + k - 1 > r) {
                l = i - k + 1;
                r = i + k - 1;
            }
            // Ties go to the leftmost start: a later center of the same length starts later.
            if (2 * k - 1 > bestLen) {
                bestLen = 2 * k - 1;
                bestStart = i - k + 1;
            }
        }

        int[] d2 = new int[n];
        for (int i = 0, l = 0, r = -1; i < n; i++) {
            int k = i > r ? 0 : Math.min(d2[l + r - i + 1], r - i + 1);
            while (i - k - 1 >= 0 && i + k < n && s.charAt(i - k - 1) == s.charAt(i + k)) k++;
            d2[i] = k;
            if (i + k - 1 > r) {
                l = i - k;
                r = i + k - 1;
            }
            // Strictly longer is enough: an even length never equals an odd one, and within this
            // loop a later center starts later.
            if (2 * k > bestLen) {
                bestLen = 2 * k;
                bestStart = i - k;
            }
        }

        return s.substring(bestStart, bestStart + bestLen);
    }
}
