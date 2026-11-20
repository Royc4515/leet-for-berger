// O(n) time, O(1) space. Rearrangements have identical letter counts, so add for s and subtract
// for t in one table and require all 26 counters to end at zero.
bool sameLetters(char* s, char* t) {
    if (strlen(s) != strlen(t)) return false;
    int count[26] = {0};
    for (int i = 0; s[i]; i++) {
        count[s[i] - 'a']++;
        count[t[i] - 'a']--;
    }
    for (int i = 0; i < 26; i++) {
        if (count[i] != 0) return false;
    }
    return true;
}
