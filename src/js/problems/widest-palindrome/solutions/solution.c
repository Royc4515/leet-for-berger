// O(n) - Manacher's algorithm. d1[i] is the radius of the longest odd palindrome centered at i,
// d2[i] that of the longest even one whose right middle is i. Inside the rightmost palindrome
// found so far [l, r], the mirror position gives a radius for free.
static int minInt(int a, int b) { return a < b ? a : b; }

char* widestPalindrome(char* s) {
    int n = (int)strlen(s);
    int bestLen = 0, bestStart = 0;
    int* d = malloc(sizeof(int) * (n ? n : 1));

    for (int i = 0, l = 0, r = -1; i < n; i++) {
        int k = i > r ? 1 : minInt(d[l + r - i], r - i + 1);
        while (i - k >= 0 && i + k < n && s[i - k] == s[i + k]) k++;
        d[i] = k;
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

    // The same buffer is reused for the even radii; the odd ones are no longer needed.
    for (int i = 0, l = 0, r = -1; i < n; i++) {
        int k = i > r ? 0 : minInt(d[l + r - i + 1], r - i + 1);
        while (i - k - 1 >= 0 && i + k < n && s[i - k - 1] == s[i + k]) k++;
        d[i] = k;
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
    free(d);

    char* out = malloc(bestLen + 1);
    memcpy(out, s + bestStart, bestLen);
    out[bestLen] = 0;
    return out;
}
