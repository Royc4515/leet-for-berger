// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0621.Task%20Scheduler/Solution.java
class Solution {
    // O(len) time - only the counts matter. The most frequent kind (count x) needs x - 1 frames of
    // n + 1 slots, then one final slot for each kind that ties for x.
    public int leastInterval(String tasks, int n) {
        int[] cnt = new int[26];
        int x = 0;
        for (int i = 0; i < tasks.length(); i++) {
            int c = tasks.charAt(i) - 'A';
            ++cnt[c];
            x = Math.max(x, cnt[c]);
        }
        int s = 0;
        for (int v : cnt) {
            if (v == x) {
                ++s;
            }
        }
        // When the other kinds overflow the frames no slot is idle, so the length is the answer.
        return Math.max(tasks.length(), (x - 1) * (n + 1) + s);
    }
}
