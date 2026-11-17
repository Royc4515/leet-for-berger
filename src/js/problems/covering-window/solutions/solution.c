// O(m + n) time - grow right until t is covered, then shrink left while it stays covered.
// The result is malloc'ed (also when empty); the caller frees it.
char* minWindow(char* s, char* t) {
    int need[128] = {0};
    int window[128] = {0};
    int m = strlen(s), n = strlen(t);
    for (int i = 0; i < n; i++) need[(unsigned char)t[i]]++;
    // cnt counts window characters that fill a still-needed slot of t; cnt == n means covered.
    int k = -1, mi = m + 1, cnt = 0;
    for (int l = 0, r = 0; r < m; r++) {
        unsigned char c = (unsigned char)s[r];
        if (++window[c] <= need[c]) cnt++;
        while (cnt == n) {
            // Strictly shorter only: the first window of the minimum length is the leftmost.
            if (r - l + 1 < mi) {
                mi = r - l + 1;
                k = l;
            }
            c = (unsigned char)s[l];
            if (window[c] <= need[c]) cnt--;
            window[c]--;
            l++;
        }
    }
    int len = k < 0 ? 0 : mi;
    char* out = malloc(len + 1);
    if (len) memcpy(out, s + k, len);
    out[len] = '\0';
    return out;
}
