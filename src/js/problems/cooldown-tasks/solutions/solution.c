// O(len) time - only the counts matter. The most frequent kind (count x) needs x - 1 frames of
// n + 1 slots, then one final slot for each kind that ties for x.
int leastInterval(char* tasks, int n) {
    int cnt[26] = {0};
    int x = 0, len = 0;
    for (; tasks[len]; len++) {
        int c = tasks[len] - 'A';
        if (++cnt[c] > x) x = cnt[c];
    }
    int s = 0;
    for (int i = 0; i < 26; i++) s += cnt[i] == x;
    int framed = (x - 1) * (n + 1) + s;
    // When the other kinds overflow the frames no slot is idle, so the length is the answer.
    return framed > len ? framed : len;
}
