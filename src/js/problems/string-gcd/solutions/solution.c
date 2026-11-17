// O(m + n) time - concatenation test, then the gcd-length prefix. The result is malloc'ed.
char* gcdOfStrings(char* str1, char* str2) {
    int m = strlen(str1), n = strlen(str2);
    // If both strings repeat the same x, str1 + str2 equals str2 + str1. Compare the two
    // concatenations position by position instead of building them.
    for (int i = 0; i < m + n; i++) {
        char left = i < m ? str1[i] : str2[i - m];
        char right = i < n ? str2[i] : str1[i - n];
        if (left != right) {
            char* empty = malloc(1);
            empty[0] = '\0';
            return empty;
        }
    }
    // Any common divisor's length divides both lengths, and the gcd-length prefix is one of them.
    int a = m, b = n;
    while (b) {
        int t = a % b;
        a = b;
        b = t;
    }
    char* out = malloc(a + 1);
    memcpy(out, str1, a);
    out[a] = '\0';
    return out;
}
