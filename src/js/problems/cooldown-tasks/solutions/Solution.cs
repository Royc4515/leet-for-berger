// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0621.Task%20Scheduler/Solution.cs
public class Solution {
    // O(len) time - only the counts matter. The most frequent kind (count x) needs x - 1 frames of
    // n + 1 slots, then one final slot for each kind that ties for x.
    public int LeastInterval(string tasks, int n) {
        int[] cnt = new int[26];
        int x = 0;
        foreach (char c in tasks) {
            cnt[c - 'A']++;
            x = Math.Max(x, cnt[c - 'A']);
        }
        int s = 0;
        foreach (int v in cnt) {
            s = v == x ? s + 1 : s;
        }
        // When the other kinds overflow the frames no slot is idle, so the length is the answer.
        return Math.Max(tasks.Length, (x - 1) * (n + 1) + s);
    }
}
