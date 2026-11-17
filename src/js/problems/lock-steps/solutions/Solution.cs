public class Solution {
    // O(10^4 * 8) - BFS over the 10^4 codes, stored as integers. One array marks both dead ends
    // and visited codes, so every check is O(1) however many dead ends there are.
    public int OpenLock(string[] deadends, string target) {
        int goal = int.Parse(target);
        if (goal == 0) {
            return 0;
        }
        var blocked = new bool[10000];
        foreach (var d in deadends) {
            blocked[int.Parse(d)] = true;
        }
        if (blocked[0]) {
            return -1;
        }
        blocked[0] = true;
        var q = new Queue<int>();
        q.Enqueue(0);
        int ans = 0;
        while (q.Count > 0) {
            ++ans;
            for (int n = q.Count; n > 0; --n) {
                int p = q.Dequeue();
                for (int place = 1; place < 10000; place *= 10) {
                    int digit = p / place % 10;
                    // Turning up from 9 wraps to 0 and down from 0 wraps to 9.
                    foreach (int nd in new[] { (digit + 1) % 10, (digit + 9) % 10 }) {
                        int t = p + (nd - digit) * place;
                        if (t == goal) {
                            return ans;
                        }
                        if (!blocked[t]) {
                            blocked[t] = true;
                            q.Enqueue(t);
                        }
                    }
                }
            }
        }
        return -1;
    }
}
