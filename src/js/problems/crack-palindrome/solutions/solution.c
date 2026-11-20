// O(n) time. Lower the earliest letter that is not 'a'; if the whole first half is 'a', raise the
// last letter to 'b' instead.
char* crackPalindrome(char* palindrome) {
    int n = (int)strlen(palindrome);
    // Always a fresh buffer, even for the empty answer, so the caller can free the result.
    char* out = malloc(n + 1);
    if (n < 2) {
        out[0] = '\0';
        return out;
    }
    memcpy(out, palindrome, n + 1);
    // Only the first half: the middle of an odd palindrome mirrors itself, so lowering it keeps the
    // string a palindrome ("aba" -> "aaa").
    for (int i = 0; i < n / 2; i++) {
        if (out[i] != 'a') {
            out[i] = 'a';
            return out;
        }
    }
    out[n - 1] = 'b';
    return out;
}
