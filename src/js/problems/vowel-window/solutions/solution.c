// O(n) time - sliding the window adds one character and drops one, so the count updates in O(1).
static int isVowel(char c) {
    return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
}

int maxVowels(char* s, int k) {
    int n = strlen(s);
    int cnt = 0;
    for (int i = 0; i < k; i++) cnt += isVowel(s[i]);
    int ans = cnt;
    for (int i = k; i < n; i++) {
        cnt += isVowel(s[i]) - isVowel(s[i - k]);
        if (cnt > ans) ans = cnt;
    }
    return ans;
}
