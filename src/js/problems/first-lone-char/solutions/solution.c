// O(n) time, O(1) space: tally all 26 lowercase letters, then return the first index with count 1.
int firstLoneChar(char* s) {
    int counts[26] = {0};
    for (int i = 0; s[i] != '\0'; i++) {
        counts[s[i] - 'a']++;
    }
    for (int i = 0; s[i] != '\0'; i++) {
        if (counts[s[i] - 'a'] == 1) return i;
    }
    return -1;
}
