// O(n + m) - Knuth-Morris-Pratt. fail[i] is the length of the longest proper prefix of
// needle[0..i] that is also its suffix: after a mismatch, that much is already matched.
int firstMatchIndex(char* haystack, char* needle) {
    int n = (int)strlen(haystack), m = (int)strlen(needle);
    int* fail = calloc(m, sizeof(int));
    for (int i = 1, k = 0; i < m; i++) {
        while (k > 0 && needle[i] != needle[k]) k = fail[k - 1];
        if (needle[i] == needle[k]) k++;
        fail[i] = k;
    }
    int found = -1;
    // k counts needle characters matched so far; the text pointer never moves back.
    for (int i = 0, k = 0; i < n; i++) {
        while (k > 0 && haystack[i] != needle[k]) k = fail[k - 1];
        if (haystack[i] == needle[k]) k++;
        if (k == m) {
            found = i - m + 1;
            break;
        }
    }
    free(fail);
    return found;
}
