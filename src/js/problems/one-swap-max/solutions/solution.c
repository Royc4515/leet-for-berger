// O(d) time - improve the leftmost digit that has a larger digit somewhere to its right.
int maximumSwap(int num) {
    char s[16];
    int n = snprintf(s, sizeof s, "%d", num);
    // d[i] = index of the largest digit in s[i..], the rightmost one on ties.
    int d[16];
    d[n - 1] = n - 1;
    for (int i = n - 2; i >= 0; i--) {
        // '<=' keeps the later copy: swapping with the last 9 of 1993 gives 9913, not 9193.
        d[i] = s[i] <= s[d[i + 1]] ? d[i + 1] : i;
    }
    for (int i = 0; i < n; i++) {
        int j = d[i];
        if (s[i] < s[j]) {
            char t = s[i];
            s[i] = s[j];
            s[j] = t;
            break;
        }
    }
    return atoi(s);
}
