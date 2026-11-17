public class Solution {
    // O(n + m) - Kahn's topological order. f[i] is the month course i finishes: its own time
    // plus the latest finish among its prerequisites, final once all of them are processed.
    public int MinimumTime(int n, int[][] relations, int[] time) {
        var g = new List<int>[n];
        for (int i = 0; i < n; ++i) {
            g[i] = new List<int>();
        }
        var indeg = new int[n];
        foreach (var e in relations) {
            g[e[0] - 1].Add(e[1] - 1);
            ++indeg[e[1] - 1];
        }
        var q = new Queue<int>();
        var f = new int[n];
        int ans = 0;
        for (int i = 0; i < n; ++i) {
            if (indeg[i] == 0) {
                q.Enqueue(i);
                f[i] = time[i];
                ans = Math.Max(ans, time[i]);
            }
        }
        while (q.Count > 0) {
            int i = q.Dequeue();
            foreach (int j in g[i]) {
                f[j] = Math.Max(f[j], f[i] + time[j]);
                ans = Math.Max(ans, f[j]);
                if (--indeg[j] == 0) {
                    q.Enqueue(j);
                }
            }
        }
        return ans;
    }
}
