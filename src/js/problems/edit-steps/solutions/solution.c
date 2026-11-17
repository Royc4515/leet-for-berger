static int min3(int a, int b, int c) {
    int m = a < b ? a : b;
    return m < c ? m : c;
}

// O(m * n) time, O(n) space: one DP row over prefixes of word2 per letter of word1.
int minDistance(char* word1, char* word2) {
    int m = strlen(word1), n = strlen(word2);
    int* prev = malloc(sizeof(int) * (n + 1));
    int* cur = malloc(sizeof(int) * (n + 1));
    for (int j = 0; j <= n; j++) prev[j] = j;
    for (int i = 1; i <= m; i++) {
        cur[0] = i;
        for (int j = 1; j <= n; j++) {
            // Replace, delete from word1, insert into word1.
            cur[j] = word1[i - 1] == word2[j - 1] ? prev[j - 1] : min3(prev[j - 1], prev[j], cur[j - 1]) + 1;
        }
        int* t = prev;
        prev = cur;
        cur = t;
    }
    int answer = prev[n];
    free(prev);
    free(cur);
    return answer;
}
