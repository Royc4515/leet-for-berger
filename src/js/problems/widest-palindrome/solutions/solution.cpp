class Solution {
public:
    // O(n) - Manacher's algorithm. d1[i] is the radius of the longest odd palindrome centered at
    // i, d2[i] that of the longest even one whose right middle is i. Inside the rightmost
    // palindrome found so far [l, r], the mirror position gives a radius for free.
    string widestPalindrome(string s) {
        int n = s.size();
        int bestLen = 0, bestStart = 0;
        // Ties go to the leftmost start, whichever order the candidates arrive in.
        auto consider = [&](int len, int start) {
            if (len > bestLen || (len == bestLen && start < bestStart)) {
                bestLen = len;
                bestStart = start;
            }
        };

        vector<int> d1(n);
        for (int i = 0, l = 0, r = -1; i < n; i++) {
            int k = i > r ? 1 : min(d1[l + r - i], r - i + 1);
            while (i - k >= 0 && i + k < n && s[i - k] == s[i + k]) k++;
            d1[i] = k;
            if (i + k - 1 > r) {
                l = i - k + 1;
                r = i + k - 1;
            }
            consider(2 * k - 1, i - k + 1);
        }

        vector<int> d2(n);
        for (int i = 0, l = 0, r = -1; i < n; i++) {
            int k = i > r ? 0 : min(d2[l + r - i + 1], r - i + 1);
            while (i - k - 1 >= 0 && i + k < n && s[i - k - 1] == s[i + k]) k++;
            d2[i] = k;
            if (i + k - 1 > r) {
                l = i - k;
                r = i + k - 1;
            }
            if (k > 0) consider(2 * k, i - k);
        }

        return s.substr(bestStart, bestLen);
    }
};
