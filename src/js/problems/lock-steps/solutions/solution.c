// O(10^4 * 8) - BFS over the 10^4 codes, stored as integers. One array marks both dead ends
// and visited codes, so every check is O(1) however many dead ends there are.
int openLock(char** deadends, int deadendsSize, char* target) {
    int goal = atoi(target);
    if (goal == 0) return 0;
    char blocked[10000] = {0};
    for (int i = 0; i < deadendsSize; i++) blocked[atoi(deadends[i])] = 1;
    if (blocked[0]) return -1;
    blocked[0] = 1;
    // Every code is queued at most once, so 10^4 slots are enough.
    int q[10000];
    int head = 0, tail = 0;
    q[tail++] = 0;
    for (int ans = 1; head < tail; ans++) {
        int end = tail;
        for (; head < end; head++) {
            int p = q[head];
            for (int place = 1; place < 10000; place *= 10) {
                int digit = p / place % 10;
                // Turning up from 9 wraps to 0 and down from 0 wraps to 9.
                int options[2] = {(digit + 1) % 10, (digit + 9) % 10};
                for (int k = 0; k < 2; k++) {
                    int t = p + (options[k] - digit) * place;
                    if (t == goal) return ans;
                    if (!blocked[t]) {
                        blocked[t] = 1;
                        q[tail++] = t;
                    }
                }
            }
        }
    }
    return -1;
}
