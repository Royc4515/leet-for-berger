// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0621.Task%20Scheduler/Solution.cpp
class Solution {
public:
    // O(len) time - only the counts matter. The most frequent kind (count x) needs x - 1 frames of
    // n + 1 slots, then one final slot for each kind that ties for x.
    int leastInterval(string tasks, int n) {
        vector<int> cnt(26);
        int x = 0;
        for (char ch : tasks) {
            int c = ch - 'A';
            ++cnt[c];
            x = max(x, cnt[c]);
        }
        int s = 0;
        for (int v : cnt) {
            s += v == x;
        }
        // When the other kinds overflow the frames no slot is idle, so the length is the answer.
        return max((int)tasks.size(), (x - 1) * (n + 1) + s);
    }
};
